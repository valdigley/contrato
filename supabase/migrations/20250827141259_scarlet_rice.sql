/*
  # Adicionar coluna status à tabela contratos

  1. Alterações
    - Adiciona coluna `status` à tabela `contratos`
    - Tipo: text com valores permitidos ('draft', 'sent', 'signed')
    - Valor padrão: 'draft'
    - Adiciona constraint para validar valores permitidos
    - Adiciona índice para melhor performance nas consultas por status

  2. Segurança
    - Operação segura que não remove dados existentes
    - Todos os contratos existentes receberão status 'draft' automaticamente
*/

-- Adicionar coluna status à tabela contratos
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';

-- Adicionar constraint para validar valores permitidos
ALTER TABLE contratos 
ADD CONSTRAINT IF NOT EXISTS contratos_status_check 
CHECK (status IN ('draft', 'sent', 'signed'));

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);

-- Atualizar contratos existentes que possam ter status NULL
UPDATE contratos 
SET status = 'draft' 
WHERE status IS NULL;