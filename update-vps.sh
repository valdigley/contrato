#!/bin/bash

# 🚀 Script para atualizar VPS com mudanças mais recentes
# Execute na VPS: chmod +x update-vps.sh && ./update-vps.sh

echo "🚀 Atualizando VPS com mudanças mais recentes..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório do projeto (/var/www/controle-fotografo)"
    exit 1
fi

# 1. Fazer backup da versão atual
log "1. Fazendo backup da versão atual..."
cp -r dist dist_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 2. Atualizar código do Git (se disponível)
if [ -d ".git" ]; then
    log "2. Atualizando código do Git..."
    git stash 2>/dev/null || true
    git pull origin main || git pull origin master || warning "Não foi possível atualizar do Git"
else
    warning "Não é um repositório Git. Pulando atualização do código..."
fi

# 3. Instalar/atualizar dependências
log "3. Instalando dependências..."
npm install

# 4. Fazer build da aplicação
log "4. Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build falhou! Diretório 'dist' não encontrado."
    exit 1
fi

# 5. Reiniciar aplicação no PM2
log "5. Reiniciando aplicação..."
if pm2 list | grep -q "contratos-fotografo\|controle-fotografo"; then
    pm2 restart contratos-fotografo 2>/dev/null || pm2 restart controle-fotografo 2>/dev/null || {
        warning "Não foi possível reiniciar pelo nome, reiniciando todos os processos..."
        pm2 restart all
    }
else
    log "Iniciando aplicação no PM2..."
    pm2 start "serve -s dist -l 3000" --name contratos-fotografo
fi

# Salvar configuração do PM2
pm2 save

# 6. Recarregar Nginx
log "6. Recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 7. Verificar se tudo está funcionando
log "7. Verificando status..."
sleep 3

# Verificar PM2
if pm2 list | grep -q "online"; then
    log "✅ Aplicação rodando no PM2"
else
    error "❌ Problema com PM2"
    pm2 list
fi

# Verificar se a aplicação responde
if curl -s http://localhost:3000 > /dev/null; then
    log "✅ Aplicação respondendo na porta 3000"
else
    error "❌ Aplicação não está respondendo na porta 3000"
fi

# Verificar Nginx
if curl -s http://localhost > /dev/null; then
    log "✅ Nginx funcionando"
else
    warning "⚠️  Nginx pode ter problemas"
fi

# 8. Limpar backups antigos (manter apenas os 3 mais recentes)
log "8. Limpando backups antigos..."
ls -t dist_backup_* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

echo ""
echo "=================================="
echo "🎉 ATUALIZAÇÃO CONCLUÍDA!"
echo "=================================="
echo ""
echo "📊 Status dos serviços:"
pm2 list
echo ""
echo "🌐 Acesse sua aplicação:"
echo "🔗 http://$(hostname -I | awk '{print $1}')"
echo "🔗 http://contratos.fotografo.site (se configurado)"
echo ""
echo "=================================="

log "🎯 Atualização da VPS finalizada!"