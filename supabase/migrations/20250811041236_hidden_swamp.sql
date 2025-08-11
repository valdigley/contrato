/*
  # Adicionar campos de detalhes do evento

  1. Modificações na Tabela
    - `contratos`
      - `local_pre_wedding` (text, opcional)
      - `local_making_of` (text, opcional)
      - `local_cerimonia` (text, opcional)
      - `local_festa` (text, não nulo)
      - `nome_noivos` (text, opcional - para casamentos)
      - `nome_aniversariante` (text, opcional - para aniversários)

  2. Notas
    - Campos opcionais dependem do tipo de evento
    - local_festa é obrigatório para todos os tipos de evento
    - nome_noivos é usado apenas para casamentos
    - nome_aniversariante é usado para aniversários
*/

-- Adicionar novos campos à tabela contratos
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS local_pre_wedding text,
ADD COLUMN IF NOT EXISTS local_making_of text,
ADD COLUMN IF NOT EXISTS local_cerimonia text,
ADD COLUMN IF NOT EXISTS local_festa text,
ADD COLUMN IF NOT EXISTS nome_noivos text,
ADD COLUMN IF NOT EXISTS nome_aniversariante text;

-- Atualizar registros existentes para ter local_festa não nulo (valor padrão temporário)
UPDATE contratos 
SET local_festa = 'A definir' 
WHERE local_festa IS NULL;

-- Tornar local_festa obrigatório após atualizar registros existentes
ALTER TABLE contratos 
ALTER COLUMN local_festa SET NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_local_festa ON contratos(local_festa);
CREATE INDEX IF NOT EXISTS idx_contratos_nome_noivos ON contratos(nome_noivos);
CREATE INDEX IF NOT EXISTS idx_contratos_nome_aniversariante ON contratos(nome_aniversariante);