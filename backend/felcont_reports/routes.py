"""API do FELCONT REPORTS AI."""
import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import FileResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from . import parsing, ai
from .indicators import merge_financials, compute_indicators, validate
from . import reportgen

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
GEN_DIR = ROOT / "generated"
GEN_DIR.mkdir(exist_ok=True)

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
clients_col = _db["fr_clients"]
analyses_col = _db["fr_analyses"]

router = APIRouter(prefix="/api/reports")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean(doc):
    if doc:
        doc.pop("_id", None)
    return doc


# --------------------------------------------------------------- Clientes
class ClientIn(BaseModel):
    name: str
    razao_social: Optional[str] = ""
    nome_fantasia: Optional[str] = ""
    cnpj: Optional[str] = ""
    responsavel: Optional[str] = ""
    observacoes: Optional[str] = ""


@router.post("/clients")
async def create_client(payload: ClientIn):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await clients_col.insert_one(doc)
    return clean(doc)


@router.get("/clients")
async def list_clients():
    docs = await clients_col.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        d["analyses_count"] = await analyses_col.count_documents({"client_id": d["id"]})
    return docs


@router.get("/clients/{client_id}")
async def get_client(client_id: str):
    c = clean(await clients_col.find_one({"id": client_id}))
    if not c:
        raise HTTPException(404, "Cliente não encontrado")
    analyses = await analyses_col.find(
        {"client_id": client_id}, {"_id": 0, "id": 1, "period_label": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(200)
    c["analyses"] = analyses
    return c


# --------------------------------------------------------------- Análises
class AnalysisIn(BaseModel):
    client_id: Optional[str] = None
    client_name: str
    razao_social: Optional[str] = ""
    nome_fantasia: Optional[str] = ""
    cnpj: Optional[str] = ""
    period_label: str
    responsavel: Optional[str] = ""
    observacoes: Optional[str] = ""


@router.post("/analyses")
async def create_analysis(payload: AnalysisIn):
    doc = payload.model_dump()
    if not doc.get("client_id"):
        c = {"id": str(uuid.uuid4()), "name": doc["client_name"],
             "razao_social": doc.get("razao_social", ""), "nome_fantasia": doc.get("nome_fantasia", ""),
             "cnpj": doc.get("cnpj", ""), "responsavel": doc.get("responsavel", ""),
             "observacoes": "", "created_at": now_iso()}
        await clients_col.insert_one(c)
        doc["client_id"] = c["id"]
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "rascunho"
    doc["created_at"] = now_iso()
    doc["documents"] = []
    doc["financials"] = None
    doc["indicators"] = None
    doc["validation"] = None
    doc["diagnosis"] = None
    doc["slides"] = []
    doc["meta"] = {}
    await analyses_col.insert_one(doc)
    return clean(doc)


@router.get("/analyses")
async def list_analyses():
    docs = await analyses_col.find(
        {}, {"_id": 0, "id": 1, "client_name": 1, "period_label": 1, "status": 1,
             "created_at": 1, "validation": 1}
    ).sort("created_at", -1).to_list(200)
    for d in docs:
        v = d.pop("validation", None)
        d["validation_status"] = (v or {}).get("overall")
    return docs


@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    a = clean(await analyses_col.find_one({"id": analysis_id}))
    if not a:
        raise HTTPException(404, "Análise não encontrada")
    return a


@router.post("/analyses/{analysis_id}/documents")
async def upload_documents(analysis_id: str, files: List[UploadFile] = File(...)):
    a = await analyses_col.find_one({"id": analysis_id})
    if not a:
        raise HTTPException(404, "Análise não encontrada")
    import tempfile
    documents = a.get("documents", [])
    for f in files:
        ext = Path(f.filename or "doc").suffix or ".dat"
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        try:
            shutil.copyfileobj(f.file, tmp)
            tmp.flush(); tmp.close()
            entry = {"id": str(uuid.uuid4())[:8], "filename": f.filename,
                     "uploaded_at": now_iso()}
            text = parsing.file_to_text(tmp.name, f.filename)
            entry["chars"] = len(text)
            extracted = await ai.extract_document(text, f.filename)
            entry["extracted"] = extracted
            entry["doc_type"] = extracted.get("doc_type", "Outro")
            entry["error"] = extracted.get("error")
        except Exception as e:
            entry = {"id": str(uuid.uuid4())[:8], "filename": getattr(f, "filename", "doc"),
                     "uploaded_at": now_iso(), "error": f"Falha ao processar: {e}",
                     "extracted": {}, "doc_type": "Erro"}
        finally:
            try:
                os.unlink(tmp.name)
            except Exception:
                pass
        documents.append(entry)

    fin = merge_financials(documents)
    ind = compute_indicators(fin)
    val = validate(fin, ind["computed"])
    meta = fin.get("meta", {})
    if not meta.get("period_label"):
        meta["period_label"] = a.get("period_label")
    if not meta.get("client_name"):
        meta["client_name"] = a.get("client_name")

    await analyses_col.update_one({"id": analysis_id}, {"$set": {
        "documents": documents, "financials": fin, "indicators": ind,
        "validation": val, "meta": meta, "status": "validacao",
        "updated_at": now_iso(),
    }})
    return clean(await analyses_col.find_one({"id": analysis_id}))


@router.post("/analyses/{analysis_id}/diagnose")
async def run_diagnosis(analysis_id: str):
    a = await analyses_col.find_one({"id": analysis_id})
    if not a:
        raise HTTPException(404, "Análise não encontrada")
    ind = a.get("indicators") or {}
    fin = a.get("financials") or {}
    context = {
        "cliente": a.get("client_name"), "periodo": a.get("period_label"),
        "indicadores": {
            "cards": [{"label": c["label"], "valor": c["display"]} for c in ind.get("cards", [])],
            "margens": [{"label": c["label"], "valor": c["display"]} for c in ind.get("margens", [])],
            "liquidez": [{"label": c["label"], "valor": c["display"]} for c in ind.get("liquidez", [])],
        },
        "validacao": a.get("validation"),
        "resumo_financeiro": ind.get("computed"),
    }
    diag = await ai.diagnose(context)
    a["diagnosis"] = diag
    slides = reportgen.build_slides(a)
    await analyses_col.update_one({"id": analysis_id}, {"$set": {
        "diagnosis": diag, "slides": slides, "status": "revisao", "updated_at": now_iso(),
    }})
    return clean(await analyses_col.find_one({"id": analysis_id}))


@router.put("/analyses/{analysis_id}/slides")
async def update_slides(analysis_id: str, slides: List[dict] = Body(..., embed=True)):
    res = await analyses_col.update_one({"id": analysis_id},
                                        {"$set": {"slides": slides, "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(404, "Análise não encontrada")
    return {"ok": True, "count": len(slides)}


@router.post("/analyses/{analysis_id}/generate")
async def generate_report(analysis_id: str):
    a = await analyses_col.find_one({"id": analysis_id})
    if not a:
        raise HTTPException(404, "Análise não encontrada")
    slides = a.get("slides") or reportgen.build_slides(a)
    meta = a.get("meta") or {}
    out_dir = GEN_DIR / analysis_id
    out_dir.mkdir(parents=True, exist_ok=True)
    pptx_path = out_dir / "FELCONT_Relatorio_Gerencial.pptx"
    reportgen.generate_pptx(slides, meta, str(pptx_path))
    pdf_ok = _to_pdf(str(pptx_path), str(out_dir))
    await analyses_col.update_one({"id": analysis_id}, {"$set": {
        "status": "gerado", "generated_at": now_iso(),
        "report_pptx": str(pptx_path),
        "report_pdf": str(out_dir / "FELCONT_Relatorio_Gerencial.pdf") if pdf_ok else None,
    }})
    return {"ok": True, "pptx_url": f"/api/reports/analyses/{analysis_id}/download/pptx",
            "pdf_url": f"/api/reports/analyses/{analysis_id}/download/pdf" if pdf_ok else None,
            "slides": len([s for s in slides if s.get("visible", True)])}


def _to_pdf(pptx_path, out_dir):
    import subprocess
    try:
        prof = f"/tmp/lo_{uuid.uuid4().hex[:6]}"
        subprocess.run(["soffice", "--headless", f"-env:UserInstallation=file://{prof}",
                        "--convert-to", "pdf", "--outdir", out_dir, pptx_path],
                       timeout=120, check=True, capture_output=True)
        return (Path(out_dir) / "FELCONT_Relatorio_Gerencial.pdf").exists()
    except Exception:
        return False


@router.get("/analyses/{analysis_id}/download/pptx")
async def download_pptx(analysis_id: str):
    a = await analyses_col.find_one({"id": analysis_id})
    p = (a or {}).get("report_pptx")
    if not p or not os.path.exists(p):
        raise HTTPException(404, "Relatório .pptx não gerado")
    return FileResponse(p, filename="FELCONT_Relatorio_Gerencial.pptx",
                        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")


@router.get("/analyses/{analysis_id}/download/pdf")
async def download_pdf(analysis_id: str):
    a = await analyses_col.find_one({"id": analysis_id})
    p = (a or {}).get("report_pdf")
    if not p or not os.path.exists(p):
        raise HTTPException(404, "Relatório PDF não gerado")
    return FileResponse(p, filename="FELCONT_Relatorio_Gerencial.pdf", media_type="application/pdf")


@router.get("/dashboard")
async def dashboard():
    total_clients = await clients_col.count_documents({})
    total_analyses = await analyses_col.count_documents({})
    pending = await analyses_col.count_documents({"status": {"$ne": "gerado"}})
    inconsist = await analyses_col.count_documents({"validation.overall": "alerta"})
    recent = await analyses_col.find(
        {}, {"_id": 0, "id": 1, "client_name": 1, "period_label": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(6)
    recent_clients = await clients_col.find(
        {}, {"_id": 0, "id": 1, "name": 1, "cnpj": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(6)
    return {"clients": total_clients, "analyses": total_analyses, "pending": pending,
            "inconsistencies": inconsist, "recent_analyses": recent, "recent_clients": recent_clients}
