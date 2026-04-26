# Script de Deploy para Windows (PowerShell)
$VPS_HOST = "129.121.53.213"
$VPS_PORT = "22022"
$VPS_USER = "root"
$DEST_DIR = "/root/junardaci"

Write-Host "Iniciando deploy para ${VPS_USER}@${VPS_HOST}:${VPS_PORT}..." -ForegroundColor Cyan

# 1. Criar a pasta no destino se não existir
ssh -p $VPS_PORT "${VPS_USER}@${VPS_HOST}" "mkdir -p $DEST_DIR"

# 2. Enviar arquivos essenciais (excluindo node_modules, dist, .git)
# Nota: Enviamos o .env.local como .env para a VPS
Write-Host "Enviando arquivos..." -ForegroundColor Yellow
scp -P $VPS_PORT -r Dockerfile docker-compose.yml nginx.conf package.json package-lock.json src public index.html vite.config.js "${VPS_USER}@${VPS_HOST}:${DEST_DIR}/"
scp -P $VPS_PORT .env.local "${VPS_USER}@${VPS_HOST}:${DEST_DIR}/.env"

# 3. Executar o build e subir os containers
Write-Host "Executando Build e Docker Compose na VPS..." -ForegroundColor Yellow
ssh -p $VPS_PORT "${VPS_USER}@${VPS_HOST}" "cd $DEST_DIR && docker-compose down && docker-compose up --build -d"

Write-Host "Deploy concluído! Acesse http://app.junardaci.inovaflowtec.com.br:8081" -ForegroundColor Green
