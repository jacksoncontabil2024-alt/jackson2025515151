@echo off
echo ========================================
echo   Cupim na Telha - Sistema de Entregas
echo ========================================
echo.
echo Verificando Docker...

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao encontrado!
    echo.
    echo Por favor, instale o Docker Desktop:
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Docker encontrado!
echo.
echo Iniciando sistema...
echo.

docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Sistema iniciado com sucesso!
    echo ========================================
    echo.
    echo Acesse o sistema em:
    echo.
    echo   http://localhost:3000
    echo.
    echo Para parar o sistema, execute: stop-cupim.bat
    echo ========================================
    echo.
    timeout /t 3 >nul
    start http://localhost:3000
) else (
    echo.
    echo [ERRO] Falha ao iniciar o sistema!
    echo Verifique os logs com: docker-compose logs
    pause
)
