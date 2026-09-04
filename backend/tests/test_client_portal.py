"""Testes do Portal do Cliente e isolamento por empresa."""
import os
import pytest
import requests

from pathlib import Path
BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE}/api"
KNOWN_ANALYSIS = "94dd99d3-2200-4734-b5f5-6138c1eede9f"  # ACE


@pytest.fixture(scope="module")
def clients():
    r = requests.get(f"{API}/reports/clients", timeout=30)
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="module")
def ace_client_id():
    r = requests.get(f"{API}/reports/analyses/{KNOWN_ANALYSIS}", timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["client_id"]


@pytest.fixture(scope="module")
def other_client_id(clients, ace_client_id):
    # Encontrar outro cliente com análises com indicators
    for c in clients:
        if c["id"] == ace_client_id:
            continue
        if c.get("analyses_count", 0) > 0:
            # verificar se tem análise pronta
            det = requests.get(f"{API}/reports/clients/{c['id']}", timeout=15).json()
            for a in det.get("analyses", []):
                full = requests.get(f"{API}/reports/analyses/{a['id']}", timeout=15).json()
                if full.get("indicators"):
                    return c["id"], a["id"]
    pytest.skip("No other client with ready analysis")


def _ace_token(ace_client_id):
    r = requests.post(f"{API}/reports/clients/{ace_client_id}/portal", timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


class TestAdminPortalCRUD:
    def test_create_returns_token_and_path(self, ace_client_id):
        r = requests.post(f"{API}/reports/clients/{ace_client_id}/portal", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["exists"] is True and d["active"] is True
        assert d["token"] and d["path"] == f"/portal/{d['token']}"
        assert "created_at" in d and "access_count" in d

    def test_create_is_idempotent(self, ace_client_id):
        t1 = _ace_token(ace_client_id)
        t2 = _ace_token(ace_client_id)
        assert t1 == t2

    def test_get_returns_active(self, ace_client_id):
        r = requests.get(f"{API}/reports/clients/{ace_client_id}/portal", timeout=15)
        assert r.status_code == 200
        assert r.json()["exists"] is True

    def test_regenerate_invalidates_old(self, ace_client_id):
        old = _ace_token(ace_client_id)
        r = requests.post(f"{API}/reports/clients/{ace_client_id}/portal/regenerate", timeout=15)
        assert r.status_code == 200
        new = r.json()["token"]
        assert new and new != old
        # old must fail
        r_old = requests.get(f"{API}/portal/{old}", timeout=15)
        assert r_old.status_code == 404
        r_new = requests.get(f"{API}/portal/{new}", timeout=15)
        assert r_new.status_code == 200

    def test_revoke_disables(self, ace_client_id):
        # ensure exists
        r = requests.post(f"{API}/reports/clients/{ace_client_id}/portal", timeout=15)
        tok = r.json()["token"]
        rv = requests.post(f"{API}/reports/clients/{ace_client_id}/portal/revoke", timeout=15)
        assert rv.status_code == 200
        assert rv.json()["active"] is False
        r404 = requests.get(f"{API}/portal/{tok}", timeout=15)
        assert r404.status_code == 404
        # get admin -> exists false
        g = requests.get(f"{API}/reports/clients/{ace_client_id}/portal", timeout=15).json()
        assert g["exists"] is False
        # re-create for further tests
        requests.post(f"{API}/reports/clients/{ace_client_id}/portal", timeout=15)


class TestPortalPublicRoutes:
    def test_session(self, ace_client_id):
        tok = _ace_token(ace_client_id)
        r = requests.get(f"{API}/portal/{tok}", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["company"]["name"]
        assert isinstance(d["periods"], list)
        assert d["default_analysis_id"] == KNOWN_ANALYSIS or any(
            p["id"] == KNOWN_ANALYSIS for p in d["periods"])

    def test_own_analysis_ok(self, ace_client_id):
        tok = _ace_token(ace_client_id)
        r = requests.get(f"{API}/portal/{tok}/analysis/{KNOWN_ANALYSIS}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == KNOWN_ANALYSIS

    def test_cross_company_forbidden(self, ace_client_id, other_client_id):
        _, other_analysis = other_client_id
        tok = _ace_token(ace_client_id)
        r = requests.get(f"{API}/portal/{tok}/analysis/{other_analysis}", timeout=15)
        assert r.status_code == 403
        assert r.json()["detail"] == "Acesso não autorizado para esta empresa."

    def test_cross_company_panel_forbidden(self, ace_client_id, other_client_id):
        _, other_analysis = other_client_id
        tok = _ace_token(ace_client_id)
        for path in ("panel", "dre", "balance", "diagnostic"):
            r = requests.get(f"{API}/portal/{tok}/{path}?analysis_id={other_analysis}", timeout=15)
            assert r.status_code == 403, f"{path} should 403"
            assert r.json()["detail"] == "Acesso não autorizado para esta empresa."

    def test_invalid_token_404(self):
        r = requests.get(f"{API}/portal/tokeninvalido_xyz", timeout=15)
        assert r.status_code == 404

    def test_analyses_only_own_company(self, ace_client_id):
        tok = _ace_token(ace_client_id)
        r = requests.get(f"{API}/portal/{tok}/analyses", timeout=15)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json()]
        # cross-check: each id must belong to ace_client_id
        for aid in ids:
            full = requests.get(f"{API}/reports/analyses/{aid}", timeout=15).json()
            assert full["client_id"] == ace_client_id

    def test_panel_own_ok(self, ace_client_id):
        tok = _ace_token(ace_client_id)
        r = requests.get(f"{API}/portal/{tok}/panel?analysis_id={KNOWN_ANALYSIS}", timeout=15)
        assert r.status_code == 200


class TestAdminRegression:
    def test_dashboard(self):
        assert requests.get(f"{API}/reports/dashboard", timeout=15).status_code == 200

    def test_clients_list(self):
        assert requests.get(f"{API}/reports/clients", timeout=15).status_code == 200

    def test_analysis_get(self):
        assert requests.get(f"{API}/reports/analyses/{KNOWN_ANALYSIS}", timeout=15).status_code == 200

    def test_config(self):
        assert requests.get(f"{API}/reports/config", timeout=15).status_code == 200
