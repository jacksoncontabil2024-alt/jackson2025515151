import subprocess
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.resolve()
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_DIR = PROJECT_ROOT / "backend"
STATIC_DIR = BACKEND_DIR / "static"


def run(cmd, cwd=None):
    print(f"\n\u27a4 {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True)
    if result.returncode != 0:
        print(f"Erro ao executar: {cmd}")
        sys.exit(result.returncode)


def main():
    # 1. Build do frontend React
    run("yarn build", cwd=FRONTEND_DIR)

    build_dir = FRONTEND_DIR / "build"
    if not build_dir.exists():
        print("Pasta build/ nao foi gerada.")
        sys.exit(1)

    # 2. Limpar e recriar backend/static
    if STATIC_DIR.exists():
        shutil.rmtree(STATIC_DIR)
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

    # 3. Copiar conteudo do build para backend/static
    for item in build_dir.iterdir():
        dest = STATIC_DIR / item.name
        if item.is_dir():
            shutil.copytree(item, dest, dirs_exist_ok=True)
        else:
            shutil.copy2(item, dest)

    print(f"\nFrontend copiado para: {STATIC_DIR}")
    print("Pronto para empacotamento desktop.")


if __name__ == "__main__":
    main()
