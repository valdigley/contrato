/*
  # Criar tabela de pagamentos

  1. Nova Tabela
    - `payments`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key para contratos)
      - `amount` (numeric, valor do pagamento)
      - `due_date` (date, data de vencimento)
      - `paid_date` (date, data do pagamento)
      - `status` (enum, status do pagamento)
      - `description` (text, descrição)
      - `payment_method` (text, método de pagamento)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Enum para status
    - pending, paid, overdue, cancelled

  3. Índices
    - contract_id, status, due_date

  4. Políticas RLS
    - Usuários autenticados podem gerenciar pagamentos
*/

-- Criar enum para status de pagamento
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_date date,
  status payment_status NOT NULL DEFAULT 'pending',
  description text,
  payment_method text DEFAULT 'dinheiro',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments(paid_date);

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pagamentos
CREATE POLICY "Authenticated users can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous read access to payments"
  ON payments
  FOR SELECT
  TO anon
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns pagamentos de exemplo (opcional)
DO $$
DECLARE
  contract_record RECORD;
  payment_amount numeric;
  installments integer;
  i integer;
BEGIN
  -- Para cada contrato existente, criar pagamentos de exemplo
  FOR contract_record IN 
    SELECT id, final_price, package_price, payment_method_id, created_at 
    FROM contratos 
    WHERE final_price > 0 OR package_price > 0
    LIMIT 5
  LOOP
    payment_amount := COALESCE(contract_record.final_price, contract_record.package_price, 0);
    installments := CASE 
      WHEN payment_amount > 5000 THEN 3
      WHEN payment_amount > 2000 THEN 2
      ELSE 1
    END;
    
    -- Criar parcelas
    FOR i IN 1..installments LOOP
      INSERT INTO payments (
        contract_id,
        amount,
        due_date,
        status,
        description,
        payment_method
      ) VALUES (
        contract_record.id,
        payment_amount / installments,
        contract_record.created_at::date + (i * 30),
        CASE 
          WHEN i = 1 AND random() > 0.5 THEN 'paid'::payment_status
          WHEN random() > 0.7 THEN 'overdue'::payment_status
          ELSE 'pending'::payment_status
        END,
        'Parcela ' || i || '/' || installments,
        'transferencia'
      );
    END LOOP;
  END LOOP;
END $$;