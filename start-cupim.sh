#!/bin/bash

echo "========================================"
echo "  Cupim na Telha - Sistema de Entregas"
echo "========================================"
echo ""
echo "Verificando Docker..."

if ! command -v docker &> /dev/null; then
    echo "[ERRO] Docker não encontrado!"
    echo ""
    echo "Por favor, instale o Docker:"
    echo "https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "Docker encontrado!"
echo ""
echo "Iniciando sistema..."
echo ""

docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  Sistema iniciado com sucesso!"
    echo "========================================"
    echo ""
    echo "Acesse o sistema em:"
    echo ""
    echo "  http://localhost:3000"
    echo ""
    echo "Para parar o sistema, execute: ./stop-cupim.sh"
    echo "========================================"
    echo ""
    
    # Tentar abrir o navegador
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    fi
else
    echo ""
    echo "[ERRO] Falha ao iniciar o sistema!"
    echo "Verifique os logs com: docker-compose logs"
fi
