/*
  # Adicionar campos para edição de contratos

  1. Novas Colunas
    - `adjusted_price` (numeric) - Valor ajustado após desconto
    - `discount_percentage` (numeric) - Percentual de desconto aplicado
    - `custom_notes` (text) - Observações personalizadas do contrato

  2. Índices
    - Adicionar índices para melhor performance nas consultas

  3. Comentários
    - Documentar as novas colunas para facilitar manutenção
*/

-- Adicionar coluna para valor ajustado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'adjusted_price'
  ) THEN
    ALTER TABLE contratos ADD COLUMN adjusted_price numeric(10,2) DEFAULT NULL;
  END IF;
END $$;

-- Adicionar coluna para percentual de desconto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE contratos ADD COLUMN discount_percentage numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar coluna para observações personalizadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'custom_notes'
  ) THEN
    ALTER TABLE contratos ADD COLUMN custom_notes text DEFAULT NULL;
  END IF;
END $$;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_adjusted_price ON contratos(adjusted_price);
CREATE INDEX IF NOT EXISTS idx_contratos_discount_percentage ON contratos(discount_percentage);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN contratos.adjusted_price IS 'Valor final após aplicação de desconto';
COMMENT ON COLUMN contratos.discount_percentage IS 'Percentual de desconto aplicado (0-100)';
COMMENT ON COLUMN contratos.custom_notes IS 'Observações personalizadas que aparecem no contrato';