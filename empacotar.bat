@echo off
echo =========================================
echo   Empacotando Cupim na Telha
echo =========================================
echo.

set PACKAGE_NAME=cupim-na-telha-v1.0.0

echo Criando estrutura...
if exist "%PACKAGE_NAME%" rmdir /s /q "%PACKAGE_NAME%"
mkdir "%PACKAGE_NAME%"

echo Copiando arquivos...
xcopy /E /I /Q backend "%PACKAGE_NAME%\backend"
xcopy /E /I /Q frontend "%PACKAGE_NAME%\frontend"
copy docker-compose.yml "%PACKAGE_NAME%\"
copy Dockerfile.backend "%PACKAGE_NAME%\"
copy Dockerfile.frontend "%PACKAGE_NAME%\"
copy nginx.conf "%PACKAGE_NAME%\"
copy .dockerignore "%PACKAGE_NAME%\"
copy start-cupim.bat "%PACKAGE_NAME%\"
copy stop-cupim.bat "%PACKAGE_NAME%\"
copy start-cupim.sh "%PACKAGE_NAME%\"
copy stop-cupim.sh "%PACKAGE_NAME%\"
copy README-INSTALACAO.md "%PACKAGE_NAME%\README.md"
copy INSTALACAO-RAPIDA.txt "%PACKAGE_NAME%\"
copy GUIA-INSTALACAO-WINDOWS.md "%PACKAGE_NAME%\"

echo Limpando arquivos desnecessários...
if exist "%PACKAGE_NAME%\frontend\node_modules" rmdir /s /q "%PACKAGE_NAME%\frontend\node_modules"
if exist "%PACKAGE_NAME%\frontend\build" rmdir /s /q "%PACKAGE_NAME%\frontend\build"
if exist "%PACKAGE_NAME%\backend\__pycache__" rmdir /s /q "%PACKAGE_NAME%\backend\__pycache__"

echo.
echo Criando arquivo ZIP...
powershell Compress-Archive -Path "%PACKAGE_NAME%" -DestinationPath "%PACKAGE_NAME%.zip" -Force

echo Limpando diretório temporário...
rmdir /s /q "%PACKAGE_NAME%"

echo.
echo =========================================
echo   Pacote criado com sucesso!
echo =========================================
echo.
echo Arquivo: %PACKAGE_NAME%.zip
echo.
echo Distribua este arquivo para instalação!
echo =========================================
echo.
pause
