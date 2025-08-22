#!/bin/bash

# 🚀 Script de Deploy Automático
# Execute: chmod +x deploy.sh && ./deploy.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/var/www/controle-fotografo"
BACKUP_DIR="/var/backups/controle-fotografo"
DATE=$(date +%Y%m%d_%H%M%S)

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Verificar se está rodando como usuário correto
if [ "$EUID" -eq 0 ]; then
    error "Não execute este script como root!"
fi

# Verificar se o diretório do projeto existe
if [ ! -d "$PROJECT_DIR" ]; then
    error "Diretório do projeto não encontrado: $PROJECT_DIR"
fi

cd $PROJECT_DIR

# Backup da versão atual
log "Criando backup da versão atual..."
sudo mkdir -p $BACKUP_DIR
sudo cp -r $PROJECT_DIR $BACKUP_DIR/backup_$DATE

# Atualizar código (se usando Git)
if [ -d ".git" ]; then
    log "Atualizando código do Git..."
    git pull origin main || git pull origin master
else
    warning "Não é um repositório Git. Pulando atualização..."
fi

# Instalar/atualizar dependências
log "Instalando dependências..."
npm ci --production=false

# Build da aplicação
log "Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build falhou! Diretório 'dist' não encontrado."
fi

# Instalar serve se não estiver instalado
if ! command -v serve &> /dev/null; then
    log "Instalando serve..."
    sudo npm install -g serve
fi

# Reiniciar aplicação com PM2
log "Reiniciando aplicação..."
if pm2 list | grep -q "controle-fotografo"; then
    pm2 restart controle-fotografo
else
    pm2 start ecosystem.config.js
fi

# Salvar configuração do PM2
pm2 save

# Recarregar Nginx
log "Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# Verificar se a aplicação está rodando
sleep 5
if pm2 list | grep -q "online.*controle-fotografo"; then
    log "✅ Deploy concluído com sucesso!"
    log "🌐 Aplicação disponível em: http://$(hostname -I | awk '{print $1}')"
else
    error "❌ Aplicação não está rodando corretamente!"
fi

# Limpar backups antigos (manter apenas os 5 mais recentes)
log "Limpando backups antigos..."
sudo find $BACKUP_DIR -name "backup_*" -type d | sort -r | tail -n +6 | sudo xargs rm -rf

log "🎉 Deploy finalizado!"