/*
  # Adicionar campos de data e horário do evento

  1. Alterações na tabela contratos
    - Adicionar campo `data_evento` (date)
    - Adicionar campo `horario_evento` (time)
    - Adicionar índices para consultas por data

  2. Segurança
    - Manter as políticas RLS existentes
*/

-- Adicionar campos de data e horário do evento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'data_evento'
  ) THEN
    ALTER TABLE contratos ADD COLUMN data_evento date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'horario_evento'
  ) THEN
    ALTER TABLE contratos ADD COLUMN horario_evento time;
  END IF;
END $$;

-- Adicionar índices para melhor performance nas consultas por data
CREATE INDEX IF NOT EXISTS idx_contratos_data_evento ON contratos(data_evento);
CREATE INDEX IF NOT EXISTS idx_contratos_data_evento_horario ON contratos(data_evento, horario_evento);