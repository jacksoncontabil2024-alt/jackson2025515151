@echo off
setlocal enabledelayedexpansion
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
echo Verificando se o Docker Desktop esta em execucao...

docker info >nul 2>&1
if %errorlevel% equ 0 goto DOCKER_JA_RODANDO

echo Docker Desktop parece estar fechado. Tentando abrir...

set "DOCKER_DESKTOP_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "!DOCKER_DESKTOP_EXE!" goto DOCKER_NAO_ENCONTRADO
start "" "!DOCKER_DESKTOP_EXE!"

echo Aguardando o Docker Desktop iniciar, isso pode levar 1-2 minutos...
set /a TENTATIVAS=0

:ESPERA_DOCKER
set /a TENTATIVAS+=1
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% equ 0 goto DOCKER_PRONTO
if !TENTATIVAS! GEQ 24 goto DOCKER_TIMEOUT
echo Ainda aguardando o Docker Desktop... (tentativa !TENTATIVAS!/24)
goto ESPERA_DOCKER

:DOCKER_NAO_ENCONTRADO
echo [ERRO] Nao foi possivel localizar o Docker Desktop automaticamente.
echo Por favor, abra o Docker Desktop manualmente e aguarde ele iniciar.
pause
exit /b 1

:DOCKER_TIMEOUT
echo.
echo [ERRO] O Docker Desktop nao iniciou a tempo.
echo Abra o Docker Desktop manualmente, aguarde a inicializacao completa
echo e execute este script novamente.
pause
exit /b 1

:DOCKER_PRONTO
echo Docker Desktop esta pronto!
goto DOCKER_CHECK_FIM

:DOCKER_JA_RODANDO
echo Docker Desktop ja esta em execucao!

:DOCKER_CHECK_FIM

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
    echo Acesse o sistema neste computador em:
    echo.
    echo   http://localhost:3000
    echo.
    echo ----------------------------------------
    echo   Endereco para acesso pela rede local
    echo ----------------------------------------
    echo Para acessar de OUTRO computador (segundo notebook),
    echo use o(s) IP(s) abaixo na porta 3000:
    echo.
    for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
        set "IP_ENCONTRADO=%%A"
        set "IP_ENCONTRADO=!IP_ENCONTRADO: =!"
        echo   http://!IP_ENCONTRADO!:3000
    )
    echo.
    echo Informe um desses enderecos ao usuario do segundo notebook.
    echo ========================================
    echo.
    echo Para parar o sistema, execute: stop-cupim.bat
    echo Para ver o status do sistema, execute: status-cupim.bat
    echo ========================================
    echo.
    timeout /t 3 /nobreak >nul
    start http://localhost:3000
) else (
    echo.
    echo [ERRO] Falha ao iniciar o sistema!
    echo Verifique os logs com: docker-compose logs
    pause
)

endlocal
