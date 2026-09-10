@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   Cupim na Telha - Status do Sistema
echo ========================================
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao encontrado neste computador!
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker Desktop nao esta em execucao.
    echo Abra o Docker Desktop e execute start-cupim.bat.
    pause
    exit /b 1
)

echo ----------------------------------------
echo   Containers em execucao
echo ----------------------------------------
pushd "%~dp0"
docker-compose ps
popd
echo.

echo ----------------------------------------
echo   Endereco deste servidor na rede local
echo ----------------------------------------
echo Acesso neste computador:
echo   http://localhost:3000
echo.
echo Acesso de outros computadores na rede local:
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set "IP_ENCONTRADO=%%A"
    set "IP_ENCONTRADO=!IP_ENCONTRADO: =!"
    echo   http://!IP_ENCONTRADO!:3000
)
echo.

echo ----------------------------------------
echo   Ultimos backups
echo ----------------------------------------
set "BACKUP_DIR=%~dp0backups"
if exist "%BACKUP_DIR%" (
    set "ENCONTROU_BACKUP=0"
    for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%" 2^>nul') do (
        if !ENCONTROU_BACKUP! LSS 5 (
            echo   %%F
            set /a ENCONTROU_BACKUP+=1
        )
    )
    if "!ENCONTROU_BACKUP!"=="0" (
        echo   Nenhum backup encontrado ainda em "%BACKUP_DIR%".
    )
) else (
    echo   Pasta de backups nao encontrada: "%BACKUP_DIR%"
)
echo.

echo ========================================
pause
endlocal
