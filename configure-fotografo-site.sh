#!/bin/bash

# 🌐 Configurar contratos.fotografo.site
echo "🌐 Configurando contratos.fotografo.site..."

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

# 0. Ensure Nginx and essential utilities are installed
log "0. Ensuring Nginx and essential utilities are installed..."
if ! command -v nginx &> /dev/null; then
    warning "Nginx not found. Attempting to install Nginx..."
    apt update && apt install -y nginx
    if ! command -v nginx &> /dev/null; then
        error "Failed to install Nginx. Please install it manually (e.g., apt install nginx) and try again."
        exit 1
    fi
fi

if ! command -v grep &> /dev/null; then
    warning "Grep not found. Attempting to install grep..."
    apt update && apt install -y grep
    if ! command -v grep &> /dev/null; then
        error "Failed to install grep. Please install it manually (e.g., apt install grep) and try again."
        exit 1
    fi
fi

# Ensure Nginx configuration directories exist
log "Ensuring Nginx configuration directories exist..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# 1. Parar PM2 e limpar
log "1. Limpando PM2..."
pm2 delete all 2>/dev/null || true

# 2. Verificar se aplicação está buildada
if [ ! -d "dist" ]; then
    log "Build não encontrado, fazendo build..."
    npm run build
fi

# 3. Iniciar aplicação na porta 3000
log "2. Iniciando aplicação na porta 3000..."
pm2 start "serve -s dist -l 3000" --name contratos-fotografo
pm2 save

# 4. Configurar Nginx
log "3. Configurando Nginx para contratos.fotografo.site..."

# Remover configurações antigas
rm -f /etc/nginx/sites-enabled/controle-fotografo* 2>/dev/null || true
rm -f /etc/nginx/sites-available/controle-fotografo* 2>/dev/null || true

# Criar nova configuração
cat > /etc/nginx/sites-available/contratos-fotografo-site << 'EOF'
server {
    listen 80;
    server_name contratos.fotografo.site;
    
    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Logs específicos para o subdomínio
    access_log /var/log/nginx/contratos-fotografo.access.log;
    error_log /var/log/nginx/contratos-fotografo.error.log;
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/contratos-fotografo-site /etc/nginx/sites-enabled/

# 5. Testar e recarregar Nginx
log "4. Testando configuração do Nginx..."
if nginx -t; then
    log "✅ Configuração do Nginx OK"
    systemctl reload nginx
else
    error "❌ Erro na configuração do Nginx"
    exit 1
fi

# 6. Verificar se aplicação está rodando
log "5. Verificando aplicação..."
sleep 3
if curl -s http://localhost:3000 > /dev/null; then
    log "✅ Aplicação rodando na porta 3000"
else
    error "❌ Aplicação não está respondendo na porta 3000"
    pm2 logs contratos-fotografo --lines 10
    exit 1
fi

# 7. Verificar portas
log "6. Verificando portas abertas..."
if command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :80
    ss -tlnp | grep :3000
else
    netstat -tlnp | grep :80 2>/dev/null || echo "Porta 80 não encontrada"
    netstat -tlnp | grep :3000 2>/dev/null || echo "Porta 3000 não encontrada"
fi

echo ""
echo "=================================="
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo "=================================="
echo ""
echo "📋 PRÓXIMO PASSO - CONFIGURAR DNS:"
echo ""
echo "1. 🌐 Acesse o painel do seu provedor de domínio fotografo.site"
echo "2. 📝 Adicione um registro A:"
echo "   Nome: contratos"
echo "   Tipo: A"
echo "   Valor: 147.93.182.205"
echo "   TTL: 300"
echo ""
echo "3. ⏰ Aguarde 5-30 minutos para propagação"
echo ""
echo "4. 🧪 Teste o acesso:"
echo "   http://contratos.fotografo.site"
echo ""
echo "=================================="
echo "🌐 URL DO SEU SISTEMA:"
echo "=================================="
echo "🔗 http://contratos.fotografo.site"
echo "=================================="

# 8. Testar DNS atual
log "7. Verificando DNS atual..."
if nslookup contratos.fotografo.site >/dev/null 2>&1; then
    log "✅ DNS já configurado!"
    echo ""
    echo "🎯 TESTE AGORA: http://contratos.fotografo.site"
else
    warning "⚠️  DNS ainda não configurado. Configure no painel do fotografo.site"
fi

log "🎯 Configuração finalizada!"