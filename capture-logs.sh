#!/bin/bash

# Script para capturar logs del servidor de desarrollo
# Uso: ./capture-logs.sh

LOG_FILE="logs/nextjs-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

echo "📝 Capturando logs en: $LOG_FILE"
echo "Presiona Ctrl+C para detener"
echo ""

# Ejecutar el servidor y capturar toda la salida
yarn dev 2>&1 | tee "$LOG_FILE"

