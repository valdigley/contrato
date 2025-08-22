#!/bin/bash

# 🔧 Script para corrigir problemas de deployment
# Execute: chmod +x fix-deployment.sh && ./fix-deployment.sh

echo "🔧 Diagnosticando e corrigindo problemas..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# 1. Verificar se PM2 está rodando corretamente
log "1. Verificando PM2..."
pm2 list

# Parar todas as instâncias duplicadas
log "Parando instâncias duplicadas..."
pm2 delete all 2>/dev/null || true

# Iniciar apenas uma instância correta
log "Iniciando aplicação corretamente..."
cd /var/www/controle-fotografo
pm2 start "serve -s dist -l 3000" --name controle-fotografo
pm2 save

# 2. Verificar se a aplicação está respondendo localmente
log "2. Testando aplicação localmente..."
if curl -s http://localhost:3000 > /dev/null; then
    log "✅ Aplicação respondendo na porta 3000"
else
    error "❌ Aplicação não está respondendo na porta 3000"
    exit 1
fi

# 3. Configurar Nginx corretamente
log "3. Configurando Nginx..."

# Remover configuração anterior se existir
rm -f /etc/nginx/sites-enabled/controle-fotografo
rm -f /etc/nginx/sites-available/controle-fotografo

# Criar nova configuração do Nginx
cat > /etc/nginx/sites-available/controle-fotografo << 'EOF'
server {
    listen 80;
    server_name _;  # Aceita qualquer domínio/IP
    
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
    
    # Logs
    access_log /var/log/nginx/controle-fotografo.access.log;
    error_log /var/log/nginx/controle-fotografo.error.log;
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/controle-fotografo /etc/nginx/sites-enabled/

# Remover site padrão do Nginx se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
log "Testando configuração do Nginx..."
if nginx -t; then
    log "✅ Configuração do Nginx OK"
    systemctl reload nginx
else
    error "❌ Erro na configuração do Nginx"
    exit 1
fi

# 4. Verificar se Nginx está rodando
log "4. Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    log "✅ Nginx está rodando"
else
    warning "Nginx não está rodando, iniciando..."
    systemctl start nginx
fi

# 5. Verificar firewall (UFW)
log "5. Verificando firewall..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp
    ufw allow 22/tcp
    log "✅ Portas 80 e 22 liberadas no firewall"
else
    log "UFW não instalado, pulando configuração de firewall"
fi

# 6. Verificar iptables
log "6. Verificando iptables..."
if iptables -L INPUT -n | grep -q "DROP\|REJECT"; then
    warning "Regras restritivas encontradas no iptables"
    # Liberar porta 80
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT
    iptables -I INPUT -p tcp --dport 22 -j ACCEPT
    log "✅ Portas liberadas no iptables"
fi

# 7. Testar conectividade
log "7. Testando conectividade..."

# Testar localmente
if curl -s http://localhost > /dev/null; then
    log "✅ Nginx respondendo localmente"
else
    error "❌ Nginx não está respondendo localmente"
fi

# Descobrir IP externo
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')

# 8. Verificar portas abertas
log "8. Verificando portas abertas..."
if command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :80
    ss -tlnp | grep :3000
elif command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :80
    netstat -tlnp | grep :3000
else
    log "Instalando net-tools..."
    apt update && apt install -y net-tools 2>/dev/null || yum install -y net-tools 2>/dev/null || true
    if command -v netstat >/dev/null 2>&1; then
        netstat -tlnp | grep :80
        netstat -tlnp | grep :3000
    fi
fi

# 9. Status final
log "9. Status final do sistema..."
echo "=================================="
echo "🔍 DIAGNÓSTICO FINAL:"
echo "=================================="

# PM2 Status
echo "📊 PM2 Status:"
pm2 list

# Nginx Status
echo ""
echo "🌐 Nginx Status:"
systemctl status nginx --no-pager -l

# Testar URLs
echo ""
echo "🧪 Testes de conectividade:"
echo "- Local (porta 3000): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "- Local (porta 80): $(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)"

echo ""
echo "=================================="
echo "🌐 ACESSE SUA APLICAÇÃO:"
echo "=================================="
echo "🔗 URL: http://$EXTERNAL_IP"
echo "🔗 IP: $EXTERNAL_IP"
echo "=================================="

# 10. Verificar logs se houver erro
if ! curl -s http://localhost > /dev/null; then
    echo ""
    echo "🔍 LOGS DE ERRO:"
    echo "=================================="
    echo "📋 Nginx Error Log:"
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "Nenhum log de erro encontrado"
    
    echo ""
    echo "📋 PM2 Logs:"
    pm2 logs controle-fotografo --lines 10 --nostream 2>/dev/null || echo "Nenhum log PM2 encontrado"
fi

log "🎉 Script de correção finalizado!"