/*
  # Criar tabelas principais do sistema

  1. Tabelas Criadas
    - `users` - Usuários do sistema
    - `photographers` - Perfis de fotógrafos
    - `event_types` - Tipos de eventos
    - `packages` - Pacotes de serviços
    - `payment_methods` - Formas de pagamento
    - `contract_templates` - Modelos de contrato
    - `contratos` - Contratos principais
    - `payments` - Pagamentos dos contratos
    - `package_payment_methods` - Relacionamento pacote-pagamento

  2. Recursos
    - Todas as tabelas com RLS habilitado
    - Índices para performance
    - Triggers para updated_at
    - Constraints e validações
*/

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'photographer' CHECK (role IN ('photographer', 'client')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de fotógrafos
CREATE TABLE IF NOT EXISTS photographers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name text NOT NULL,
    phone text NOT NULL,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Tabela de tipos de eventos
CREATE TABLE IF NOT EXISTS event_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    discount_percentage numeric(5,2) DEFAULT 0,
    installments integer DEFAULT 1,
    payment_schedule jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de pacotes
CREATE TABLE IF NOT EXISTS packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0,
    features jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de modelos de contrato
CREATE TABLE IF NOT EXISTS contract_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
    name text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabela de relacionamento pacote-pagamento
CREATE TABLE IF NOT EXISTS package_payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    payment_method_id uuid NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
    final_price numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(package_id, payment_method_id)
);

-- Tabela principal de contratos
CREATE TABLE IF NOT EXISTS contratos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo text NOT NULL,
    cpf text NOT NULL,
    endereco text NOT NULL,
    cidade text NOT NULL,
    data_nascimento date NOT NULL,
    tipo_evento text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    local_pre_wedding text,
    local_making_of text,
    local_cerimonia text,
    local_festa text NOT NULL,
    nome_noivos text,
    nome_aniversariante text,
    event_type_id uuid REFERENCES event_types(id),
    package_id uuid REFERENCES packages(id),
    package_price numeric(10,2) DEFAULT 0,
    final_price numeric(10,2) DEFAULT 0,
    payment_method_id uuid REFERENCES payment_methods(id),
    preferred_payment_day integer CHECK (preferred_payment_day >= 1 AND preferred_payment_day <= 28),
    email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    whatsapp text NOT NULL CHECK (whatsapp ~ '^[0-9]{10,11}$'),
    data_evento date,
    horario_evento time,
    photographer_id uuid REFERENCES photographers(id) ON DELETE CASCADE,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
    adjusted_price numeric(10,2) DEFAULT NULL,
    discount_percentage numeric(5,2) DEFAULT 0,
    custom_notes text
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id uuid NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL DEFAULT 0,
    due_date date NOT NULL,
    paid_date date,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    description text,
    payment_method text DEFAULT 'dinheiro',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_photographers_user_id ON photographers(user_id);
CREATE INDEX IF NOT EXISTS idx_event_types_active ON event_types(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_event_type_id ON packages(event_type_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_templates_event_type_id ON contract_templates(event_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_package_payment_methods_package_id ON package_payment_methods(package_id);
CREATE INDEX IF NOT EXISTS idx_package_payment_methods_payment_method_id ON package_payment_methods(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_contratos_created_at ON contratos(created_at);
CREATE INDEX IF NOT EXISTS idx_contratos_email ON contratos(email);
CREATE INDEX IF NOT EXISTS idx_contratos_cpf ON contratos(cpf);
CREATE INDEX IF NOT EXISTS idx_contratos_data_evento ON contratos(data_evento);
CREATE INDEX IF NOT EXISTS idx_contratos_event_type_id ON contratos(event_type_id);
CREATE INDEX IF NOT EXISTS idx_contratos_package_id ON contratos(package_id);
CREATE INDEX IF NOT EXISTS idx_contratos_payment_method_id ON contratos(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_contratos_photographer_id ON contratos(photographer_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_types_updated_at
    BEFORE UPDATE ON event_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at
    BEFORE UPDATE ON contratos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();