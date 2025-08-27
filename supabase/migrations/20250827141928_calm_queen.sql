/*
  # Adicionar coluna status à tabela contratos

  1. Nova Coluna
    - `status` (text) - Status do contrato: 'draft', 'sent', 'signed', 'cancelled'
    - Valor padrão: 'draft'
    - Constraint para validar valores permitidos

  2. Índices
    - Índice na coluna status para melhor performance

  3. Dados Existentes
    - Todos os contratos existentes receberão status 'draft'
*/

-- Adicionar coluna status
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Adicionar constraint para validar valores
ALTER TABLE contratos 
ADD CONSTRAINT contratos_status_check 
CHECK (status IN ('draft', 'sent', 'signed', 'cancelled'));

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_status 
ON contratos(status);

-- Atualizar contratos existentes para status 'draft'
UPDATE contratos 
SET status = 'draft' 
WHERE status IS NULL;