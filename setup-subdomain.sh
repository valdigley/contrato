#!/bin/bash

# 🌐 Script para configurar subdomínio
# Execute: chmod +x setup-subdomain.sh && ./setup-subdomain.sh

echo "🌐 Configurando subdomínio para o sistema de contratos..."

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

# Solicitar domínio do usuário
echo "=================================="
echo "🌐 CONFIGURAÇÃO DE SUBDOMÍNIO"
echo "=================================="
echo ""
read -p "Digite seu domínio principal (ex: meusite.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    error "Domínio não pode estar vazio!"
    exit 1
fi

echo ""
echo "📋 Configurações:"
echo "- Domínio principal: $DOMAIN"
echo "- Subdomínio: contratos.$DOMAIN"
echo "- IP do servidor: $(hostname -I | awk '{print $1}')"
echo ""

# Confirmar configuração
read -p "Confirma essas configurações? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Configuração cancelada."
    exit 0
fi

# Criar configuração do Nginx
log "Criando configuração do Nginx..."
cat > /etc/nginx/sites-available/contratos-$DOMAIN << EOF
server {
    listen 80;
    server_name contratos.$DOMAIN;
    
    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
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
    
    # Logs específicos para o subdomínio
    access_log /var/log/nginx/contratos.access.log;
    error_log /var/log/nginx/contratos.error.log;
}
EOF

# Ativar site
log "Ativando site no Nginx..."
ln -sf /etc/nginx/sites-available/contratos-$DOMAIN /etc/nginx/sites-enabled/

# Testar configuração
log "Testando configuração do Nginx..."
if nginx -t; then
    log "✅ Configuração do Nginx OK"
    systemctl reload nginx
else
    error "❌ Erro na configuração do Nginx"
    exit 1
fi

# Verificar se PM2 está rodando
log "Verificando PM2..."
if ! pm2 list | grep -q "controle-fotografo.*online"; then
    log "Iniciando aplicação no PM2..."
    pm2 start "serve -s dist -l 3000" --name controle-fotografo
    pm2 save
fi

echo ""
echo "=================================="
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo "=================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🌐 CONFIGURAR DNS:"
echo "   - Acesse o painel do seu provedor de domínio"
echo "   - Adicione um registro A:"
echo "     Nome: contratos"
echo "     Tipo: A"
echo "     Valor: $(hostname -I | awk '{print $1}')"
echo "     TTL: 300 (ou padrão)"
echo ""
echo "2. ⏰ AGUARDAR PROPAGAÇÃO:"
echo "   - DNS pode levar até 24h para propagar"
echo "   - Normalmente leva 5-30 minutos"
echo ""
echo "3. 🧪 TESTAR ACESSO:"
echo "   - http://contratos.$DOMAIN"
echo ""
echo "4. 🔒 CONFIGURAR SSL (OPCIONAL):"
echo "   sudo certbot --nginx -d contratos.$DOMAIN"
echo ""
echo "=================================="
echo "🌐 URLs DO SEU SISTEMA:"
echo "=================================="
echo "🔗 HTTP:  http://contratos.$DOMAIN"
echo "🔗 HTTPS: https://contratos.$DOMAIN (após SSL)"
echo "=================================="

# Verificar se o DNS já está configurado
log "Verificando DNS atual..."
if nslookup contratos.$DOMAIN >/dev/null 2>&1; then
    log "✅ DNS já configurado para contratos.$DOMAIN"
else
    warning "⚠️  DNS ainda não configurado. Configure no seu provedor de domínio."
fi

echo ""
log "🎯 Configuração do subdomínio finalizada!"