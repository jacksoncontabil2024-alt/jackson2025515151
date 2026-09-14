import os
import subprocess
import sys
from pathlib import Path

# Log para depuracao
log_file = Path(os.environ.get("TEMP", "C:\\temp")) / "cupim_launcher.log"

def log(msg):
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def main():
    log("Launcher iniciado")
    log(f"sys.argv[0] = {sys.argv[0]}")
    log(f"sys.executable = {sys.executable}")
    log(f"frozen = {getattr(sys, 'frozen', False)}")

    base_dir = Path(sys.argv[0]).resolve().parent
    log(f"base_dir = {base_dir}")

    python_exe = base_dir / "python-embed" / "python.exe"
    desktop_manager = base_dir / "desktop_manager.py"

    log(f"python_exe exists = {python_exe.exists()}")
    log(f"desktop_manager exists = {desktop_manager.exists()}")

    if not python_exe.exists():
        log("ERRO: python.exe nao encontrado")
        sys.exit(1)

    env = os.environ.copy()
    env["PYTHONPATH"] = str(base_dir / "python-embed" / "Lib" / "site-packages")
    env["PYTHONHOME"] = str(base_dir / "python-embed")

    cmd = [str(python_exe), str(desktop_manager)]
    log(f"cmd = {cmd}")

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(base_dir),
            env=env,
            creationflags=0,
        )
        log(f"processo iniciado com pid {proc.pid}")
        proc.wait()
        log(f"processo encerrou com codigo {proc.returncode}")
    except Exception as e:
        log(f"ERRO: {e}")
        import traceback
        log(traceback.format_exc())

if __name__ == "__main__":
    main()
