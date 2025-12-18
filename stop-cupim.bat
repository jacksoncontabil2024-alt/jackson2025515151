@echo off
echo ========================================
echo   Parando Cupim na Telha...
echo ========================================
echo.

docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo Sistema parado com sucesso!
    echo.
) else (
    echo.
    echo [ERRO] Falha ao parar o sistema!
    echo.
)

pause
