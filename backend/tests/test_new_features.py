"""FELCONT REPORTS AI - Tests for new features: /config, /config/logo, /compare, waterfall slide."""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"')
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api/reports"
EXISTING_ID = "94dd99d3-2200-4734-b5f5-6138c1eede9f"


def _tiny_png():
    """Generate a tiny valid 1x1 red PNG in-memory."""
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\xff\x00\x00")
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# ---------------- /config ----------------
class TestConfig:
    def test_get_config_defaults(self):
        r = requests.get(f"{API}/config", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d.get("cor_primaria") == "#322F6A"
        assert "cor_secundaria" in d
        assert d.get("cor_destaque") == "#04B7AF"
        assert "has_logo" in d and isinstance(d["has_logo"], bool)

    def test_put_config_persists(self):
        payload = {"cor_destaque": "#00A99D", "email": "TEST_qa@felcont.com"}
        r = requests.put(f"{API}/config", json=payload, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["cor_destaque"] == "#00A99D"
        assert d["email"] == "TEST_qa@felcont.com"
        # GET reflects
        r2 = requests.get(f"{API}/config", timeout=30).json()
        assert r2["cor_destaque"] == "#00A99D"
        assert r2["email"] == "TEST_qa@felcont.com"
        # Restore default color
        requests.put(f"{API}/config", json={"cor_destaque": "#04B7AF"}, timeout=30)

    def test_upload_logo_and_get(self):
        png = _tiny_png()
        files = {"file": ("logo.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/config/logo", files=files, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        assert d.get("has_logo") is True
        # GET returns image
        r2 = requests.get(f"{API}/config/logo", timeout=30)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 30
        # config now reports has_logo True
        cfg = requests.get(f"{API}/config", timeout=30).json()
        assert cfg["has_logo"] is True


# ---------------- /compare ----------------
class TestCompare:
    def _create(self, period_label):
        r = requests.post(f"{API}/analyses", json={
            "client_name": "TEST_CmpClient",
            "period_label": period_label,
        }, timeout=30)
        assert r.status_code == 200, r.text
        return r.json()["id"]

    def test_compare_warning_for_different_durations(self):
        id_a = self._create("Ano de 2025")
        id_b = self._create("Jan a Jul de 2026")
        r = requests.get(f"{API}/compare", params={"a": id_a, "b": id_b}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["a"]["id"] == id_a
        assert d["b"]["id"] == id_b
        assert d["a"].get("period") == "Ano de 2025"
        assert d["b"].get("period") == "Jan a Jul de 2026"
        assert isinstance(d.get("rows"), list)
        # warning must be present and mention months
        assert d.get("warning"), f"warning missing: {d}"
        assert "meses" in d["warning"].lower() or "mes" in d["warning"].lower()

    def test_compare_returns_rows_for_existing_with_self(self):
        # comparing an analysis with itself: rows should contain indicators
        r = requests.get(f"{API}/compare", params={"a": EXISTING_ID, "b": EXISTING_ID}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["rows"], list)
        # existing has indicators computed
        assert len(d["rows"]) > 0
        row0 = d["rows"][0]
        for k in ("key", "label", "a_value", "b_value", "var_abs", "var_pct"):
            assert k in row0

    def test_compare_404(self):
        r = requests.get(f"{API}/compare", params={"a": "no-such-id", "b": "also-no"}, timeout=30)
        assert r.status_code == 404


# ---------------- Waterfall slide generation ----------------
class TestWaterfall:
    def test_diagnose_produces_waterfall_slide(self):
        r = requests.post(f"{API}/analyses/{EXISTING_ID}/diagnose", timeout=180)
        assert r.status_code == 200, r.text
        a = r.json()
        slides = a.get("slides") or []
        types = [s.get("type", "") for s in slides]
        titles = [s.get("title", "") for s in slides]
        assert "waterfall" in types, f"waterfall slide missing. types={types}"
        # Title 'Formação do Resultado' expected on that slide
        idx = types.index("waterfall")
        assert "Forma" in titles[idx] or "Resultado" in titles[idx], titles[idx]

    def test_generate_pptx_with_waterfall(self):
        r = requests.post(f"{API}/analyses/{EXISTING_ID}/generate", timeout=180)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("pptx_url")
        # download
        r2 = requests.get(f"{BASE_URL}{d['pptx_url']}", timeout=120)
        assert r2.status_code == 200
        assert len(r2.content) > 10000
