#!/bin/bash

echo "========================================"
echo "  Parando Cupim na Telha..."
echo "========================================"
echo ""

docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "Sistema parado com sucesso!"
    echo ""
else
    echo ""
    echo "[ERRO] Falha ao parar o sistema!"
    echo ""
fi
