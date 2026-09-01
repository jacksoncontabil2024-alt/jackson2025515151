"""Backend tests for FELCONT deck endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dre-ronaldo-donadon.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    return s


def test_deck_info(client):
    r = client.get(f"{BASE_URL}/api/deck/info", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert data["slide_count"] == 9
    assert data["pptx_bytes"] > 0
    assert isinstance(data["slides"], list)
    assert len(data["slides"]) == 9
    for i, s in enumerate(data["slides"], start=1):
        assert s["n"] == i
        assert s["title"]
        assert s["image"] == f"/api/deck/slide/{i}"


@pytest.mark.parametrize("n", list(range(1, 10)))
def test_deck_slide_png(client, n):
    r = client.get(f"{BASE_URL}/api/deck/slide/{n}", timeout=30)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("image/png")
    assert len(r.content) > 0


def test_deck_slide_not_found(client):
    r = client.get(f"{BASE_URL}/api/deck/slide/99", timeout=30)
    assert r.status_code == 404


def test_deck_download_pptx(client):
    r = client.get(f"{BASE_URL}/api/deck/download", timeout=60)
    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "officedocument.presentationml.presentation" in ct
    cd = r.headers.get("content-disposition", "")
    assert "FELCONT_Analise_Gerencial.pptx" in cd
    assert len(r.content) > 0


def test_deck_pdf(client):
    r = client.get(f"{BASE_URL}/api/deck/pdf", timeout=60)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert len(r.content) > 0
