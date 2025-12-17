from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import io
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

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


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
    observation: Optional[str] = None
    datetime: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    saiuParaEntrega: bool = False
    horaSaida: Optional[str] = None
    foiEntregue: bool = False
    horaEntregue: Optional[str] = None
    cancelado: bool = False
    delivererId: Optional[str] = None

class DeliveryCreate(BaseModel):
    clientName: str
    amount: float
    paymentMethod: str
    paymentMethod2: Optional[str] = None
    amount2: Optional[float] = None
    valorRecebido: Optional[float] = None
    observation: Optional[str] = None

class DeliveryUpdate(BaseModel):
    clientName: Optional[str] = None
    amount: Optional[float] = None
    paymentMethod: Optional[str] = None
    paymentMethod2: Optional[str] = None
    amount2: Optional[float] = None
    valorRecebido: Optional[float] = None
    troco: Optional[float] = None
    observation: Optional[str] = None
    saiuParaEntrega: Optional[bool] = None
    horaSaida: Optional[str] = None
    foiEntregue: Optional[bool] = None
    horaEntregue: Optional[str] = None
    cancelado: Optional[bool] = None
    delivererId: Optional[str] = None


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


# ==================== CASH ENDPOINTS ====================

@api_router.post("/cash", response_model=CashEntry)
async def create_cash_entry(input: CashEntryCreate):
    entry = CashEntry(**input.model_dump())
    doc = entry.model_dump()
    await db.cash_entries.insert_one(doc)
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
    
    delivery_data = input.model_dump()
    delivery_data["seq"] = next_seq
    delivery_data["troco"] = troco
    
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
    
    result = await db.deliveries.update_one(
        {"id": delivery_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    updated = await db.deliveries.find_one({"id": delivery_id}, {"_id": 0})
    return updated

@api_router.delete("/deliveries/{delivery_id}")
async def delete_delivery(delivery_id: str):
    result = await db.deliveries.delete_one({"id": delivery_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return {"message": "Delivery deleted"}


# ==================== DELIVERERS ENDPOINTS ====================

@api_router.post("/deliverers", response_model=Deliverer)
async def create_deliverer(input: DelivererCreate):
    deliverer = Deliverer(**input.model_dump())
    doc = deliverer.model_dump()
    await db.deliverers.insert_one(doc)
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
    return {"message": "Deliverer deleted"}


# ==================== EMPLOYEE PAYMENTS ENDPOINTS ====================

@api_router.post("/employee-payments", response_model=EmployeePayment)
async def create_employee_payment(input: EmployeePaymentCreate):
    payment = EmployeePayment(**input.model_dump())
    doc = payment.model_dump()
    await db.employee_payments.insert_one(doc)
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
    ws_deliveries.append(["#", "Cliente", "Valor", "Pagamento 1", "Pagamento 2", "Valor 2", "Valor Recebido", "Troco", "Observação", "Status", "Entregador", "Cadastro", "Saiu", "Entregue"])
    
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
            "Já Pago" if delivery.get('paymentMethod') == "pago" else (
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
    methods = ["pix", "cartao", "dinheiro", "pago", "vem_retirar", "marcar"]
    method_names = {"pix": "PIX", "cartao": "Cartão", "dinheiro": "Dinheiro", "pago": "Já Pago", "vem_retirar": "Vem Retirar", "marcar": "Marcar"}
    
    data = [["Forma de Pagamento", "Total (R$)", "Quantidade"]]
    total_geral = 0
    total_count = 0
    
    for method in methods:
        filtered = [d for d in deliveries if d.get("paymentMethod") == method and not d.get("cancelado")]
        total = sum(d.get("amount", 0) for d in filtered)
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


# ==================== DATA MANAGEMENT ====================

@api_router.delete("/data/clear")
async def clear_all_data():
    await db.deliveries.delete_many({})
    await db.cash_entries.delete_many({})
    await db.deliverers.delete_many({})
    await db.employee_payments.delete_many({})
    await db.clients_pool.delete_many({})
    return {"message": "All data cleared successfully"}


# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "Cupim na Telha API"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
