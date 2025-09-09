/*
  # Configurar Row Level Security (RLS)

  1. Habilitar RLS em todas as tabelas
  2. Criar políticas de segurança
  3. Permitir acesso adequado para usuários autenticados
*/

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Políticas para photographers
CREATE POLICY "Photographers can manage own profile"
    ON photographers FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para event_types (público para leitura, autenticado para escrita)
CREATE POLICY "Public can read active event types"
    ON event_types FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage event types"
    ON event_types FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para payment_methods
CREATE POLICY "Public can read active payment methods"
    ON payment_methods FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage payment methods"
    ON payment_methods FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para packages
CREATE POLICY "Public can read active packages"
    ON packages FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY "Authenticated users can manage packages"
    ON packages FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para contract_templates
CREATE POLICY "Authenticated users can manage contract templates"
    ON contract_templates FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para package_payment_methods
CREATE POLICY "Public can read package payment methods"
    ON package_payment_methods FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Authenticated users can manage package payment methods"
    ON package_payment_methods FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para contratos
CREATE POLICY "Users can manage own contracts"
    ON contratos FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para payments
CREATE POLICY "Users can manage payments for own contracts"
    ON payments FOR ALL
    TO authenticated
    USING (contract_id IN (
        SELECT id FROM contratos
    ))
    WITH CHECK (contract_id IN (
        SELECT id FROM contratos
    ));