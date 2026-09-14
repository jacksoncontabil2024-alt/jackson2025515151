import os
import sys
from pathlib import Path

# Detecta o diretorio base (onde o executavel/launcher esta)
BASE_DIR = Path(sys.executable).parent.resolve() if getattr(sys, "frozen", False) else Path(__file__).parent.resolve()

# Configura sys.path para encontrar as dependencias do Python embeddable
sys.path.insert(0, str(BASE_DIR / "python-embed" / "Lib" / "site-packages"))
sys.path.insert(0, str(BASE_DIR / "python-embed"))

import time
import subprocess
import webbrowser
import signal
import shutil

BACKEND_DIR = BASE_DIR / "backend"
MONGO_BIN_DIR = BASE_DIR / "mongodb" / "windows" / "bin"
MONGOD_EXE = MONGO_BIN_DIR / "mongod.exe"

APP_NAME = "CupimNaTelha"
DATA_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local")) / APP_NAME
MONGO_DATA_DIR = DATA_DIR / "mongodb_data"
BACKUP_DIR = DATA_DIR / "backups"
LOG_DIR = DATA_DIR / "logs"
ENV_FILE = DATA_DIR / ".env"

processes = []


def log(msg):
    print(msg, flush=True)


def ensure_dirs():
    for d in (DATA_DIR, MONGO_DATA_DIR, BACKUP_DIR, LOG_DIR):
        d.mkdir(parents=True, exist_ok=True)


def generate_env():
    if ENV_FILE.exists():
        return
    import secrets
    jwt_secret = secrets.token_urlsafe(32)
    env_content = (
        f"MONGO_URL=mongodb://localhost:27017\n"
        f"DB_NAME=cupim_telha\n"
        f"CORS_ORIGINS=*\n"
        f"JWT_SECRET={jwt_secret}\n"
        f"BACKUP_DIR={BACKUP_DIR}\n"
        f"BACKUP_HOUR=23\n"
    )
    ENV_FILE.write_text(env_content, encoding="utf-8")
    log(f"Arquivo .env criado em: {ENV_FILE}")


def load_env():
    import dotenv
    dotenv.load_dotenv(ENV_FILE)


def find_python():
    return str(BASE_DIR / "python-embed" / "python.exe")


def wait_for_mongodb(mongod_proc, timeout=60):
    import pymongo
    start = time.time()
    while time.time() - start < timeout:
        if mongod_proc.poll() is not None:
            log("ERRO: O processo do MongoDB encerrou inesperadamente.")
            return False
        try:
            client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1000)
            client.admin.command("ping")
            client.close()
            return True
        except Exception as e:
            log(f"Aguardando MongoDB... ({e})")
            time.sleep(1)
    return False


def start_mongodb():
    if not MONGOD_EXE.exists():
        log(f"ERRO: mongod.exe nao encontrado em {MONGOD_EXE}")
        log("Verifique se o MongoDB foi incluido no pacote.")
        sys.exit(1)

    cmd = [
        str(MONGOD_EXE),
        "--dbpath", str(MONGO_DATA_DIR),
        "--bind_ip", "127.0.0.1",
        "--port", "27017",
        "--quiet",
    ]
    log(f"Iniciando MongoDB...")
    log(f"Comando: {' '.join(cmd)}")
    proc = subprocess.Popen(cmd, cwd=str(DATA_DIR))
    processes.append(proc)

    log("Aguardando MongoDB ficar disponivel...")
    if wait_for_mongodb(proc):
        log("MongoDB pronto.")
    else:
        log("ERRO: MongoDB nao iniciou a tempo.")
        shutdown()
        sys.exit(1)


def start_backend():
    python = find_python()
    env = os.environ.copy()
    env["MONGO_URL"] = "mongodb://localhost:27017"
    env["DB_NAME"] = "cupim_telha"
    env["CORS_ORIGINS"] = "*"
    env["BACKUP_DIR"] = str(BACKUP_DIR)
    env["BACKUP_HOUR"] = "23"
    if not env.get("JWT_SECRET"):
        import secrets
        env["JWT_SECRET"] = secrets.token_urlsafe(32)

    server_file = BACKEND_DIR / "server.py"
    cmd = [
        str(python), "-m", "uvicorn", "server:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--app-dir", str(BACKEND_DIR),
    ]
    log(f"Iniciando backend...")
    log(f"Comando: {' '.join(cmd)}")
    proc = subprocess.Popen(cmd, cwd=str(BACKEND_DIR), env=env)
    processes.append(proc)


def open_browser():
    time.sleep(3)
    url = "http://localhost:8001"
    log(f"Abrindo navegador em {url}")
    try:
        webbrowser.open(url)
    except Exception as e:
        log(f"Nao foi possivel abrir o navegador: {e}")


def get_local_ip():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(("8.8.8.8", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def shutdown(signum=None, frame=None):
    log("\nEncerrando Cupim na Telha...")
    for proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    log("=" * 50)
    log("Cupim na Telha - Modo Desktop")
    log("=" * 50)

    ensure_dirs()
    generate_env()
    load_env()

    start_mongodb()
    start_backend()

    # Aguarda backend subir
    log("Aguardando backend ficar disponivel...")
    time.sleep(2)

    local_ip = get_local_ip()
    log("\n" + "=" * 50)
    log(f"Servidor local:   http://localhost:8001")
    log(f"Outros PCs na rede Wi-Fi: http://{local_ip}:8001")
    log("=" * 50 + "\n")

    open_browser()

    # Mantem o processo principal vivo
    while True:
        time.sleep(1)
        for proc in processes:
            if proc.poll() is not None:
                log("Um dos processos encerrou inesperadamente.")
                shutdown()


if __name__ == "__main__":
    main()
