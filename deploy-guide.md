# 🚀 Guia de Deploy na VPS

## 📋 Pré-requisitos na VPS

### 1. Instalar Node.js e npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 2. Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3. Instalar Nginx
```bash
sudo apt update
sudo apt install nginx
```

## 📁 Estrutura de Deploy

### 1. Criar diretório do projeto
```bash
sudo mkdir -p /var/www/controle-fotografo
sudo chown -R $USER:$USER /var/www/controle-fotografo
cd /var/www/controle-fotografo
```

### 2. Clonar/Enviar arquivos do projeto
```bash
# Se usando Git
git clone <seu-repositorio> .

# Ou enviar arquivos via SCP/SFTP
# scp -r ./projeto/* usuario@ip-vps:/var/www/controle-fotografo/
```

### 3. Instalar dependências
```bash
npm install
```

### 4. Build da aplicação
```bash
npm run build
```

## ⚙️ Configuração do Nginx

### 1. Criar arquivo de configuração
```bash
sudo nano /etc/nginx/sites-available/controle-fotografo
```

### 2. Configuração do Nginx (ver arquivo nginx.conf)

### 3. Ativar o site
```bash
sudo ln -s /etc/nginx/sites-available/controle-fotografo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuração do PM2

### 1. Usar arquivo ecosystem.config.js (ver arquivo)

### 2. Iniciar aplicação
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔒 SSL com Let's Encrypt (Opcional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

## 📝 Comandos Úteis

### PM2
```bash
pm2 list                 # Listar processos
pm2 restart controle     # Reiniciar aplicação
pm2 logs controle        # Ver logs
pm2 stop controle        # Parar aplicação
```

### Nginx
```bash
sudo systemctl status nginx    # Status do Nginx
sudo systemctl restart nginx   # Reiniciar Nginx
sudo nginx -t                  # Testar configuração
```

### Atualizar aplicação
```bash
cd /var/www/controle-fotografo
git pull                # Se usando Git
npm install            # Instalar novas dependências
npm run build          # Build da aplicação
pm2 restart controle   # Reiniciar aplicação
```

## 🐛 Troubleshooting

### Verificar logs
```bash
pm2 logs controle
sudo tail -f /var/log/nginx/error.log
```

### Verificar portas
```bash
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
```

### Permissões
```bash
sudo chown -R $USER:$USER /var/www/controle-fotografo
sudo chmod -R 755 /var/www/controle-fotografo
```