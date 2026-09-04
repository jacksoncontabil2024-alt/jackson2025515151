"""Autenticação administrativa (JWT em cookie HTTPOnly). Portal do cliente permanece público."""
import os
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, Response, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
admin_users = _db["admin_users"]

JWT_SECRET = os.environ["JWT_SECRET"]
ALG = "HS256"
COOKIE = "felcont_admin"
MAXAGE = 60 * 60 * 12  # 12h

admin_router = APIRouter(prefix="/api/admin")


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _verify(pw: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), h.encode())
    except Exception:
        return False


def _token(u: dict) -> str:
    payload = {"sub": u["id"], "email": u.get("email"), "name": u.get("name"),
               "role": u.get("role", "admin"), "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(seconds=MAXAGE)}
    return jwt.encode(payload, JWT_SECRET, algorithm=ALG)


async def seed_admin():
    email = (os.environ.get("ADMIN_EMAIL") or "admin").lower()
    pw = os.environ.get("ADMIN_PASSWORD") or "admin"
    name = os.environ.get("ADMIN_NAME") or "Administrador"
    existing = await admin_users.find_one({"email": email})
    if not existing:
        await admin_users.insert_one({
            "id": str(uuid.uuid4()), "name": name, "email": email, "username": email,
            "password_hash": _hash(pw), "active": True, "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(), "last_login_at": None,
        })
    elif not _verify(pw, existing["password_hash"]):
        await admin_users.update_one({"id": existing["id"]}, {"$set": {"password_hash": _hash(pw)}})


def require_admin(request: Request) -> dict:
    token = request.cookies.get(COOKIE)
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Sessão inválida.")
    return payload


class LoginIn(BaseModel):
    identifier: str
    password: str


@admin_router.post("/login")
async def login(body: LoginIn, response: Response):
    ident = body.identifier.strip().lower()
    u = await admin_users.find_one({"$or": [{"email": ident}, {"username": ident}]})
    if not u or not u.get("active", True) or not _verify(body.password, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    tok = _token(u)
    response.set_cookie(COOKIE, tok, httponly=True, secure=True, samesite="lax",
                        max_age=MAXAGE, path="/")
    await admin_users.update_one({"id": u["id"]},
                                 {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}})
    return {"name": u.get("name"), "email": u.get("email"), "role": u.get("role", "admin")}


@admin_router.get("/me")
async def me(payload: dict = Depends(require_admin)):
    return {"name": payload.get("name"), "email": payload.get("email"), "role": payload.get("role")}


@admin_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}
