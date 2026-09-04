"""API do FELCONT REPORTS AI."""
import os
import uuid
import time
import shutil
import secrets
import hashlib
from collections import defaultdict, deque
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
config_col = _db["fr_config"]
portals_col = _db["client_portals"]

router = APIRouter(prefix="/api/reports")
portal_router = APIRouter(prefix="/api/portal")


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


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str):
    c = await clients_col.find_one({"id": client_id})
    if not c:
        raise HTTPException(404, "Cliente não encontrado")
    an = await analyses_col.delete_many({"client_id": client_id})
    await portals_col.delete_many({"company_id": client_id})
    await clients_col.delete_one({"id": client_id})
    return {"ok": True, "deleted_analyses": an.deleted_count}


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
    cfg = await config_col.find_one({"id": "default"})
    out_dir = GEN_DIR / analysis_id
    out_dir.mkdir(parents=True, exist_ok=True)
    pptx_path = out_dir / "FELCONT_Relatorio_Gerencial.pptx"
    reportgen.generate_pptx(slides, meta, str(pptx_path), config=clean(cfg))
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


@router.get("/config")
async def get_config():
    cfg = clean(await config_col.find_one({"id": "default"})) or {}
    cfg.setdefault("cor_primaria", "#322F6A")
    cfg.setdefault("cor_secundaria", "#3E3A82")
    cfg.setdefault("cor_destaque", "#04B7AF")
    cfg["has_logo"] = bool(cfg.get("logo_b64"))
    cfg.pop("logo_b64", None)
    return cfg


class ConfigIn(BaseModel):
    cor_primaria: Optional[str] = None
    cor_secundaria: Optional[str] = None
    cor_destaque: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    site: Optional[str] = None


@router.put("/config")
async def put_config(payload: ConfigIn):
    patch = {k: v for k, v in payload.model_dump().items() if v is not None}
    patch["updated_at"] = now_iso()
    await config_col.update_one({"id": "default"}, {"$set": patch, "$setOnInsert": {"id": "default"}}, upsert=True)
    return await get_config()


@router.post("/config/logo")
async def upload_logo(file: UploadFile = File(...)):
    import base64
    raw = await file.read()
    if len(raw) > 3_000_000:
        raise HTTPException(400, "Logo muito grande (máx 3MB).")
    b64 = base64.b64encode(raw).decode()
    await config_col.update_one({"id": "default"},
                                {"$set": {"logo_b64": b64, "logo_mime": file.content_type or "image/png",
                                          "updated_at": now_iso()},
                                 "$setOnInsert": {"id": "default"}}, upsert=True)
    return {"ok": True, "has_logo": True}


@router.get("/config/logo")
async def get_logo():
    import base64
    from fastapi.responses import Response
    cfg = await config_col.find_one({"id": "default"})
    if not cfg or not cfg.get("logo_b64"):
        raise HTTPException(404, "Sem logo")
    return Response(content=base64.b64decode(cfg["logo_b64"]),
                    media_type=cfg.get("logo_mime", "image/png"))


def _period_months(label):
    """Estimativa grosseira de nº de meses a partir do rótulo do período."""
    if not label:
        return None
    meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    low = label.lower()
    found = [i for i, m in enumerate(meses) if m in low]
    if "a " in low or "-" in low or "–" in low:
        if len(found) >= 2:
            return found[-1] - found[0] + 1
    if "ano" in low or "anual" in low or (low.strip().isdigit() and len(low.strip()) == 4):
        return 12
    return len(found) or None


@router.get("/compare")
async def compare(a: str, b: str):
    A = await analyses_col.find_one({"id": a})
    B = await analyses_col.find_one({"id": b})
    if not A or not B:
        raise HTTPException(404, "Análise não encontrada")

    def index(an):
        ind = an.get("indicators") or {}
        out = {}
        for grp in ("cards", "margens", "liquidez"):
            for c in ind.get(grp, []):
                if c["key"] not in out:
                    out[c["key"]] = c
        return out

    ia, ib = index(A), index(B)
    keys = [k for k in ia if k in ib]
    rows = []
    for k in keys:
        ca, cb = ia[k], ib[k]
        va, vb = ca.get("value"), cb.get("value")
        var_abs = (vb - va) if (va is not None and vb is not None) else None
        var_pct = (var_abs / abs(va) * 100) if (var_abs is not None and va not in (None, 0)) else None
        rows.append({
            "key": k, "label": ca["label"], "unit": ca.get("unit"),
            "a_value": va, "a_display": ca.get("display"),
            "b_value": vb, "b_display": cb.get("display"),
            "var_abs": var_abs, "var_pct": var_pct,
        })
    ma = _period_months(A.get("period_label"))
    mb = _period_months(B.get("period_label"))
    warn = None
    if ma and mb and ma != mb:
        warn = ("Os períodos analisados possuem durações diferentes "
                f"({A.get('period_label')} ≈ {ma} meses vs {B.get('period_label')} ≈ {mb} meses). "
                "A comparação deve ser interpretada considerando essa diferença.")
    return {
        "a": {"id": a, "client_name": A.get("client_name"), "period": A.get("period_label")},
        "b": {"id": b, "client_name": B.get("client_name"), "period": B.get("period_label")},
        "rows": rows, "warning": warn,
    }


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


# ============================================================ PORTAL DO CLIENTE
def _hash_token(tok: str) -> str:
    return hashlib.sha256(tok.encode()).hexdigest()


def _portal_view(p: dict) -> dict:
    return {
        "exists": True, "active": p.get("active", True),
        "token": p.get("token"), "path": f"/portal/{p.get('token')}",
        "created_at": p.get("created_at"), "revoked_at": p.get("revoked_at"),
        "last_access_at": p.get("last_access_at"), "access_count": p.get("access_count", 0),
    }


async def _require_client(client_id: str):
    c = await clients_col.find_one({"id": client_id})
    if not c:
        raise HTTPException(404, "Cliente não encontrado")
    return c


@router.get("/clients/{client_id}/portal")
async def get_client_portal(client_id: str):
    await _require_client(client_id)
    p = await portals_col.find_one({"company_id": client_id, "active": True})
    return _portal_view(p) if p else {"exists": False, "active": False}


async def _create_portal(client_id: str) -> dict:
    tok = secrets.token_urlsafe(32)
    doc = {"id": str(uuid.uuid4()), "company_id": client_id, "token": tok,
           "token_hash": _hash_token(tok), "active": True, "created_at": now_iso(),
           "updated_at": now_iso(), "revoked_at": None, "last_access_at": None, "access_count": 0}
    await portals_col.insert_one(doc)
    return doc


@router.post("/clients/{client_id}/portal")
async def create_client_portal(client_id: str):
    await _require_client(client_id)
    p = await portals_col.find_one({"company_id": client_id, "active": True})
    if p:
        return _portal_view(p)
    return _portal_view(await _create_portal(client_id))


@router.post("/clients/{client_id}/portal/regenerate")
async def regenerate_client_portal(client_id: str):
    await _require_client(client_id)
    await portals_col.update_many({"company_id": client_id, "active": True},
                                  {"$set": {"active": False, "revoked_at": now_iso()}})
    return _portal_view(await _create_portal(client_id))


@router.post("/clients/{client_id}/portal/revoke")
async def revoke_client_portal(client_id: str):
    await _require_client(client_id)
    await portals_col.update_many({"company_id": client_id, "active": True},
                                  {"$set": {"active": False, "revoked_at": now_iso()}})
    return {"ok": True, "active": False}


# ---- rotas públicas do portal (autorização determinada pelo TOKEN) ----
_hits = defaultdict(deque)


def _rate_ok(key: str, limit: int = 90, window: int = 60) -> bool:
    now = time.time(); q = _hits[key]
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now); return True


async def _resolve_portal(token: str) -> dict:
    if not _rate_ok(token):
        raise HTTPException(429, "Muitas requisições. Tente novamente em instantes.")
    p = await portals_col.find_one({"token_hash": _hash_token(token), "active": True})
    if not p:
        raise HTTPException(404, "Link inválido, expirado ou revogado.")
    return p


def _sanitize_analysis(a: dict) -> dict:
    return {k: a.get(k) for k in ("id", "client_name", "cnpj", "period_label", "meta",
                                  "indicators", "financials", "diagnosis", "updated_at",
                                  "generated_at", "created_at", "status")}


async def _company_analyses(company_id: str):
    return await analyses_col.find(
        {"client_id": company_id, "indicators": {"$ne": None}}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)


async def _owned_analysis(p: dict, analysis_id: str) -> dict:
    a = await analyses_col.find_one({"id": analysis_id})
    if not a:
        raise HTTPException(404, "Análise não encontrada")
    if a.get("client_id") != p["company_id"]:
        raise HTTPException(403, "Acesso não autorizado para esta empresa.")
    return a


@portal_router.get("/{token}")
async def portal_session(token: str):
    p = await _resolve_portal(token)
    await portals_col.update_one({"id": p["id"]},
                                 {"$set": {"last_access_at": now_iso()}, "$inc": {"access_count": 1}})
    c = await clients_col.find_one({"id": p["company_id"]}) or {}
    analyses = await _company_analyses(p["company_id"])
    periods = [{"id": a["id"], "period_label": a.get("period_label"),
                "updated_at": a.get("updated_at") or a.get("created_at")} for a in analyses]
    stamps = [a.get("updated_at") or a.get("created_at") for a in analyses if (a.get("updated_at") or a.get("created_at"))]
    src = list({(d.get("doc_type") for d in (analyses[0].get("documents", []) if analyses else []))} or set())
    return {
        "company": {"name": c.get("name"), "cnpj": c.get("cnpj"), "razao_social": c.get("razao_social")},
        "periods": periods,
        "default_analysis_id": analyses[0]["id"] if analyses else None,
        "last_update": max(stamps) if stamps else None,
    }


@portal_router.get("/{token}/company")
async def portal_company(token: str):
    p = await _resolve_portal(token)
    c = await clients_col.find_one({"id": p["company_id"]}) or {}
    return {"name": c.get("name"), "cnpj": c.get("cnpj"), "razao_social": c.get("razao_social")}


@portal_router.get("/{token}/analyses")
async def portal_analyses(token: str):
    p = await _resolve_portal(token)
    analyses = await _company_analyses(p["company_id"])
    return [{"id": a["id"], "period_label": a.get("period_label"),
             "updated_at": a.get("updated_at") or a.get("created_at")} for a in analyses]


@portal_router.get("/{token}/analysis/{analysis_id}")
async def portal_analysis(token: str, analysis_id: str):
    p = await _resolve_portal(token)
    return _sanitize_analysis(await _owned_analysis(p, analysis_id))


async def _portal_pick(token: str, analysis_id: Optional[str]):
    p = await _resolve_portal(token)
    if not analysis_id:
        docs = await _company_analyses(p["company_id"])
        if not docs:
            raise HTTPException(404, "Sem análises disponíveis")
        return p, docs[0]
    return p, await _owned_analysis(p, analysis_id)


@portal_router.get("/{token}/panel")
async def portal_panel(token: str, analysis_id: Optional[str] = None):
    _, a = await _portal_pick(token, analysis_id)
    return {"indicators": a.get("indicators"), "financials": a.get("financials"),
            "meta": a.get("meta"), "period_label": a.get("period_label")}


@portal_router.get("/{token}/dre")
async def portal_dre(token: str, analysis_id: Optional[str] = None):
    _, a = await _portal_pick(token, analysis_id)
    return {"dre": (a.get("financials") or {}).get("dre"), "indicators": a.get("indicators")}


@portal_router.get("/{token}/balance")
async def portal_balance(token: str, analysis_id: Optional[str] = None):
    _, a = await _portal_pick(token, analysis_id)
    return {"balanco": (a.get("financials") or {}).get("balanco")}


@portal_router.get("/{token}/diagnostic")
async def portal_diagnostic(token: str, analysis_id: Optional[str] = None):
    _, a = await _portal_pick(token, analysis_id)
    return {"diagnosis": a.get("diagnosis")}
