#!/bin/bash

echo "🔧 Configurando acesso pela porta 8080..."

# Criar configuração para porta 8080
cat > /etc/nginx/sites-available/contratos-port-8080 << 'EOF'
server {
    listen 8080;
    server_name _;
    
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
    
    access_log /var/log/nginx/contratos-8080.access.log;
    error_log /var/log/nginx/contratos-8080.error.log;
}
EOF

# Ativar configuração
ln -s /etc/nginx/sites-available/contratos-port-8080 /etc/nginx/sites-enabled/contratos-port-8080

# Testar e recarregar
nginx -t && systemctl reload nginx

echo "✅ Configurado! Acesse: http://147.93.182.205:8080"