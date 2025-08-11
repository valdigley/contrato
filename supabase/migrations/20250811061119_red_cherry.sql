/*
  # Sistema de Formas de Pagamento

  1. Nova Tabela
    - `payment_methods`
      - `id` (uuid, primary key)
      - `name` (text, nome da forma de pagamento)
      - `description` (text, descrição detalhada)
      - `discount_percentage` (numeric, desconto em %)
      - `installments` (integer, número de parcelas)
      - `payment_schedule` (jsonb, cronograma de pagamento)
      - `is_active` (boolean, ativo/inativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Tabela de Relacionamento
    - `package_payment_methods`
      - `id` (uuid, primary key)
      - `package_id` (uuid, referência ao pacote)
      - `payment_method_id` (uuid, referência à forma de pagamento)
      - `final_price` (numeric, preço final com desconto/acréscimo)

  3. Dados Iniciais
    - À vista (-5%)
    - Parcelas iguais até a data do evento
    - 50% ao agendar + 50% um dia antes

  4. Segurança
    - RLS habilitado
    - Políticas para leitura pública e gestão autenticada
*/

-- Criar tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discount_percentage numeric(5,2) DEFAULT 0,
  installments integer DEFAULT 1,
  payment_schedule jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de relacionamento pacote-forma de pagamento
CREATE TABLE IF NOT EXISTS package_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  payment_method_id uuid NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  final_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(package_id, payment_method_id)
);

-- Habilitar RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas para payment_methods
CREATE POLICY "Public can read active payment methods"
  ON payment_methods
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para package_payment_methods
CREATE POLICY "Public can read package payment methods"
  ON package_payment_methods
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage package payment methods"
  ON package_payment_methods
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_package_payment_methods_package_id ON package_payment_methods(package_id);
CREATE INDEX IF NOT EXISTS idx_package_payment_methods_payment_method_id ON package_payment_methods(payment_method_id);

-- Inserir formas de pagamento padrão
INSERT INTO payment_methods (name, description, discount_percentage, installments, payment_schedule) VALUES
(
  'À Vista (PIX)',
  'Pagamento à vista via PIX com 5% de desconto',
  -5.00,
  1,
  '[{"percentage": 100, "description": "Pagamento integral à vista"}]'::jsonb
),
(
  'Parcelas Iguais até o Evento',
  'Parcelamento em parcelas iguais até a data do evento via PIX (sem juros)',
  0.00,
  0,
  '[{"percentage": 0, "description": "Parcelas calculadas conforme data do evento"}]'::jsonb
),
(
  '50% + 50%',
  '50% ao agendar e 50% um dia antes do evento',
  0.00,
  2,
  '[
    {"percentage": 50, "description": "50% no agendamento"},
    {"percentage": 50, "description": "50% um dia antes do evento"}
  ]'::jsonb
);