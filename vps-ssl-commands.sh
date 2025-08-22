#!/bin/bash

# 🔒 Comandos para configurar SSL na VPS
# Execute estes comandos um por vez na sua VPS

echo "🔒 Configurando SSL para contratos.fotografo.site..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update

# 2. Instalar Nginx (se não estiver instalado)
echo "🌐 Instalando Nginx..."
sudo apt install -y nginx

# 3. Instalar Certbot
echo "🔐 Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# 4. Verificar se PM2 está rodando a aplicação
echo "🔍 Verificando PM2..."
pm2 list

# Se não estiver rodando, execute:
# pm2 start "serve -s dist -l 3000" --name contratos-fotografo
# pm2 save

# 5. Criar configuração do Nginx
echo "⚙️ Criando configuração do Nginx..."
sudo tee /etc/nginx/sites-available/contratos-fotografo-site > /dev/null << 'EOF'
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

# 6. Ativar site no Nginx
echo "🔗 Ativando site no Nginx..."
sudo ln -sf /etc/nginx/sites-available/contratos-fotografo-site /etc/nginx/sites-enabled/

# 7. Remover site padrão (opcional)
sudo rm -f /etc/nginx/sites-enabled/default

# 8. Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

# 9. Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

# 10. Gerar certificado SSL
echo "🔒 Gerando certificado SSL..."
sudo certbot --nginx -d contratos.fotografo.site --non-interactive --agree-tos --email admin@fotografo.site

# 11. Verificar status do certificado
echo "✅ Verificando certificado..."
sudo certbot certificates

# 12. Testar renovação automática
echo "🔄 Configurando renovação automática..."
sudo certbot renew --dry-run

echo ""
echo "=================================="
echo "🎉 CONFIGURAÇÃO SSL CONCLUÍDA!"
echo "=================================="
echo ""
echo "🔒 Acesse: https://contratos.fotografo.site"
echo ""
echo "✅ Certificado válido por 90 dias"
echo "✅ Renovação automática configurada"
echo "=================================="