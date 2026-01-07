from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timezone
import io
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


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


# ========== MODELS ==========

class CashEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entry_type: str  # "entrada" or "saida"
    value: float
    desc: str = ""
    datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CashEntryCreate(BaseModel):
    entry_type: str
    value: float
    desc: str = ""


class Delivery(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    seq: int  # Sequential number
    clientName: str
    amount: float
    paymentMethod: str  # pix, cartao, dinheiro, pago, vem_retirar, marcar
    paymentMethod2: Optional[str] = None  # Second payment method
    amount2: Optional[float] = None  # Amount for second payment method
    valorRecebido: Optional[float] = None  # For cash payments
    troco: Optional[float] = None  # Change
    observation: Optional[str] = None
    delivererId: Optional[str] = None
    saiuParaEntrega: bool = False
    foiEntregue: bool = False
    cancelado: bool = False
    datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    horaSaida: Optional[datetime] = None
    horaEntregue: Optional[datetime] = None


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
    delivererId: Optional[str] = None
    saiuParaEntrega: Optional[bool] = None
    foiEntregue: Optional[bool] = None
    cancelado: Optional[bool] = None
    horaSaida: Optional[datetime] = None
    horaEntregue: Optional[datetime] = None


class Deliverer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DelivererCreate(BaseModel):
    name: str


class EmployeePayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employeeName: str
    amount: float
    paymentMethod: str  # pix or dinheiro
    datetime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EmployeePaymentCreate(BaseModel):
    employeeName: str
    amount: float
    paymentMethod: str


# ========== CASH ENDPOINTS ==========

@api_router.get("/cash", response_model=List[CashEntry])
async def get_cash_entries():
    entries = await db.cash_entries.find({}, {"_id": 0}).to_list(1000)
    for entry in entries:
        if isinstance(entry['datetime'], str):
            entry['datetime'] = datetime.fromisoformat(entry['datetime'])
    return sorted(entries, key=lambda x: x['datetime'], reverse=True)


@api_router.post("/cash", response_model=CashEntry)
async def create_cash_entry(entry_input: CashEntryCreate):
    entry_obj = CashEntry(**entry_input.model_dump())
    doc = entry_obj.model_dump()
    doc['datetime'] = doc['datetime'].isoformat()
    await db.cash_entries.insert_one(doc)
    return entry_obj


@api_router.delete("/cash/{entry_id}")
async def delete_cash_entry(entry_id: str):
    result = await db.cash_entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}


# ========== DELIVERIES ENDPOINTS ==========

@api_router.get("/deliveries", response_model=List[Delivery])
async def get_deliveries():
    deliveries = await db.deliveries.find({}, {"_id": 0}).to_list(2000)
    for delivery in deliveries:
        if isinstance(delivery['datetime'], str):
            delivery['datetime'] = datetime.fromisoformat(delivery['datetime'])
        if delivery.get('horaSaida') and isinstance(delivery['horaSaida'], str):
            delivery['horaSaida'] = datetime.fromisoformat(delivery['horaSaida'])
        if delivery.get('horaEntregue') and isinstance(delivery['horaEntregue'], str):
            delivery['horaEntregue'] = datetime.fromisoformat(delivery['horaEntregue'])
    return sorted(deliveries, key=lambda x: x['seq'], reverse=True)


@api_router.post("/deliveries", response_model=Delivery)
async def create_delivery(delivery_input: DeliveryCreate):
    # Get next sequence number
    last_delivery = await db.deliveries.find_one(sort=[("seq", -1)])
    next_seq = 1 if not last_delivery else last_delivery.get("seq", 0) + 1
    
    # Calculate troco if cash payment
    troco = None
    if delivery_input.paymentMethod == "dinheiro" and delivery_input.valorRecebido:
        troco = delivery_input.valorRecebido - delivery_input.amount
    
    delivery_obj = Delivery(
        **delivery_input.model_dump(),
        seq=next_seq,
        troco=troco
    )
    
    doc = delivery_obj.model_dump()
    doc['datetime'] = doc['datetime'].isoformat()
    
    await db.deliveries.insert_one(doc)
    
    # Add client name to pool if not empty
    if delivery_input.clientName and delivery_input.clientName != "(sem nome)":
        await db.clients_pool.update_one(
            {"name": delivery_input.clientName},
            {"$set": {"name": delivery_input.clientName}},
            upsert=True
        )
    
    return delivery_obj


@api_router.patch("/deliveries/{delivery_id}", response_model=Delivery)
async def update_delivery(delivery_id: str, update_data: DeliveryUpdate):
    # Get existing delivery
    existing = await db.deliveries.find_one({"id": delivery_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    # Convert datetime strings back to datetime objects
    if isinstance(existing['datetime'], str):
        existing['datetime'] = datetime.fromisoformat(existing['datetime'])
    if existing.get('horaSaida') and isinstance(existing['horaSaida'], str):
        existing['horaSaida'] = datetime.fromisoformat(existing['horaSaida'])
    if existing.get('horaEntregue') and isinstance(existing['horaEntregue'], str):
        existing['horaEntregue'] = datetime.fromisoformat(existing['horaEntregue'])
    
    # Prepare update dict
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Handle special cases
    if update_dict.get('saiuParaEntrega') and not existing.get('saiuParaEntrega'):
        update_dict['horaSaida'] = datetime.now(timezone.utc).isoformat()
    
    if update_dict.get('foiEntregue') and not existing.get('foiEntregue'):
        update_dict['horaEntregue'] = datetime.now(timezone.utc).isoformat()
    
    # Calculate troco if updating cash payment
    if 'valorRecebido' in update_dict or 'amount' in update_dict:
        amount = update_dict.get('amount', existing.get('amount'))
        valor_recebido = update_dict.get('valorRecebido', existing.get('valorRecebido'))
        payment_method = update_dict.get('paymentMethod', existing.get('paymentMethod'))
        
        if payment_method == "dinheiro" and valor_recebido:
            update_dict['troco'] = valor_recebido - amount
        else:
            update_dict['troco'] = None
            update_dict['valorRecebido'] = None
    
    # Convert datetime objects to ISO strings for storage
    for key in ['horaSaida', 'horaEntregue']:
        if key in update_dict and isinstance(update_dict[key], datetime):
            update_dict[key] = update_dict[key].isoformat()
    
    # Update in database
    await db.deliveries.update_one(
        {"id": delivery_id},
        {"$set": update_dict}
    )
    
    # Get updated delivery
    updated = await db.deliveries.find_one({"id": delivery_id}, {"_id": 0})
    
    # Convert datetime strings back
    if isinstance(updated['datetime'], str):
        updated['datetime'] = datetime.fromisoformat(updated['datetime'])
    if updated.get('horaSaida') and isinstance(updated['horaSaida'], str):
        updated['horaSaida'] = datetime.fromisoformat(updated['horaSaida'])
    if updated.get('horaEntregue') and isinstance(updated['horaEntregue'], str):
        updated['horaEntregue'] = datetime.fromisoformat(updated['horaEntregue'])
    
    return Delivery(**updated)


@api_router.delete("/deliveries/{delivery_id}")
async def delete_delivery(delivery_id: str):
    result = await db.deliveries.delete_one({"id": delivery_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return {"message": "Delivery deleted"}


# ========== DELIVERERS ENDPOINTS ==========

@api_router.get("/deliverers", response_model=List[Deliverer])
async def get_deliverers():
    deliverers = await db.deliverers.find({}, {"_id": 0}).to_list(100)
    for deliverer in deliverers:
        if isinstance(deliverer['datetime'], str):
            deliverer['datetime'] = datetime.fromisoformat(deliverer['datetime'])
    return sorted(deliverers, key=lambda x: x['name'])


@api_router.post("/deliverers", response_model=Deliverer)
async def create_deliverer(deliverer_input: DelivererCreate):
    deliverer_obj = Deliverer(**deliverer_input.model_dump())
    doc = deliverer_obj.model_dump()
    doc['datetime'] = doc['datetime'].isoformat()
    await db.deliverers.insert_one(doc)
    return deliverer_obj


@api_router.delete("/deliverers/{deliverer_id}")
async def delete_deliverer(deliverer_id: str):
    result = await db.deliverers.delete_one({"id": deliverer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deliverer not found")
    return {"message": "Deliverer deleted"}


# ========== CLIENTS POOL ENDPOINT ==========

@api_router.get("/clients/pool")
async def get_clients_pool():
    clients = await db.clients_pool.find({}, {"_id": 0}).to_list(1000)
    return {"items": [c["name"] for c in clients]}


# ========== EMPLOYEE PAYMENTS ENDPOINTS ==========

@api_router.get("/employee-payments", response_model=List[EmployeePayment])
async def get_employee_payments():
    payments = await db.employee_payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment['datetime'], str):
            payment['datetime'] = datetime.fromisoformat(payment['datetime'])
    return sorted(payments, key=lambda x: x['datetime'], reverse=True)


@api_router.post("/employee-payments", response_model=EmployeePayment)
async def create_employee_payment(payment_input: EmployeePaymentCreate):
    payment_obj = EmployeePayment(**payment_input.model_dump())
    doc = payment_obj.model_dump()
    doc['datetime'] = doc['datetime'].isoformat()
    await db.employee_payments.insert_one(doc)
    return payment_obj


@api_router.delete("/employee-payments/{payment_id}")
async def delete_employee_payment(payment_id: str):
    result = await db.employee_payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted"}


# ========== EXPORT ENDPOINTS ==========

@api_router.get("/export/excel")
async def export_excel():
    # Get all data
    deliveries = await db.deliveries.find({}, {"_id": 0}).to_list(2000)
    deliverers = await db.deliverers.find({}, {"_id": 0}).to_list(100)
    cash_entries = await db.cash_entries.find({}, {"_id": 0}).to_list(1000)
    employee_payments = await db.employee_payments.find({}, {"_id": 0}).to_list(1000)
    
    # Create workbook
    wb = Workbook()
    
    # Deliveries sheet
    ws1 = wb.active
    ws1.title = "Entregas"
    headers = ["#", "Cliente", "Valor", "Pagamento 1", "Pagamento 2", "Valor Recebido", "Troco", 
               "Observação", "Entregador", "Status", "Cadastro", "Saiu", "Entregue"]
    ws1.append(headers)
    
    # Style headers
    for cell in ws1[1]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.font = Font(color="FFFFFF", bold=True)
    
    deliverers_dict = {d['id']: d['name'] for d in deliverers}
    
    for d in sorted(deliveries, key=lambda x: x.get('seq', 0), reverse=True):
        status = "Cancelado" if d.get('cancelado') else "Entregue" if d.get('foiEntregue') else "Em Entrega" if d.get('saiuParaEntrega') else "Pendente"
        deliverer_name = deliverers_dict.get(d.get('delivererId'), '-')
        
        row = [
            d.get('seq', ''),
            d.get('clientName', ''),
            f"R$ {d.get('amount', 0):.2f}",
            d.get('paymentMethod', '').upper(),
            d.get('paymentMethod2', '-').upper() if d.get('paymentMethod2') else '-',
            f"R$ {d.get('valorRecebido', 0):.2f}" if d.get('valorRecebido') else '-',
            f"R$ {d.get('troco', 0):.2f}" if d.get('troco') else '-',
            d.get('observation', '-'),
            deliverer_name,
            status,
            d.get('datetime', ''),
            d.get('horaSaida', '-'),
            d.get('horaEntregue', '-')
        ]
        ws1.append(row)
    
    # Cash sheet
    ws2 = wb.create_sheet("Caixa")
    ws2.append(["Tipo", "Valor", "Descrição", "Data"])
    for cell in ws2[1]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.font = Font(color="FFFFFF", bold=True)
    
    for entry in sorted(cash_entries, key=lambda x: x.get('datetime', ''), reverse=True):
        ws2.append([
            entry.get('type', '').upper(),
            f"R$ {entry.get('value', 0):.2f}",
            entry.get('desc', ''),
            entry.get('datetime', '')
        ])
    
    # Employee payments sheet
    ws3 = wb.create_sheet("Funcionários")
    ws3.append(["Funcionário", "Valor", "Forma de Pagamento", "Data"])
    for cell in ws3[1]:
        cell.font = Font(bold=True)
        cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        cell.font = Font(color="FFFFFF", bold=True)
    
    for payment in sorted(employee_payments, key=lambda x: x.get('datetime', ''), reverse=True):
        ws3.append([
            payment.get('employeeName', ''),
            f"R$ {payment.get('amount', 0):.2f}",
            payment.get('paymentMethod', '').upper(),
            payment.get('datetime', '')
        ])
    
    # Save to bytes
    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=cupim_na_telha_completo.xlsx"}
    )


@api_router.get("/export/summary-pdf")
async def export_summary_pdf():
    deliveries = await db.deliveries.find({}, {"_id": 0}).to_list(2000)
    deliverers = await db.deliverers.find({}, {"_id": 0}).to_list(100)
    
    deliverers_dict = {d['id']: d['name'] for d in deliverers}
    
    # Create PDF
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=30,
        alignment=1
    )
    
    # Title
    elements.append(Paragraph("Cupim na telha - Resumo de Entregas", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Table data
    data = [['#', 'Cliente', 'Valor', 'Pagamento', 'Entregador', 'Status']]
    
    for d in sorted(deliveries, key=lambda x: x.get('seq', 0), reverse=True):
        status = "Cancelado" if d.get('cancelado') else "Entregue" if d.get('foiEntregue') else "Em Entrega" if d.get('saiuParaEntrega') else "Pendente"
        deliverer_name = deliverers_dict.get(d.get('delivererId'), '-')
        
        data.append([
            str(d.get('seq', '')),
            d.get('clientName', '')[:20],
            f"R$ {d.get('amount', 0):.2f}",
            d.get('paymentMethod', '').upper(),
            deliverer_name[:15],
            status
        ])
    
    # Create table
    table = Table(data, colWidths=[0.5*inch, 2*inch, 1*inch, 1.2*inch, 1.5*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
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
    
    pdf_buffer.seek(0)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resumo_entregas.pdf"}
    )


@api_router.get("/export/reports-pdf")
async def export_reports_pdf():
    deliveries = await db.deliveries.find({}, {"_id": 0}).to_list(2000)
    
    # Calculate reports
    reports = {
        'pix': [d for d in deliveries if d.get('paymentMethod') == 'pix' and not d.get('cancelado')],
        'cartao': [d for d in deliveries if d.get('paymentMethod') == 'cartao' and not d.get('cancelado')],
        'dinheiro': [d for d in deliveries if d.get('paymentMethod') == 'dinheiro' and not d.get('cancelado')],
        'pago': [d for d in deliveries if d.get('paymentMethod') == 'pago' and not d.get('cancelado')],
        'vem_retirar': [d for d in deliveries if d.get('paymentMethod') == 'vem_retirar' and not d.get('cancelado')],
        'marcar': [d for d in deliveries if d.get('paymentMethod') == 'marcar' and not d.get('cancelado')],
    }
    
    # Create PDF
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=30,
        alignment=1
    )
    
    # Title
    elements.append(Paragraph("Relatórios por Forma de Pagamento", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Summary table
    summary_data = [['Forma de Pagamento', 'Quantidade', 'Total']]
    total_geral = 0
    
    for method, items in reports.items():
        total = sum(d.get('amount', 0) for d in items)
        total_geral += total
        summary_data.append([
            method.upper().replace('_', ' '),
            str(len(items)),
            f"R$ {total:.2f}"
        ])
    
    summary_data.append(['TOTAL GERAL', str(sum(len(items) for items in reports.values())), f"R$ {total_geral:.2f}"])
    
    summary_table = Table(summary_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fbbf24')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(summary_table)
    doc.build(elements)
    
    pdf_buffer.seek(0)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorios_pagamento.pdf"}
    )


@api_router.get("/export/employees-pdf")
async def export_employees_pdf():
    employee_payments = await db.employee_payments.find({}, {"_id": 0}).to_list(1000)
    
    # Create PDF
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=30,
        alignment=1
    )
    
    # Title
    elements.append(Paragraph("Pagamentos de Funcionários", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Table data
    data = [['Funcionário', 'Valor', 'Forma de Pagamento', 'Data']]
    total = 0
    
    for payment in sorted(employee_payments, key=lambda x: x.get('datetime', ''), reverse=True):
        total += payment.get('amount', 0)
        data.append([
            payment.get('employeeName', ''),
            f"R$ {payment.get('amount', 0):.2f}",
            payment.get('paymentMethod', '').upper(),
            str(payment.get('datetime', ''))[:16]
        ])
    
    # Add total row
    data.append(['TOTAL', f"R$ {total:.2f}", '', ''])
    
    # Create table
    table = Table(data, colWidths=[2*inch, 1.2*inch, 1.5*inch, 1.8*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fbbf24')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    
    elements.append(table)
    doc.build(elements)
    
    pdf_buffer.seek(0)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=pagamentos_funcionarios.pdf"}
    )


# ========== CLEAR ALL DATA ==========

@api_router.delete("/data/clear")
async def clear_all_data():
    await db.cash_entries.delete_many({})
    await db.deliveries.delete_many({})
    await db.deliverers.delete_many({})
    await db.clients_pool.delete_many({})
    await db.employee_payments.delete_many({})
    return {"message": "All data cleared"}


# ========== ROOT ENDPOINT ==========

@api_router.get("/")
async def root():
    return {"message": "Cupim na telha API"}


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
