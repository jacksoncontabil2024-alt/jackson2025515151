"""Tests for admin authentication (JWT HTTPOnly cookie) and protected routes."""
import os
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None

# Fallback: read from frontend .env if not exported
if not BASE_URL:
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
            break

API = f"{BASE_URL}/api"


# ---------- fixtures ----------
@pytest.fixture
def s():
    return requests.Session()


@pytest.fixture
def admin(s):
    r = s.post(f"{API}/admin/login", json={"identifier": "admin", "password": "admin"})
    assert r.status_code == 200, r.text
    return s


# ---------- admin auth ----------
def test_login_success_sets_cookie(s):
    r = s.post(f"{API}/admin/login", json={"identifier": "admin", "password": "admin"})
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "admin"
    assert "name" in data and "email" in data
    assert "felcont_admin" in s.cookies.get_dict()


def test_login_wrong_password():
    r = requests.post(f"{API}/admin/login", json={"identifier": "admin", "password": "wrong"})
    assert r.status_code == 401
    assert "invál" in r.json().get("detail", "").lower() or "credenc" in r.json().get("detail", "").lower()


def test_me_without_cookie_401():
    r = requests.get(f"{API}/admin/me")
    assert r.status_code == 401


def test_me_with_cookie_200(admin):
    r = admin.get(f"{API}/admin/me")
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_logout_clears_cookie(admin):
    r = admin.post(f"{API}/admin/logout")
    assert r.status_code == 200
    # after logout /me should be 401
    r2 = requests.get(f"{API}/admin/me")  # fresh session
    assert r2.status_code == 401


# ---------- protected /api/reports/* ----------
@pytest.mark.parametrize("path", [
    "/reports/dashboard",
    "/reports/clients",
    "/reports/analyses",
])
def test_reports_get_requires_auth(path):
    r = requests.get(f"{API}{path}")
    assert r.status_code == 401, f"{path} -> {r.status_code}"


def test_reports_post_requires_auth():
    r = requests.post(f"{API}/reports/clients", json={"name": "X"})
    assert r.status_code == 401


def test_reports_authenticated_200(admin):
    for p in ["/reports/dashboard", "/reports/clients", "/reports/analyses"]:
        r = admin.get(f"{API}{p}")
        assert r.status_code == 200, f"{p} -> {r.status_code} / {r.text[:200]}"


# ---------- portal público ----------
def test_portal_invalid_token_404():
    r = requests.get(f"{API}/portal/nonexistent-token-xyz")
    assert r.status_code == 404


def test_portal_public_flow(admin):
    # find/create a client and generate portal token
    r = admin.get(f"{API}/reports/clients")
    assert r.status_code == 200
    clients = r.json()
    if not clients:
        cr = admin.post(f"{API}/reports/clients", json={"name": "TEST_PortalCli"})
        assert cr.status_code in (200, 201)
        cid = cr.json()["id"]
    else:
        cid = clients[0]["id"]

    pr = admin.post(f"{API}/reports/clients/{cid}/portal")
    assert pr.status_code in (200, 201), pr.text
    token = pr.json().get("token") or pr.json().get("portal_token")
    assert token

    # public access - fresh session (no cookie)
    r = requests.get(f"{API}/portal/{token}")
    assert r.status_code == 200, r.text
    r2 = requests.get(f"{API}/portal/{token}/panel")
    assert r2.status_code == 200, r2.text


# ---------- docs disabled ----------
@pytest.mark.parametrize("path", ["/api/openapi.json", "/api/docs", "/api/redoc"])
def test_docs_disabled(path):
    r = requests.get(f"{BASE_URL}{path}")
    assert r.status_code == 404, f"{path} -> {r.status_code}"
