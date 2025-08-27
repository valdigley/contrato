# 📸 Gerenciador de Contratos

Sistema completo para gestão de contratos fotográficos com integração ao Supabase.

## 🚀 Deploy na VPS

### 📋 Pré-requisitos
- VPS com Ubuntu/Debian
- Acesso root ou sudo
- Domínio configurado (opcional)

### ⚡ Deploy Rápido

```bash
# 1. Conectar na VPS
ssh usuario@seu-ip-vps

# 2. Instalar dependências
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2 serve

# 3. Clonar projeto
sudo mkdir -p /var/www/controle-fotografo
sudo chown -R $USER:$USER /var/www/controle-fotografo
cd /var/www/controle-fotografo
git clone https://github.com/valdigley/controle.git .

# 4. Configurar e executar
chmod +x deploy.sh
./deploy.sh
```

### 🔧 Configuração do Nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/controle-fotografo

# Editar domínio (substitua seudominio.com)
sudo nano /etc/nginx/sites-available/controle-fotografo

# Ativar site
sudo ln -s /etc/nginx/sites-available/controle-fotografo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 🌐 Acessar Aplicação

- **HTTP:** `http://seu-ip-vps`
- **Com domínio:** `http://seudominio.com`

### 📚 Documentação Completa

Consulte `deploy-guide.md` para instruções detalhadas.

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔧 Configuração

1. Configure as credenciais do Supabase no sistema
2. Acesse as configurações via duplo clique no ícone de engrenagem
3. Configure tipos de eventos, pacotes e formas de pagamento

## 📱 Funcionalidades

- ✅ Gestão de contratos fotográficos
- ✅ Formulário para clientes
- ✅ Dashboard administrativo
- ✅ Geração de contratos
- ✅ Controle financeiro
- ✅ Sistema de autenticação
- ✅ Integração com Supabase

## 🤝 Suporte

Para dúvidas sobre deploy ou configuração, consulte os arquivos de documentação incluídos no projeto.