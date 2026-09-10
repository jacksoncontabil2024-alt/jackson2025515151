@echo off
setlocal enabledelayedexpansion
echo ============================================
echo   Cupim na Telha - Configuracao do Servidor
echo ============================================
echo.
echo Este script prepara este computador (Notebook A)
echo para funcionar como SERVIDOR do sistema Cupim na Telha
echo na rede local.
echo.

echo [1/5] Verificando se o Docker Desktop esta instalado...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker Desktop nao encontrado neste computador!
    echo.
    echo Instale o Docker Desktop antes de continuar:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo Docker Desktop encontrado!
echo.

echo [2/5] Verificando se o Docker Desktop esta em execucao...
docker info >nul 2>&1
if %errorlevel% equ 0 goto DOCKER_JA_RODANDO

echo Docker Desktop nao esta rodando. Tentando abrir...
set "DOCKER_DESKTOP_EXE=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
if not exist "!DOCKER_DESKTOP_EXE!" goto DOCKER_NAO_ENCONTRADO
start "" "!DOCKER_DESKTOP_EXE!"

echo Aguardando o Docker Desktop iniciar, isso pode levar 1-2 minutos...
set /a TENTATIVAS=0

:ESPERA_DOCKER2
set /a TENTATIVAS+=1
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %errorlevel% equ 0 goto DOCKER_PRONTO2
if !TENTATIVAS! GEQ 24 goto DOCKER_TIMEOUT
goto ESPERA_DOCKER2

:DOCKER_NAO_ENCONTRADO
echo [ERRO] Nao foi possivel abrir o Docker Desktop automaticamente.
echo Abra manualmente e aguarde iniciar, depois execute este script de novo.
pause
exit /b 1

:DOCKER_TIMEOUT
echo [ERRO] O Docker Desktop nao iniciou a tempo. Tente novamente apos abrir manualmente.
pause
exit /b 1

:DOCKER_PRONTO2
echo Docker Desktop pronto!
goto DOCKER_CHECK_FIM

:DOCKER_JA_RODANDO
echo Docker Desktop ja esta em execucao!

:DOCKER_CHECK_FIM
echo.

echo [3/5] Criando pasta de backups (se necessario)...
if not exist "%~dp0backups" (
    mkdir "%~dp0backups"
    echo Pasta "backups" criada.
) else (
    echo Pasta "backups" ja existe.
)
echo.

echo [4/5] Construindo e iniciando os containers (isso pode levar alguns minutos)...
pushd "%~dp0"
docker-compose up -d --build
set "BUILD_RESULT=%errorlevel%"
popd

if not "%BUILD_RESULT%"=="0" (
    echo.
    echo [ERRO] Falha ao construir/iniciar o sistema!
    echo Verifique os logs com: docker-compose logs
    pause
    exit /b 1
)

echo.
echo Sistema construido e iniciado com sucesso!
echo.

echo [5/5] Endereco deste servidor na rede local:
echo.
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set "IP_ENCONTRADO=%%A"
    set "IP_ENCONTRADO=!IP_ENCONTRADO: =!"
    echo   http://!IP_ENCONTRADO!:3000
)
echo.
echo ============================================
echo   Instrucoes para o SEGUNDO notebook
echo ============================================
echo 1. Certifique-se de que o segundo notebook esta
echo    conectado na MESMA rede (Wi-Fi ou cabo) deste servidor.
echo 2. No navegador do segundo notebook, acesse um dos
echo    enderecos IP mostrados acima, na porta 3000.
echo    Exemplo: http://192.168.0.10:3000
echo 3. Veja o arquivo REDE-LOCAL.md para mais detalhes,
echo    incluindo como fixar o IP do servidor e resolver
echo    problemas de firewall.
echo ============================================
echo.

echo Deseja configurar o sistema para iniciar automaticamente
echo quando o Windows ligar (login neste computador)? (S/N)
set /p RESPOSTA_AUTOSTART=

if /i "%RESPOSTA_AUTOSTART%"=="S" goto AUTOSTART_SIM
goto AUTOSTART_NAO

:AUTOSTART_SIM
echo.
echo Configurando tarefa agendada "CupimNaTelhaAutoStart"...
schtasks /Create /TN "CupimNaTelhaAutoStart" /TR "\"%~dp0start-cupim.bat\"" /SC ONLOGON /RL HIGHEST /F
if %errorlevel% equ 0 (
    echo.
    echo Inicializacao automatica configurada com sucesso!
    echo O sistema sera iniciado automaticamente no proximo logon do Windows.
    echo Para remover essa configuracao no futuro, execute:
    echo   schtasks /Delete /TN "CupimNaTelhaAutoStart" /F
) else (
    echo.
    echo [ERRO] Nao foi possivel criar a tarefa agendada.
    echo Voce pode tentar executar este script como Administrador.
)
goto AUTOSTART_FIM

:AUTOSTART_NAO
echo.
echo Inicializacao automatica NAO configurada.
echo Voce pode iniciar o sistema manualmente executando: start-cupim.bat

:AUTOSTART_FIM
echo.
echo ============================================
echo   Configuracao do servidor concluida!
echo ============================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost:3000

pause
endlocal
