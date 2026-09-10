from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import io
import zipfile
import json
import bcrypt
import jwt
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ==================== AUTH CONFIG ====================

JWT_SECRET = os.environ.get('JWT_SECRET', 'cupim-na-telha-dev-secret-change-me')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "admin123"

# ==================== BACKUP CONFIG ====================

BACKUP_DIR = Path(os.environ.get('BACKUP_DIR', '/data/backups'))
BACKUP_HOUR = int(os.environ.get('BACKUP_HOUR', '23'))
BACKUP_MAX_FILES = 30

# Paths that do not require authentication
PUBLIC_PATHS = {"/api/auth/login", "/api/", ""}

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    username = payload.get("sub")
    user = await db.users.find_one({"username": username}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if request.method == "OPTIONS" or path in PUBLIC_PATHS:
            return await call_next(request)

        if path.startswith("/api/"):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return _unauthorized_response("Not authenticated")

            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_access_token(token)
            except jwt.ExpiredSignatureError:
                return _unauthorized_response("Token expirado")
            except jwt.InvalidTokenError:
                return _unauthorized_response("Token inválido")

            user = await db.users.find_one({"username": payload.get("sub")}, {"_id": 0})
            if not user:
                return _unauthorized_response("Usuário não encontrado")

        return await call_next(request)


def _unauthorized_response(detail: str):
    from starlette.responses import JSONResponse
    return JSONResponse(status_code=401, content={"detail": detail})


# Create the main app without a prefix
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== WEBSOCKET MANAGER ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, resource: str, resource_id: str = None):
        message = json.dumps({
            "event": event_type,
            "resource": resource,
            "id": resource_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

ws_manager = ConnectionManager()

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    try:
        payload = decode_access_token(token)
    except jwt.InvalidTokenError:
        await websocket.close(code=4401)
        return

    user = await db.users.find_one({"username": payload.get("sub")}, {"_id": 0})
    if not user:
        await websocket.close(code=4401)
        return

    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# ==================== MODELS ====================

# Cash Entry Model
class CashEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "entrada" or "saida"
    value: float
    desc: str = ""
    datetime: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CashEntryCreate(BaseModel):
    type: str
    value: float
    desc: str = ""


# Delivery Model
class Delivery(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seq: int
    clientName: str
    amount: float
    paymentMethod: str
    paymentMethod2: Optional[str] = None
    amount2: Optional[float] = None
    valorRecebido: Optional[float] = None
    troco: Optional[float] = None
    valorRecebido2: Optional[float] = None
    troco2: Optional[float] = None
    observation: Optional[str] = None
    datetime: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    saiuParaEntrega: bool = False
    horaSaida: Optional[str] = None
    foiEntregue: bool = False
    horaEntregue: Optional[str] = None
    cancelado: bool = False
    delivererId: Optional[str] = None
    marcadoPix: bool = False
    marcadoCartao: bool = False
    marcadoDinheiro: bool = False
    marcadoPago: bool = False
    marcadoVemRetirar: bool = False
    marcadoMarcar: bool = False
    marcadoPagouConta: bool = False

class DeliveryCreate(BaseModel):
    clientName: str
    amount: float
    paymentMethod: str
    paymentMethod2: Optional[str] = None
    amount2: Optional[float] = None
    valorRecebido: Optional[float] = None
    valorRecebido2: Optional[float] = None
    observation: Optional[str] = None

class DeliveryUpdate(BaseModel):
    clientName: Optional[str] = None
    amount: Optional[float] = None
    paymentMethod: Optional[str] = None
    paymentMethod2: Optional[str] = None
    amount2: Optional[float] = None
    valorRecebido: Optional[float] = None
    troco: Optional[float] = None
    valorRecebido2: Optional[float] = None
    troco2: Optional[float] = None
    observation: Optional[str] = None
    saiuParaEntrega: Optional[bool] = None
    horaSaida: Optional[str] = None
    foiEntregue: Optional[bool] = None
    horaEntregue: Optional[str] = None
    cancelado: Optional[bool] = None
    delivererId: Optional[str] = None
    marcadoPix: Optional[bool] = None
    marcadoCartao: Optional[bool] = None
    marcadoDinheiro: Optional[bool] = None
    marcadoPago: Optional[bool] = None
    marcadoVemRetirar: Optional[bool] = None
    marcadoMarcar: Optional[bool] = None
    marcadoPagouConta: Optional[bool] = None


# Deliverer Model
class Deliverer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class DelivererCreate(BaseModel):
    name: str


# Employee Payment Model
class EmployeePayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employeeName: str
    amount: float
    paymentMethod: str
    datetime: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EmployeePaymentCreate(BaseModel):
    employeeName: str
    amount: float
    paymentMethod: str


# Stock Item Model
class StockItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str = ""
    price: float = 0.0
    quantity: int = 0
    sold: int = 0
    datetime: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StockItemCreate(BaseModel):
    name: str
    category: str = ""
    price: float = 0.0
    quantity: int = 0

class StockItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    sold: Optional[int] = None


# User Model
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    role: str = "admin"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


class UserPublic(BaseModel):
    username: str
    role: str
    created_at: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    user = await db.users.find_one({"username": credentials.username})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")

    token = create_access_token(user["username"])
    return LoginResponse(access_token=token, username=user["username"], role=user.get("role", "admin"))


@api_router.get("/auth/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserPublic(
        username=current_user["username"],
        role=current_user.get("role", "admin"),
        created_at=current_user.get("created_at", ""),
    )


@api_router.post("/auth/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"username": current_user["username"]})
    if not user or not verify_password(request.current_password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")

    new_hashed = hash_password(request.new_password)
    await db.users.update_one(
        {"username": current_user["username"]},
        {"$set": {"hashed_password": new_hashed}}
    )
    return {"message": "Senha alterada com sucesso"}


# ==================== CASH ENDPOINTS ====================

@api_router.post("/cash", response_model=CashEntry)
async def create_cash_entry(input: CashEntryCreate):
    entry = CashEntry(**input.model_dump())
    doc = entry.model_dump()
    await db.cash_entries.insert_one(doc)
    await ws_manager.broadcast("cash_created", "cash", entry.id)
    return entry

@api_router.get("/cash", response_model=List[CashEntry])
async def get_cash_entries():
    entries = await db.cash_entries.find({}, {"_id": 0}).to_list(10000)
    return entries

@api_router.delete("/cash/{entry_id}")
async def delete_cash_entry(entry_id: str):
    result = await db.cash_entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    await ws_manager.broadcast("cash_deleted", "cash", entry_id)
    return {"message": "Entry deleted"}


# ==================== DELIVERIES ENDPOINTS ====================

@api_router.post("/deliveries", response_model=Delivery)
async def create_delivery(input: DeliveryCreate):
    # Get the next sequence number
    last_delivery = await db.deliveries.find_one(sort=[("seq", -1)])
    next_seq = (last_delivery["seq"] + 1) if last_delivery else 1
    
    # Calculate troco if payment method is dinheiro
    troco = None
    if input.paymentMethod == "dinheiro" and input.valorRecebido:
        troco = input.valorRecebido - input.amount
    
    # Calculate troco2 if payment method 2 is dinheiro
    troco2 = None
    if input.paymentMethod2 == "dinheiro" and input.valorRecebido2:
        troco2 = input.valorRecebido2 - (input.amount2 or 0)
    
    delivery_data = input.model_dump()
    delivery_data["seq"] = next_seq
    delivery_data["troco"] = troco
    delivery_data["troco2"] = troco2
    
    delivery = Delivery(**delivery_data)
    doc = delivery.model_dump()
    await db.deliveries.insert_one(doc)
    
    # Update clients pool
    if input.clientName and input.clientName != "(sem nome)":
        await db.clients_pool.update_one(
            {"name": input.clientName},
            {"$set": {"name": input.clientName}},
            upsert=True
        )
    
    await ws_manager.broadcast("delivery_created", "delivery", delivery.id)
    return delivery

@api_router.get("/deliveries", response_model=List[Delivery])
async def get_deliveries():
    deliveries = await db.deliveries.find({}, {"_id": 0}).sort("seq", -1).to_list(10000)
    return deliveries

@api_router.patch("/deliveries/{delivery_id}", response_model=Delivery)
async def update_delivery(delivery_id: str, updates: DeliveryUpdate):
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    
    # Set timestamps for status changes
    if "saiuParaEntrega" in update_data and update_data["saiuParaEntrega"]:
        update_data["horaSaida"] = datetime.now(timezone.utc).isoformat()
    
    if "foiEntregue" in update_data and update_data["foiEntregue"]:
        update_data["horaEntregue"] = datetime.now(timezone.utc).isoformat()
    
    # If removing deliverer, clear related fields
    if "delivererId" in update_data and update_data["delivererId"] is None:
        update_data["horaSaida"] = None
    
    # Recalculate troco if payment method changes to dinheiro
    current = None
    if "paymentMethod" in update_data or "valorRecebido" in update_data or "amount" in update_data:
        current = await db.deliveries.find_one({"id": delivery_id}, {"_id": 0})
        if current:
            payment_method = update_data.get("paymentMethod", current.get("paymentMethod"))
            valor_recebido = update_data.get("valorRecebido", current.get("valorRecebido"))
            amount = update_data.get("amount", current.get("amount"))
            
            if payment_method == "dinheiro" and valor_recebido:
                update_data["troco"] = valor_recebido - amount
            else:
                update_data["troco"] = None
    
    # Recalculate troco2 if payment method 2 changes to dinheiro
    if "paymentMethod2" in update_data or "valorRecebido2" in update_data or "amount2" in update_data:
        if not current:
            current = await db.deliveries.find_one({"id": delivery_id}, {"_id": 0})
        if current:
            payment_method2 = update_data.get("paymentMethod2", current.get("paymentMethod2"))
            valor_recebido2 = update_data.get("valorRecebido2", current.get("valorRecebido2"))
            amount2 = update_data.get("amount2", current.get("amount2"))
            
            if payment_method2 == "dinheiro" and valor_recebido2 and amount2:
                update_data["troco2"] = valor_recebido2 - amount2
            else:
                update_data["troco2"] = None
    
    result = await db.deliveries.update_one(
        {"id": delivery_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    updated = await db.deliveries.find_one({"id": delivery_id}, {"_id": 0})
    # Detect event type
    event_type = "delivery_updated"
    if "foiEntregue" in update_data and update_data.get("foiEntregue"):
        event_type = "delivery_finished"
    elif "cancelado" in update_data:
        event_type = "delivery_cancelled" if update_data.get("cancelado") else "delivery_uncancelled"
    elif "saiuParaEntrega" in update_data:
        event_type = "delivery_status_changed"
    elif "delivererId" in update_data:
        event_type = "delivery_assigned"
    await ws_manager.broadcast(event_type, "delivery", delivery_id)
    return updated

@api_router.delete("/deliveries/{delivery_id}")
async def delete_delivery(delivery_id: str):
    result = await db.deliveries.delete_one({"id": delivery_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    await ws_manager.broadcast("delivery_deleted", "delivery", delivery_id)
    return {"message": "Delivery deleted"}


# ==================== DELIVERERS ENDPOINTS ====================

@api_router.post("/deliverers", response_model=Deliverer)
async def create_deliverer(input: DelivererCreate):
    deliverer = Deliverer(**input.model_dump())
    doc = deliverer.model_dump()
    await db.deliverers.insert_one(doc)
    await ws_manager.broadcast("deliverer_created", "deliverer", deliverer.id)
    return deliverer

@api_router.get("/deliverers", response_model=List[Deliverer])
async def get_deliverers():
    deliverers = await db.deliverers.find({}, {"_id": 0}).to_list(1000)
    return deliverers

@api_router.delete("/deliverers/{deliverer_id}")
async def delete_deliverer(deliverer_id: str):
    result = await db.deliverers.delete_one({"id": deliverer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deliverer not found")
    await ws_manager.broadcast("deliverer_deleted", "deliverer", deliverer_id)
    return {"message": "Deliverer deleted"}


# ==================== EMPLOYEE PAYMENTS ENDPOINTS ====================

@api_router.post("/employee-payments", response_model=EmployeePayment)
async def create_employee_payment(input: EmployeePaymentCreate):
    payment = EmployeePayment(**input.model_dump())
    doc = payment.model_dump()
    await db.employee_payments.insert_one(doc)
    await ws_manager.broadcast("employee_payment_created", "employee_payment", payment.id)
    return payment

@api_router.get("/employee-payments", response_model=List[EmployeePayment])
async def get_employee_payments():
    payments = await db.employee_payments.find({}, {"_id": 0}).to_list(10000)
    return payments

@api_router.delete("/employee-payments/{payment_id}")
async def delete_employee_payment(payment_id: str):
    result = await db.employee_payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    await ws_manager.broadcast("employee_payment_deleted", "employee_payment", payment_id)
    return {"message": "Payment deleted"}


# ==================== CLIENTS POOL ENDPOINT ====================

@api_router.get("/clients/pool")
async def get_clients_pool():
    clients = await db.clients_pool.find({}, {"_id": 0}).to_list(1000)
    client_names = [c["name"] for c in clients]
    return {"items": client_names}


# ==================== EXPORT ENDPOINTS ====================

@api_router.get("/export/excel")
async def export_excel():
    # Fetch all data
    deliveries = await db.deliveries.find({}, {"_id": 0}).sort("seq", 1).to_list(10000)
    cash_entries = await db.cash_entries.find({}, {"_id": 0}).to_list(10000)
    deliverers = await db.deliverers.find({}, {"_id": 0}).to_list(1000)
    employee_payments = await db.employee_payments.find({}, {"_id": 0}).to_list(10000)
    
    # Create workbook
    wb = Workbook()
    
    # Deliveries sheet
    ws_deliveries = wb.active
    ws_deliveries.title = "Entregas"
    ws_deliveries.append(["#", "Cliente", "Valor", "Pagamento 1", "Pagamento 2", "Valor 2", "Valor Recebido", "Troco", "Valor Recebido 2", "Troco 2", "Observação", "Status", "Entregador", "Cadastro", "Saiu", "Entregue"])
    
    deliverers_dict = {d["id"]: d["name"] for d in deliverers}
    
    for delivery in deliveries:
        status = "Cancelado" if delivery.get("cancelado") else ("Entregue" if delivery.get("foiEntregue") else ("Em Entrega" if delivery.get("saiuParaEntrega") else "Pendente"))
        deliverer_name = deliverers_dict.get(delivery.get("delivererId", ""), "-")
        
        ws_deliveries.append([
            delivery.get("seq", ""),
            delivery.get("clientName", ""),
            delivery.get("amount", 0),
            delivery.get("paymentMethod", "").upper(),
            delivery.get("paymentMethod2", "").upper() if delivery.get("paymentMethod2") else "-",
            delivery.get("amount2", 0) if delivery.get("amount2") else "-",
            delivery.get("valorRecebido", 0) if delivery.get("valorRecebido") else "-",
            delivery.get("troco", 0) if delivery.get("troco") else "-",
            delivery.get("valorRecebido2", 0) if delivery.get("valorRecebido2") else "-",
            delivery.get("troco2", 0) if delivery.get("troco2") else "-",
            delivery.get("observation", "-"),
            status,
            deliverer_name,
            delivery.get("datetime", ""),
            delivery.get("horaSaida", "-"),
            delivery.get("horaEntregue", "-")
        ])
    
    # Cash sheet
    ws_cash = wb.create_sheet("Caixa")
    ws_cash.append(["Tipo", "Valor", "Descrição", "Data/Hora"])
    for entry in cash_entries:
        ws_cash.append([
            entry.get("type", "").upper(),
            entry.get("value", 0),
            entry.get("desc", ""),
            entry.get("datetime", "")
        ])
    
    # Employee Payments sheet
    ws_employees = wb.create_sheet("Funcionários")
    ws_employees.append(["Nome", "Valor", "Pagamento", "Data/Hora"])
    for payment in employee_payments:
        ws_employees.append([
            payment.get("employeeName", ""),
            payment.get("amount", 0),
            payment.get("paymentMethod", "").upper(),
            payment.get("datetime", "")
        ])
    
    # Stock sheet
    stock_items = await db.stock_items.find({}, {"_id": 0}).to_list(10000)
    ws_stock = wb.create_sheet("Estoque")
    ws_stock.append(["Item", "Categoria", "Preço Unit.", "Entrada", "Vendidos", "Restante", "Valor Restante"])
    for item in stock_items:
        entrada = item.get("quantity", 0) + item.get("sold", 0)
        ws_stock.append([
            item.get("name", ""),
            item.get("category", ""),
            item.get("price", 0),
            entrada,
            item.get("sold", 0),
            item.get("quantity", 0),
            item.get("price", 0) * item.get("quantity", 0)
        ])
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=cupim_na_telha_export.xlsx"}
    )


@api_router.get("/export/summary-pdf")
async def export_summary_pdf():
    deliveries = await db.deliveries.find({}, {"_id": 0}).sort("seq", 1).to_list(10000)
    deliverers = await db.deliverers.find({}, {"_id": 0}).to_list(1000)
    deliverers_dict = {d["id"]: d["name"] for d in deliverers}
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#1e40af'), spaceAfter=30)
    
    elements.append(Paragraph("Resumo Completo de Entregas", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Table data
    data = [["#", "Cliente", "Valor", "Pagamento", "Valor a Receber", "Entregador", "Status"]]
    
    for delivery in deliveries:
        valor_a_receber = f"R$ {delivery.get('valorRecebido', 0):.2f} (Troco: R$ {delivery.get('troco', 0):.2f})" if delivery.get('paymentMethod') == "dinheiro" and delivery.get('valorRecebido') else (
            "Pago" if delivery.get('paymentMethod') == "pago" else (
                "Pagar ao Retirar" if delivery.get('paymentMethod') == "vem_retirar" else f"R$ {delivery.get('amount', 0):.2f}"
            )
        )
        
        status = "Cancelado" if delivery.get("cancelado") else ("Entregue" if delivery.get("foiEntregue") else ("Em Entrega" if delivery.get("saiuParaEntrega") else "Pendente"))
        deliverer_name = deliverers_dict.get(delivery.get("delivererId", ""), "-")
        
        data.append([
            f"#{delivery.get('seq', '')}",
            delivery.get('clientName', ''),
            f"R$ {delivery.get('amount', 0):.2f}",
            delivery.get('paymentMethod', '').upper(),
            valor_a_receber,
            deliverer_name,
            status
        ])
    
    table = Table(data, colWidths=[0.6*inch, 1.5*inch, 1*inch, 1*inch, 1.5*inch, 1*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resumo_entregas.pdf"}
    )


@api_router.get("/export/reports-pdf")
async def export_reports_pdf():
    deliveries = await db.deliveries.find({}, {"_id": 0}).to_list(10000)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#1e40af'), spaceAfter=30)
    
    elements.append(Paragraph("Relatórios por Forma de Pagamento", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Calculate totals by payment method
    methods = ["pix", "cartao", "dinheiro", "pago", "vem_retirar", "marcar", "pagou_conta"]
    method_names = {"pix": "PIX", "cartao": "Cartão", "dinheiro": "Dinheiro", "pago": "Pago", "vem_retirar": "Vem Retirar", "marcar": "Marcar", "pagou_conta": "Pagou a Conta"}
    
    data = [["Forma de Pagamento", "Total (R$)", "Quantidade"]]
    total_geral = 0
    total_count = 0
    
    for method in methods:
        filtered = [d for d in deliveries if (d.get("paymentMethod") == method or d.get("paymentMethod2") == method) and not d.get("cancelado")]
        total = sum(
            (d.get("amount", 0) if d.get("paymentMethod") == method else 0) +
            ((d.get("amount2") or 0) if d.get("paymentMethod2") == method else 0)
            for d in filtered
        )
        count = len(filtered)
        
        data.append([method_names[method], f"R$ {total:.2f}", str(count)])
        total_geral += total
        total_count += count
    
    data.append(["TOTAL GERAL", f"R$ {total_geral:.2f}", str(total_count)])
    
    table = Table(data, colWidths=[3*inch, 2*inch, 1.5*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorios_pagamento.pdf"}
    )


@api_router.get("/export/employees-pdf")
async def export_employees_pdf():
    employee_payments = await db.employee_payments.find({}, {"_id": 0}).to_list(10000)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#1e40af'), spaceAfter=30)
    
    elements.append(Paragraph("Pagamentos de Funcionários", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Table data
    data = [["Nome", "Valor", "Pagamento", "Data/Hora"]]
    total = 0
    
    for payment in employee_payments:
        data.append([
            payment.get('employeeName', ''),
            f"R$ {payment.get('amount', 0):.2f}",
            payment.get('paymentMethod', '').upper(),
            payment.get('datetime', '')
        ])
        total += payment.get('amount', 0)
    
    data.append(["TOTAL PAGO", f"R$ {total:.2f}", "", ""])
    
    table = Table(data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=pagamentos_funcionarios.pdf"}
    )


# ==================== STOCK ENDPOINTS ====================

@api_router.post("/stock", response_model=StockItem)
async def create_stock_item(input: StockItemCreate):
    item = StockItem(**input.model_dump())
    doc = item.model_dump()
    await db.stock_items.insert_one(doc)
    await ws_manager.broadcast("stock_created", "stock", item.id)
    return item

@api_router.get("/stock", response_model=List[StockItem])
async def get_stock_items():
    items = await db.stock_items.find({}, {"_id": 0}).to_list(10000)
    return items

@api_router.patch("/stock/{item_id}")
async def update_stock_item(item_id: str, update: StockItemUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    await db.stock_items.update_one({"id": item_id}, {"$set": update_data})
    updated = await db.stock_items.find_one({"id": item_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    await ws_manager.broadcast("stock_updated", "stock", item_id)
    return updated

@api_router.delete("/stock/{item_id}")
async def delete_stock_item(item_id: str):
    result = await db.stock_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    await ws_manager.broadcast("stock_deleted", "stock", item_id)
    return {"message": "Item deleted"}


# ==================== BACKUP ENDPOINT ====================

class BackupRequest(BaseModel):
    date: str  # ISO format: "YYYY-MM-DD"

@api_router.post("/backup")
async def generate_backup(request: BackupRequest):
    from datetime import timedelta
    
    # Parse the date
    try:
        target_date = datetime.strptime(request.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Date range: start of day to end of day (UTC)
    day_start = target_date.replace(hour=0, minute=0, second=0).isoformat()
    day_end = (target_date + timedelta(days=1)).replace(hour=0, minute=0, second=0).isoformat()
    
    date_filter = {"datetime": {"$gte": day_start, "$lt": day_end}}
    
    # Fetch all data for the date
    deliveries = await db.deliveries.find(date_filter, {"_id": 0}).sort("seq", 1).to_list(10000)
    cash_entries = await db.cash_entries.find(date_filter, {"_id": 0}).to_list(10000)
    employee_payments = await db.employee_payments.find(date_filter, {"_id": 0}).to_list(10000)
    deliverers_list = await db.deliverers.find({}, {"_id": 0}).to_list(1000)
    deliverers_dict = {d["id"]: d["name"] for d in deliverers_list}
    
    date_str = request.date
    
    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 1. Excel file
        wb = Workbook()
        ws_del = wb.active
        ws_del.title = "Entregas"
        ws_del.append(["#", "Cliente", "Valor Total", "Pagamento 1", "Valor 1", "Pagamento 2", "Valor 2", "Valor Recebido", "Troco", "Observacao", "Status", "Entregador", "Cadastro", "Saiu", "Entregue"])
        for d in deliveries:
            status = "Cancelado" if d.get("cancelado") else ("Entregue" if d.get("foiEntregue") else ("Em Entrega" if d.get("saiuParaEntrega") else "Pendente"))
            ws_del.append([
                d.get("seq", ""), d.get("clientName", ""),
                d.get("amount", 0) + (d.get("amount2") or 0),
                d.get("paymentMethod", "").upper(), d.get("amount", 0),
                (d.get("paymentMethod2") or "").upper() or "-", d.get("amount2") or "-",
                d.get("valorRecebido") or "-", d.get("troco") or "-",
                d.get("observation") or "-", status,
                deliverers_dict.get(d.get("delivererId", ""), "-"),
                d.get("datetime", ""), d.get("horaSaida") or "-", d.get("horaEntregue") or "-"
            ])
        
        ws_cash = wb.create_sheet("Caixa")
        ws_cash.append(["Tipo", "Valor", "Descricao", "Data/Hora"])
        for e in cash_entries:
            ws_cash.append([e.get("type", "").upper(), e.get("value", 0), e.get("desc", ""), e.get("datetime", "")])
        
        ws_emp = wb.create_sheet("Funcionarios")
        ws_emp.append(["Nome", "Valor", "Pagamento", "Data/Hora"])
        for p in employee_payments:
            ws_emp.append([p.get("employeeName", ""), p.get("amount", 0), p.get("paymentMethod", "").upper(), p.get("datetime", "")])
        
        excel_buf = io.BytesIO()
        wb.save(excel_buf)
        excel_buf.seek(0)
        zf.writestr(f"dados_completos_{date_str}.xlsx", excel_buf.getvalue())
        
        # 2. PDF - Cash Summary
        cash_buf = io.BytesIO()
        doc = SimpleDocTemplate(cash_buf, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('BkpTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1e40af'), spaceAfter=20)
        
        elements.append(Paragraph(f"Resumo de Caixa - {date_str}", title_style))
        elements.append(Spacer(1, 0.2*inch))
        
        cash_data = [["Tipo", "Valor (R$)", "Descricao", "Data/Hora"]]
        total_entradas = 0
        total_saidas = 0
        for e in cash_entries:
            cash_data.append([e.get("type", "").upper(), f"R$ {e.get('value', 0):.2f}", e.get("desc", ""), e.get("datetime", "")])
            if e.get("type") == "entrada":
                total_entradas += e.get("value", 0)
            else:
                total_saidas += e.get("value", 0)
        cash_data.append(["TOTAL ENTRADAS", f"R$ {total_entradas:.2f}", "", ""])
        cash_data.append(["TOTAL SAIDAS", f"R$ {total_saidas:.2f}", "", ""])
        cash_data.append(["SALDO", f"R$ {(total_entradas - total_saidas):.2f}", "", ""])
        
        if len(cash_data) > 1:
            t = Table(cash_data, colWidths=[1.5*inch, 1.5*inch, 2.5*inch, 2*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, -3), (-1, -1), colors.HexColor('#e0e7ff')),
                ('FONTNAME', (0, -3), (-1, -1), 'Helvetica-Bold'),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("Nenhuma movimentacao de caixa nesta data.", styles['Normal']))
        
        doc.build(elements)
        cash_buf.seek(0)
        zf.writestr(f"caixa_{date_str}.pdf", cash_buf.getvalue())
        
        # 3. PDF - General Deliveries Report
        del_buf = io.BytesIO()
        doc2 = SimpleDocTemplate(del_buf, pagesize=A4)
        elements2 = []
        elements2.append(Paragraph(f"Relatorio Geral de Entregas - {date_str}", title_style))
        elements2.append(Spacer(1, 0.2*inch))
        
        del_data = [["#", "Cliente", "Valor", "Pag.", "Status", "Entregador"]]
        for d in deliveries:
            status = "Cancelado" if d.get("cancelado") else ("Entregue" if d.get("foiEntregue") else ("Em Entrega" if d.get("saiuParaEntrega") else "Pendente"))
            del_data.append([
                f"#{d.get('seq', '')}", d.get("clientName", ""),
                f"R$ {(d.get('amount', 0) + (d.get('amount2') or 0)):.2f}",
                d.get("paymentMethod", "").upper(),
                status, deliverers_dict.get(d.get("delivererId", ""), "-")
            ])
        
        total_del = sum(d.get("amount", 0) + (d.get("amount2") or 0) for d in deliveries if not d.get("cancelado"))
        del_data.append(["", "TOTAL", f"R$ {total_del:.2f}", "", f"{len(deliveries)} entregas", ""])
        
        if len(del_data) > 1:
            t2 = Table(del_data, colWidths=[0.6*inch, 1.8*inch, 1.2*inch, 1*inch, 1.2*inch, 1.2*inch])
            t2.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ]))
            elements2.append(t2)
        else:
            elements2.append(Paragraph("Nenhuma entrega nesta data.", styles['Normal']))
        
        doc2.build(elements2)
        del_buf.seek(0)
        zf.writestr(f"entregas_{date_str}.pdf", del_buf.getvalue())
        
        # 4. PDF - Reports by Payment Method
        pay_buf = io.BytesIO()
        doc3 = SimpleDocTemplate(pay_buf, pagesize=A4)
        elements3 = []
        elements3.append(Paragraph(f"Relatorios por Forma de Pagamento - {date_str}", title_style))
        elements3.append(Spacer(1, 0.2*inch))
        
        methods = ["pix", "cartao", "dinheiro", "pago", "vem_retirar", "marcar", "pagou_conta"]
        method_names = {"pix": "PIX", "cartao": "Cartao", "dinheiro": "Dinheiro", "pago": "Pago", "vem_retirar": "Vem Retirar", "marcar": "Marcar", "pagou_conta": "Pagou a Conta"}
        
        pay_data = [["Forma de Pagamento", "Total (R$)", "Quantidade"]]
        total_geral = 0
        total_count = 0
        for m in methods:
            filtered = [d for d in deliveries if (d.get("paymentMethod") == m or d.get("paymentMethod2") == m) and not d.get("cancelado")]
            total = sum(
                (d.get("amount", 0) if d.get("paymentMethod") == m else 0) +
                ((d.get("amount2") or 0) if d.get("paymentMethod2") == m else 0)
                for d in filtered
            )
            count = len(filtered)
            pay_data.append([method_names[m], f"R$ {total:.2f}", str(count)])
            total_geral += total
            total_count += count
        pay_data.append(["TOTAL GERAL", f"R$ {total_geral:.2f}", str(total_count)])
        
        t3 = Table(pay_data, colWidths=[3*inch, 2*inch, 1.5*inch])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        elements3.append(t3)
        
        doc3.build(elements3)
        pay_buf.seek(0)
        zf.writestr(f"relatorios_pagamento_{date_str}.pdf", pay_buf.getvalue())
        
        # 5. PDF - Employee Payments
        emp_buf = io.BytesIO()
        doc4 = SimpleDocTemplate(emp_buf, pagesize=A4)
        elements4 = []
        elements4.append(Paragraph(f"Pagamentos de Funcionarios - {date_str}", title_style))
        elements4.append(Spacer(1, 0.2*inch))
        
        emp_data = [["Nome", "Valor", "Pagamento", "Data/Hora"]]
        emp_total = 0
        for p in employee_payments:
            emp_data.append([p.get("employeeName", ""), f"R$ {p.get('amount', 0):.2f}", p.get("paymentMethod", "").upper(), p.get("datetime", "")])
            emp_total += p.get("amount", 0)
        emp_data.append(["TOTAL PAGO", f"R$ {emp_total:.2f}", "", ""])
        
        if len(emp_data) > 1:
            t4 = Table(emp_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 2*inch])
            t4.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ]))
            elements4.append(t4)
        else:
            elements4.append(Paragraph("Nenhum pagamento de funcionario nesta data.", styles['Normal']))
        
        doc4.build(elements4)
        emp_buf.seek(0)
        zf.writestr(f"funcionarios_{date_str}.pdf", emp_buf.getvalue())
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=backup_cupim_{date_str}.zip"}
    )


async def build_full_backup_zip_bytes() -> bytes:
    """Build the full backup ZIP (Excel completo + PDF resumo) and return its bytes.

    Reused by both the manual endpoint (/api/backup/full) and the automatic
    daily backup scheduler.
    """
    deliveries = await db.deliveries.find({}, {"_id": 0}).sort("seq", 1).to_list(100000)
    cash_entries = await db.cash_entries.find({}, {"_id": 0}).to_list(100000)
    employee_payments = await db.employee_payments.find({}, {"_id": 0}).to_list(100000)
    deliverers_list = await db.deliverers.find({}, {"_id": 0}).to_list(1000)
    deliverers_dict = {d["id"]: d["name"] for d in deliverers_list}
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Excel
        wb = Workbook()
        ws_del = wb.active
        ws_del.title = "Entregas"
        ws_del.append(["#", "Cliente", "Valor Total", "Pagamento 1", "Valor 1", "Pagamento 2", "Valor 2", "Valor Recebido", "Troco", "Observacao", "Status", "Entregador", "Cadastro", "Saiu", "Entregue"])
        for d in deliveries:
            status = "Cancelado" if d.get("cancelado") else ("Entregue" if d.get("foiEntregue") else ("Em Entrega" if d.get("saiuParaEntrega") else "Pendente"))
            ws_del.append([
                d.get("seq", ""), d.get("clientName", ""),
                d.get("amount", 0) + (d.get("amount2") or 0),
                d.get("paymentMethod", "").upper(), d.get("amount", 0),
                (d.get("paymentMethod2") or "").upper() or "-", d.get("amount2") or "-",
                d.get("valorRecebido") or "-", d.get("troco") or "-",
                d.get("observation") or "-", status,
                deliverers_dict.get(d.get("delivererId", ""), "-"),
                d.get("datetime", ""), d.get("horaSaida") or "-", d.get("horaEntregue") or "-"
            ])
        
        ws_cash = wb.create_sheet("Caixa")
        ws_cash.append(["Tipo", "Valor", "Descricao", "Data/Hora"])
        for e in cash_entries:
            ws_cash.append([e.get("type", "").upper(), e.get("value", 0), e.get("desc", ""), e.get("datetime", "")])
        
        ws_emp = wb.create_sheet("Funcionarios")
        ws_emp.append(["Nome", "Valor", "Pagamento", "Data/Hora"])
        for p in employee_payments:
            ws_emp.append([p.get("employeeName", ""), p.get("amount", 0), p.get("paymentMethod", "").upper(), p.get("datetime", "")])
        
        ws_dlv = wb.create_sheet("Entregadores")
        ws_dlv.append(["Nome"])
        for d in deliverers_list:
            ws_dlv.append([d.get("name", "")])
        
        excel_buf = io.BytesIO()
        wb.save(excel_buf)
        excel_buf.seek(0)
        zf.writestr(f"backup_completo_{today}.xlsx", excel_buf.getvalue())
        
        # Summary PDF
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('BkpFullTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1e40af'), spaceAfter=20)
        
        summary_buf = io.BytesIO()
        doc = SimpleDocTemplate(summary_buf, pagesize=A4)
        elements = []
        elements.append(Paragraph(f"Backup Completo - {today}", title_style))
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph(f"Total de entregas: {len(deliveries)}", styles['Normal']))
        elements.append(Paragraph(f"Total de caixa: {len(cash_entries)}", styles['Normal']))
        elements.append(Paragraph(f"Total de funcionarios: {len(employee_payments)}", styles['Normal']))
        elements.append(Paragraph(f"Total de entregadores: {len(deliverers_list)}", styles['Normal']))
        elements.append(Spacer(1, 0.3*inch))
        
        if deliveries:
            del_data = [["#", "Cliente", "Valor", "Pag.", "Status", "Data"]]
            for d in deliveries:
                status = "Cancelado" if d.get("cancelado") else ("Entregue" if d.get("foiEntregue") else ("Em Entrega" if d.get("saiuParaEntrega") else "Pendente"))
                del_data.append([
                    f"#{d.get('seq', '')}", d.get("clientName", ""),
                    f"R$ {(d.get('amount', 0) + (d.get('amount2') or 0)):.2f}",
                    d.get("paymentMethod", "").upper(), status,
                    d.get("datetime", "")[:10]
                ])
            t = Table(del_data, colWidths=[0.5*inch, 1.5*inch, 1*inch, 0.8*inch, 0.8*inch, 1*inch])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(t)
        
        doc.build(elements)
        summary_buf.seek(0)
        zf.writestr(f"backup_completo_{today}.pdf", summary_buf.getvalue())
    
    zip_buffer.seek(0)
    return zip_buffer.getvalue()


@api_router.post("/backup/full")
async def generate_full_backup():
    """Generate a full backup of ALL data (no date filter) - used before clearing data."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    zip_bytes = await build_full_backup_zip_bytes()
    
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=backup_completo_{today}.zip"}
    )


# ==================== AUTOMATIC BACKUP (SCHEDULER + MANAGEMENT) ====================

def _ensure_backup_dir():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def _rotate_old_backups():
    """Keep only the most recent BACKUP_MAX_FILES automatic backups (backup_*.zip)."""
    try:
        files = sorted(
            BACKUP_DIR.glob("backup_*.zip"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        for old_file in files[BACKUP_MAX_FILES:]:
            try:
                old_file.unlink()
                logger.info(f"Backup antigo removido: {old_file.name}")
            except Exception as e:
                logger.error(f"Erro ao remover backup antigo {old_file.name}: {e}")
    except Exception as e:
        logger.error(f"Erro ao rotacionar backups: {e}")


async def run_automatic_backup():
    """Generate an automatic backup ZIP and save it to BACKUP_DIR, then rotate old files."""
    try:
        _ensure_backup_dir()
        zip_bytes = await build_full_backup_zip_bytes()
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"backup_{timestamp}.zip"
        filepath = BACKUP_DIR / filename
        with open(filepath, "wb") as f:
            f.write(zip_bytes)
        _rotate_old_backups()
        logger.info(f"Backup automático criado: {filename}")
        await ws_manager.broadcast("backup_created", "backup", filename)
        return filename
    except Exception as e:
        logger.error(f"Erro ao gerar backup automático: {e}")
        return None


def _seconds_until_next_backup() -> float:
    now = datetime.now(timezone.utc)
    target = now.replace(hour=BACKUP_HOUR, minute=0, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return (target - now).total_seconds()


def get_next_backup_time() -> str:
    now = datetime.now(timezone.utc)
    target = now.replace(hour=BACKUP_HOUR, minute=0, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return target.isoformat()


async def backup_scheduler_loop():
    """Background loop that triggers an automatic backup once a day at BACKUP_HOUR (UTC)."""
    while True:
        wait_seconds = _seconds_until_next_backup()
        logger.info(f"Próximo backup automático em {wait_seconds:.0f}s ({get_next_backup_time()})")
        await asyncio.sleep(wait_seconds)
        await run_automatic_backup()


class BackupFileInfo(BaseModel):
    filename: str
    size: int
    created_at: str


@api_router.get("/backups/list", response_model=List[BackupFileInfo])
async def list_backups():
    """List all available backup files (automatic + manual saved to BACKUP_DIR)."""
    _ensure_backup_dir()
    files = []
    for filepath in sorted(BACKUP_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True):
        stat = filepath.stat()
        files.append(BackupFileInfo(
            filename=filepath.name,
            size=stat.st_size,
            created_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
        ))
    return files


@api_router.get("/backups/next-run")
async def get_next_backup_run():
    """Return the timestamp of the next scheduled automatic backup."""
    return {"next_run": get_next_backup_time(), "backup_hour": BACKUP_HOUR}


def _safe_backup_path(filename: str) -> Path:
    # Prevent path traversal - only allow plain filenames within BACKUP_DIR
    candidate = (BACKUP_DIR / filename).resolve()
    if candidate.parent != BACKUP_DIR.resolve() or not candidate.name == filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido")
    return candidate


@api_router.get("/backups/download/{filename}")
async def download_backup(filename: str):
    filepath = _safe_backup_path(filename)
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="Backup não encontrado")

    def iterfile():
        with open(filepath, "rb") as f:
            yield from f

    return StreamingResponse(
        iterfile(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@api_router.post("/backups/restore/{filename}")
async def restore_backup(filename: str):
    """Restore data from a backup ZIP (imports the Excel sheet back into MongoDB).

    This REPLACES current collections (deliveries, cash_entries, employee_payments,
    deliverers) with the contents found in the backup's Excel file.
    """
    filepath = _safe_backup_path(filename)
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="Backup não encontrado")

    from openpyxl import load_workbook

    try:
        with zipfile.ZipFile(filepath, 'r') as zf:
            excel_name = next((n for n in zf.namelist() if n.endswith('.xlsx')), None)
            if not excel_name:
                raise HTTPException(status_code=400, detail="Backup inválido: Excel não encontrado no ZIP")
            excel_bytes = zf.read(excel_name)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Arquivo de backup corrompido")

    wb = load_workbook(io.BytesIO(excel_bytes))

    status_map = {
        "Cancelado": {"cancelado": True, "foiEntregue": False, "saiuParaEntrega": False},
        "Entregue": {"cancelado": False, "foiEntregue": True, "saiuParaEntrega": True},
        "Em Entrega": {"cancelado": False, "foiEntregue": False, "saiuParaEntrega": True},
        "Pendente": {"cancelado": False, "foiEntregue": False, "saiuParaEntrega": False},
    }

    # Deliverers (imported first so we can map names -> ids)
    deliverers_docs = []
    existing_deliverers = {}
    if "Entregadores" in wb.sheetnames:
        ws = wb["Entregadores"]
        for row in ws.iter_rows(min_row=2, values_only=True):
            name = row[0] if row else None
            if not name:
                continue
            deliverer = Deliverer(name=str(name))
            deliverers_docs.append(deliverer.model_dump())
            existing_deliverers[str(name)] = deliverer.id

    # Deliveries
    deliveries_docs = []
    if "Entregas" in wb.sheetnames:
        ws = wb["Entregas"]
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or row[0] is None:
                continue
            (seq, client_name, _valor_total, payment_method, amount, payment_method2, amount2,
             valor_recebido, troco, observation, status, deliverer_name, dt, hora_saida, hora_entregue) = (
                list(row) + [None] * (15 - len(row))
            )[:15]

            deliverer_id = existing_deliverers.get(deliverer_name) if deliverer_name and deliverer_name != "-" else None
            status_flags = status_map.get(status, {"cancelado": False, "foiEntregue": False, "saiuParaEntrega": False})

            delivery_data = {
                "seq": int(seq) if seq is not None else 0,
                "clientName": client_name or "",
                "amount": float(amount) if amount not in (None, "-") else 0.0,
                "paymentMethod": (payment_method or "").lower(),
                "paymentMethod2": (payment_method2.lower() if payment_method2 and payment_method2 != "-" else None),
                "amount2": (float(amount2) if amount2 not in (None, "-") else None),
                "valorRecebido": (float(valor_recebido) if valor_recebido not in (None, "-") else None),
                "troco": (float(troco) if troco not in (None, "-") else None),
                "observation": (observation if observation and observation != "-" else None),
                "datetime": dt or datetime.now(timezone.utc).isoformat(),
                "horaSaida": (hora_saida if hora_saida and hora_saida != "-" else None),
                "horaEntregue": (hora_entregue if hora_entregue and hora_entregue != "-" else None),
                "delivererId": deliverer_id,
                **status_flags,
            }
            deliveries_docs.append(Delivery(**delivery_data).model_dump())

    # Cash entries
    cash_docs = []
    if "Caixa" in wb.sheetnames:
        ws = wb["Caixa"]
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or row[0] is None:
                continue
            tipo, valor, desc, dt = (list(row) + [None] * (4 - len(row)))[:4]
            cash_docs.append(CashEntry(
                type=(tipo or "").lower(),
                value=float(valor) if valor is not None else 0.0,
                desc=desc or "",
                datetime=dt or datetime.now(timezone.utc).isoformat(),
            ).model_dump())

    # Employee payments
    employee_docs = []
    if "Funcionarios" in wb.sheetnames:
        ws = wb["Funcionarios"]
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or row[0] is None:
                continue
            nome, valor, pagamento, dt = (list(row) + [None] * (4 - len(row)))[:4]
            employee_docs.append(EmployeePayment(
                employeeName=nome or "",
                amount=float(valor) if valor is not None else 0.0,
                paymentMethod=(pagamento or "").lower(),
                datetime=dt or datetime.now(timezone.utc).isoformat(),
            ).model_dump())

    # Replace current data with restored data
    await db.deliveries.delete_many({})
    await db.cash_entries.delete_many({})
    await db.employee_payments.delete_many({})
    await db.deliverers.delete_many({})

    if deliverers_docs:
        await db.deliverers.insert_many(deliverers_docs)
    if deliveries_docs:
        await db.deliveries.insert_many(deliveries_docs)
    if cash_docs:
        await db.cash_entries.insert_many(cash_docs)
    if employee_docs:
        await db.employee_payments.insert_many(employee_docs)

    await ws_manager.broadcast("data_restored", "backup", filename)

    return {
        "message": "Backup restaurado com sucesso",
        "deliveries": len(deliveries_docs),
        "cash_entries": len(cash_docs),
        "employee_payments": len(employee_docs),
        "deliverers": len(deliverers_docs),
    }


# ==================== DATA MANAGEMENT ====================

@api_router.delete("/data/clear")
async def clear_all_data():
    await db.deliveries.delete_many({})
    await db.cash_entries.delete_many({})
    await db.deliverers.delete_many({})
    await db.employee_payments.delete_many({})
    await db.clients_pool.delete_many({})
    await db.stock_items.delete_many({})
    await ws_manager.broadcast("data_cleared", "all")
    return {"message": "All data cleared successfully"}


# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "Cupim na Telha API"}


# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def create_default_admin():
    existing = await db.users.find_one({"username": DEFAULT_ADMIN_USERNAME})
    if not existing:
        default_user = User(
            username=DEFAULT_ADMIN_USERNAME,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            role="admin",
        )
        await db.users.insert_one(default_user.model_dump())
        logger.info(f"Usuário admin padrão criado (username: {DEFAULT_ADMIN_USERNAME})")


backup_scheduler_task = None


@app.on_event("startup")
async def start_backup_scheduler():
    global backup_scheduler_task
    _ensure_backup_dir()
    backup_scheduler_task = asyncio.create_task(backup_scheduler_loop())
    logger.info(f"Agendador de backup automático iniciado (BACKUP_HOUR={BACKUP_HOUR}, BACKUP_DIR={BACKUP_DIR})")


@app.on_event("shutdown")
async def stop_backup_scheduler():
    if backup_scheduler_task:
        backup_scheduler_task.cancel()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
