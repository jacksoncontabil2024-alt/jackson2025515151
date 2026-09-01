"""FELCONT REPORTS AI - backend endpoint tests."""
import os
import io
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fall back to frontend/.env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

API = f"{BASE_URL}/api/reports"
EXISTING_ID = "94dd99d3-2200-4734-b5f5-6138c1eede9f"
SAMPLE_PDF_URL = (
    "https://customer-assets-eiarnc6j.emergentagent.net/job_dre-ronaldo-donadon/"
    "artifacts/0x6klhcr_balanco_patrimonial_lado_a_lado.pdf"
)


@pytest.fixture(scope="session")
def sample_pdf_bytes():
    r = requests.get(SAMPLE_PDF_URL, timeout=60)
    assert r.status_code == 200 and len(r.content) > 1000, "could not download sample PDF"
    return r.content


# ---------------- Dashboard ----------------
class TestDashboard:
    def test_dashboard_shape(self):
        r = requests.get(f"{API}/dashboard", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("clients", "analyses", "pending", "inconsistencies", "recent_analyses", "recent_clients"):
            assert k in d, f"missing key {k}"
        assert isinstance(d["recent_analyses"], list)
        assert isinstance(d["recent_clients"], list)
        assert isinstance(d["clients"], int)


# ---------------- Clients ----------------
class TestClients:
    def test_list_clients(self):
        r = requests.get(f"{API}/clients", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_client_from_existing_analysis(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        cid = a.get("client_id")
        assert cid, "existing analysis missing client_id"
        r = requests.get(f"{API}/clients/{cid}", timeout=30)
        assert r.status_code == 200
        c = r.json()
        assert c["id"] == cid
        assert "analyses" in c and isinstance(c["analyses"], list)

    def test_get_client_404(self):
        r = requests.get(f"{API}/clients/nonexistent-xyz", timeout=30)
        assert r.status_code == 404


# ---------------- Existing pre-processed analysis ----------------
class TestExistingAnalysis:
    def test_get(self):
        r = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30)
        assert r.status_code == 200
        a = r.json()
        assert a["id"] == EXISTING_ID
        assert a["status"] in ("gerado", "revisao", "validacao")

    def test_doc_type_recognized(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        docs = a.get("documents") or []
        assert docs, "no documents"
        assert "balan" in docs[0]["doc_type"].lower()

    def test_validation_ok_and_balance_check(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        v = a.get("validation") or {}
        assert v.get("overall") == "ok"
        labels = [c["label"] for c in v.get("checks", [])]
        assert any("Ativo" in l and "Passivo" in l for l in labels), f"missing Ativo=Passivo+PL check: {labels}"

    def test_disponibilidade_value(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        cards = {c["key"]: c for c in (a.get("indicators") or {}).get("cards", [])}
        assert "disponibilidade" in cards
        assert cards["disponibilidade"]["display"] == "R$ 475.635,31", cards["disponibilidade"]["display"]

    def test_dre_fields_insufficient_never_invented(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        cards = {c["key"]: c for c in (a.get("indicators") or {}).get("cards", [])}
        # With only Balance sheet uploaded, DRE indicators must be "Dados insuficientes" (value None)
        for k in ("receita_liquida", "resultado_liquido", "margem_liquida", "ebitda"):
            assert cards[k]["value"] is None, f"{k} should be null, got {cards[k]}"
            assert cards[k]["display"] == "Dados insuficientes"

    def test_diagnosis_present(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        diag = a.get("diagnosis")
        assert diag, "diagnosis missing"
        for k in ("resumo_executivo", "diagnostico", "recomendacoes"):
            assert k in diag

    def test_slides_dynamic_no_dre_slide(self):
        a = requests.get(f"{API}/analyses/{EXISTING_ID}", timeout=30).json()
        slides = a.get("slides") or []
        assert len(slides) > 0
        # No slide should be a DRE slide (no DRE data)
        types = [s.get("type", "") for s in slides]
        titles = [s.get("title", "").lower() for s in slides]
        # DRE-specific slide type shouldn't appear
        assert not any("dre" == t.lower() or t.lower() == "folha" for t in types), types

    def test_download_pptx(self):
        r = requests.get(f"{API}/analyses/{EXISTING_ID}/download/pptx", timeout=60)
        assert r.status_code == 200
        assert "presentation" in r.headers.get("content-type", "").lower() or r.headers.get("content-type", "").endswith("pptx")
        assert len(r.content) > 5000

    def test_download_pdf(self):
        r = requests.get(f"{API}/analyses/{EXISTING_ID}/download/pdf", timeout=60)
        # PDF may or may not be generated depending on soffice
        if r.status_code == 404:
            pytest.skip("PDF not generated on this run")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert len(r.content) > 1000


# ---------------- Create + upload flow ----------------
class TestPipelineCreate:
    def test_create_analysis(self):
        payload = {
            "client_name": "TEST_Empresa Regressao",
            "cnpj": "00.000.000/0001-00",
            "period_label": "TEST 2026",
            "responsavel": "Pytest",
        }
        r = requests.post(f"{API}/analyses", json=payload, timeout=30)
        assert r.status_code == 200
        a = r.json()
        assert a["status"] == "rascunho"
        assert a["client_name"] == payload["client_name"]
        assert "id" in a
        pytest.test_analysis_id = a["id"]

    def test_upload_document(self, sample_pdf_bytes):
        aid = getattr(pytest, "test_analysis_id", None)
        if not aid:
            pytest.skip("create step failed")
        files = {"files": ("bp.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")}
        r = requests.post(f"{API}/analyses/{aid}/documents", files=files, timeout=180)
        assert r.status_code == 200, r.text
        a = r.json()
        assert a["status"] == "validacao"
        docs = a.get("documents") or []
        assert docs, "no docs after upload"
        assert "balan" in docs[0].get("doc_type", "").lower(), docs[0]
        # Validation should be ok with the balance check
        v = a.get("validation") or {}
        assert v.get("overall") == "ok", v
        # DRE must remain insufficient
        cards = {c["key"]: c for c in (a.get("indicators") or {}).get("cards", [])}
        assert cards["receita_liquida"]["value"] is None
        # Disponibilidade must match sample
        assert cards["disponibilidade"]["display"] == "R$ 475.635,31"

    def test_diagnose_and_generate(self):
        aid = getattr(pytest, "test_analysis_id", None)
        if not aid:
            pytest.skip("previous step failed")
        r = requests.post(f"{API}/analyses/{aid}/diagnose", timeout=120)
        assert r.status_code == 200, r.text
        a = r.json()
        diag = a.get("diagnosis") or {}
        assert diag.get("resumo_executivo")
        assert isinstance(diag.get("diagnostico"), list)
        assert isinstance(diag.get("recomendacoes"), list)
        assert len(a.get("slides") or []) > 0

        r = requests.post(f"{API}/analyses/{aid}/generate", timeout=180)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("pptx_url") and d["pptx_url"].endswith("/download/pptx")

        # download the pptx
        r2 = requests.get(f"{BASE_URL}{d['pptx_url']}", timeout=120)
        assert r2.status_code == 200
        ct = r2.headers.get("content-type", "").lower()
        assert "presentation" in ct or "officedocument" in ct
        assert len(r2.content) > 5000

    def test_cleanup(self):
        # No DELETE endpoint - leave marked with TEST_ prefix. Best-effort skip.
        pass
