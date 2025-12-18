#!/bin/bash

echo "========================================="
echo "  Empacotando Cupim na Telha"
echo "========================================="
echo ""

# Nome do pacote
PACKAGE_NAME="cupim-na-telha-v1.0.0"
PACKAGE_DIR="$PACKAGE_NAME"

# Criar diretório temporário
echo "Criando estrutura..."
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copiar arquivos necessários
echo "Copiando arquivos..."
cp -r backend "$PACKAGE_DIR/"
cp -r frontend "$PACKAGE_DIR/"
cp docker-compose.yml "$PACKAGE_DIR/"
cp Dockerfile.backend "$PACKAGE_DIR/"
cp Dockerfile.frontend "$PACKAGE_DIR/"
cp nginx.conf "$PACKAGE_DIR/"
cp .dockerignore "$PACKAGE_DIR/"
cp start-cupim.bat "$PACKAGE_DIR/"
cp stop-cupim.bat "$PACKAGE_DIR/"
cp start-cupim.sh "$PACKAGE_DIR/"
cp stop-cupim.sh "$PACKAGE_DIR/"
cp README-INSTALACAO.md "$PACKAGE_DIR/README.md"

# Limpar arquivos desnecessários
echo "Limpando arquivos desnecessários..."
rm -rf "$PACKAGE_DIR/frontend/node_modules"
rm -rf "$PACKAGE_DIR/frontend/build"
rm -rf "$PACKAGE_DIR/backend/__pycache__"
rm -rf "$PACKAGE_DIR/backend/.pytest_cache"

# Criar arquivo ZIP
echo "Criando arquivo ZIP..."
zip -r "${PACKAGE_NAME}.zip" "$PACKAGE_DIR" > /dev/null

# Limpar diretório temporário
rm -rf "$PACKAGE_DIR"

echo ""
echo "========================================="
echo "  Pacote criado com sucesso!"
echo "========================================="
echo ""
echo "Arquivo: ${PACKAGE_NAME}.zip"
echo "Tamanho: $(du -h ${PACKAGE_NAME}.zip | cut -f1)"
echo ""
echo "Distribua este arquivo para instalação!"
echo "========================================="
