/*
  # Adicionar campos email e whatsapp à tabela contratos

  1. Alterações na tabela
    - Adicionar coluna `email` (text, obrigatório)
    - Adicionar coluna `whatsapp` (text, obrigatório)
    - Adicionar índices para melhor performance
  
  2. Validações
    - Email deve ter formato válido
    - WhatsApp deve ter apenas números (11 dígitos)
*/

-- Adicionar colunas email e whatsapp
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS whatsapp text;

-- Tornar os campos obrigatórios (após adicionar, para não quebrar dados existentes)
DO $$
BEGIN
  -- Primeiro, atualizar registros existentes com valores padrão se necessário
  UPDATE contratos 
  SET email = 'email@exemplo.com' 
  WHERE email IS NULL OR email = '';
  
  UPDATE contratos 
  SET whatsapp = '11999999999' 
  WHERE whatsapp IS NULL OR whatsapp = '';
  
  -- Agora tornar os campos obrigatórios
  ALTER TABLE contratos ALTER COLUMN email SET NOT NULL;
  ALTER TABLE contratos ALTER COLUMN whatsapp SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao tornar campos obrigatórios: %', SQLERRM;
END $$;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_email ON contratos(email);
CREATE INDEX IF NOT EXISTS idx_contratos_whatsapp ON contratos(whatsapp);

-- Adicionar constraint para validar formato do email
DO $$
BEGIN
  ALTER TABLE contratos 
  ADD CONSTRAINT contratos_email_format_check 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint de email já existe';
END $$;

-- Adicionar constraint para validar WhatsApp (apenas números, 10 ou 11 dígitos)
DO $$
BEGIN
  ALTER TABLE contratos 
  ADD CONSTRAINT contratos_whatsapp_format_check 
  CHECK (whatsapp ~ '^[0-9]{10,11}$');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint de WhatsApp já existe';
END $$;