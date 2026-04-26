#!/bin/bash
# Script de Deploy para Linux/Mac
VPS_HOST="129.121.53.213"
VPS_PORT="22022"
VPS_USER="root"
DEST_DIR="/root/junardaci"

echo "Iniciando deploy para $VPS_USER@$VPS_HOST:$VPS_PORT..."

# 1. Criar a pasta no destino
ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "mkdir -p $DEST_DIR"

# 2. Enviar arquivos (excluindo pastas pesadas)
echo "Enviando arquivos..."
scp -P $VPS_PORT -r Dockerfile docker-compose.yml nginx.conf package.json package-lock.json src public index.html vite.config.js .env.local "$VPS_USER@$VPS_HOST:$DEST_DIR/"

# Renomear .env.local para .env na VPS
ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "mv $DEST_DIR/.env.local $DEST_DIR/.env"

# 3. Build e Up
echo "Executando Docker Compose na VPS..."
ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "cd $DEST_DIR && docker-compose up --build -d"

echo "Deploy concluído!"
