#!/bin/bash

# 🚀 Script de Deploy Simples
# Execute: chmod +x deploy-simple.sh && ./deploy-simple.sh

echo "🚀 Iniciando deploy simples..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build da aplicação
echo "🔨 Fazendo build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -d "dist" ]; then
    echo "❌ Build falhou! Diretório 'dist' não encontrado."
    exit 1
fi

# Parar PM2 se estiver rodando
echo "⏹️ Parando aplicação anterior..."
pm2 stop controle-fotografo 2>/dev/null || true
pm2 delete controle-fotografo 2>/dev/null || true

# Iniciar aplicação
echo "▶️ Iniciando aplicação..."
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar Nginx se não estiver configurado
if [ ! -f /etc/nginx/sites-enabled/controle-fotografo ]; then
    echo "⚙️ Configurando Nginx..."
    cp nginx.conf /etc/nginx/sites-available/controle-fotografo
    ln -s /etc/nginx/sites-available/controle-fotografo /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

# Verificar status
echo "🔍 Verificando status..."
pm2 list

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: http://$(hostname -I | awk '{print $1}')"