from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone


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


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# ---------------------------------------------------------------- Deck (PPTX)
DECK_DIR = ROOT_DIR / "assets" / "deck"
PPTX_FILE = DECK_DIR / "FELCONT_Analise_Gerencial.pptx"
PDF_FILE = DECK_DIR / "FELCONT_Analise_Gerencial.pdf"

SLIDE_TITLES = [
    "Capa — Análise Gerencial",
    "Visão Geral do Resultado",
    "Formação do Resultado (Cascata)",
    "Receita x Custos e Despesas",
    "Alerta Contábil: Saldos Invertidos",
    "O que os saldos podem indicar",
    "Principais Pontos de Atenção",
    "Plano de Ação FELCONT",
    "Conclusão / Próximos Passos",
]

@api_router.get("/deck/info")
async def deck_info():
    slides = [
        {"n": i + 1, "title": t, "image": f"/api/deck/slide/{i + 1}"}
        for i, t in enumerate(SLIDE_TITLES)
    ]
    return {
        "title": "Análise Gerencial — Demonstração do Resultado do Exercício",
        "client": "Ronaldo Donadon",
        "period": "Janeiro a Julho de 2026",
        "slide_count": len(SLIDE_TITLES),
        "pptx_bytes": PPTX_FILE.stat().st_size if PPTX_FILE.exists() else 0,
        "pptx_url": "/api/deck/download",
        "pdf_url": "/api/deck/pdf",
        "slides": slides,
    }

@api_router.get("/deck/slide/{n}")
async def deck_slide(n: int):
    path = DECK_DIR / f"slide-{n}.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Slide não encontrado")
    return FileResponse(str(path), media_type="image/png")

@api_router.get("/deck/download")
async def deck_download():
    if not PPTX_FILE.exists():
        raise HTTPException(status_code=404, detail="Arquivo .pptx não encontrado")
    return FileResponse(
        str(PPTX_FILE),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename="FELCONT_Analise_Gerencial.pptx",
    )

@api_router.get("/deck/pdf")
async def deck_pdf():
    if not PDF_FILE.exists():
        raise HTTPException(status_code=404, detail="Arquivo PDF não encontrado")
    return FileResponse(str(PDF_FILE), media_type="application/pdf",
                        filename="FELCONT_Analise_Gerencial.pdf")

# Include the router in the main app
app.include_router(api_router)

# FELCONT REPORTS AI
from felcont_reports.routes import router as reports_router  # noqa: E402
from felcont_reports.routes import portal_router as portal_router  # noqa: E402
app.include_router(reports_router)
app.include_router(portal_router)

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