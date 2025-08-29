#!/bin/bash

# 🚀 Script de Instalação Completa na VPS
# Execute: chmod +x install-vps.sh && ./install-vps.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando instalação na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    error "Execute este script como root: sudo ./install-vps.sh"
fi

# Configurações
PROJECT_DIR="/var/www/controle-fotografo"
DOMAIN="contratos.fotografo.site"
PORT=3001

log "🔧 Configurações:"
info "- Diretório: $PROJECT_DIR"
info "- Domínio: $DOMAIN"
info "- Porta da aplicação: $PORT"
echo ""

# 1. Atualizar sistema
log "1. Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar Node.js 18
log "2. Instalando Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Verificar versão
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "✅ Node.js: $NODE_VERSION"
log "✅ npm: $NPM_VERSION"

# 3. Instalar PM2 e serve globalmente
log "3. Instalando PM2 e serve..."
npm install -g pm2 serve

# 4. Instalar Nginx
log "4. Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# 5. Criar diretório do projeto
log "5. Criando diretório do projeto..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# 6. Clonar o projeto do GitHub
log "6. Clonando projeto do GitHub..."
git clone https://github.com/valdigley/controle.git . || {
  error "Erro ao clonar repositório. Verifique se o repositório existe e é público."
}

# 7. Instalar dependências
log "7. Instalando dependências..."
npm install

# 8. Fazer build
log "8. Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build falhou! Diretório 'dist' não encontrado."
fi

# 9. Parar PM2 anterior
log "9. Limpando PM2..."
pm2 delete all 2>/dev/null || true

# 10. Criar arquivo de configuração do PM2
log "10. Criando configuração do PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'contratos-fotografo',
    script: 'serve',
    args: '-s dist -l $PORT',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    }
  }]
};
EOF

# 11. Iniciar aplicação
log "11. Iniciando aplicação..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 12. Configurar Nginx
log "12. Configurando Nginx..."

# Remover configurações antigas
rm -f /etc/nginx/sites-enabled/contratos-* 2>/dev/null || true
rm -f /etc/nginx/sites-available/contratos-* 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Criar nova configuração
cat > /etc/nginx/sites-available/contratos-fotografo << EOF
server {
    listen 80;
    server_name $DOMAIN _;
    
    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Logs
    access_log /var/log/nginx/contratos-fotografo.access.log;
    error_log /var/log/nginx/contratos-fotografo.error.log;
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/contratos-fotografo /etc/nginx/sites-enabled/

# 13. Testar e recarregar Nginx
log "13. Testando configuração do Nginx..."
if nginx -t; then
    log "✅ Configuração do Nginx OK"
    systemctl reload nginx
    systemctl enable nginx
else
    error "❌ Erro na configuração do Nginx"
fi

# 14. Configurar firewall
log "14. Configurando firewall..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    log "✅ Firewall configurado"
fi

# 15. Verificar se tudo está funcionando
log "15. Verificando instalação..."
sleep 3

# Verificar PM2
if pm2 list | grep -q "online.*contratos-fotografo"; then
    log "✅ PM2 rodando"
else
    error "❌ Problema com PM2"
fi

# Verificar aplicação
if curl -s http://localhost:$PORT > /dev/null; then
    log "✅ Aplicação respondendo na porta $PORT"
else
    error "❌ Aplicação não está respondendo"
fi

# Verificar Nginx
if curl -s http://localhost > /dev/null; then
    log "✅ Nginx funcionando"
else
    warning "⚠️  Nginx pode ter problemas"
fi

# Descobrir IP externo
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "=================================="
echo "🎉 INSTALAÇÃO CONCLUÍDA!"
echo "=================================="
echo ""
echo "📊 Status dos serviços:"
pm2 list
echo ""
echo "🌐 URLs de acesso:"
echo "🔗 Por IP: http://$EXTERNAL_IP"
echo "🔗 Por domínio: http://$DOMAIN (configure o DNS)"
echo ""
echo "📋 Próximos passos para o domínio:"
echo "1. Configure o DNS no painel fotografo.site:"
echo "   Nome: contratos"
echo "   Tipo: A"
echo "   Valor: $EXTERNAL_IP"
echo "   TTL: 300"
echo ""
echo "2. Aguarde 5-30 minutos para propagação"
echo ""
echo "3. Para SSL (HTTPS), execute:"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "=================================="
echo "🎯 SISTEMA INSTALADO COM SUCESSO!"
echo "=================================="

log "🎉 Instalação finalizada!"