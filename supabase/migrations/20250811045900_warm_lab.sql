/*
  # Atualizar tabela contratos para incluir referências aos novos campos

  1. Changes
    - Add `event_type_id` column to reference event_types table
    - Add `package_id` column to reference packages table  
    - Add `package_price` column to store the price at time of contract
    - Add indexes for better performance

  2. Data Migration
    - Update existing records to match new event types where possible
*/

-- Add new columns to contratos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'event_type_id'
  ) THEN
    ALTER TABLE contratos ADD COLUMN event_type_id uuid REFERENCES event_types(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE contratos ADD COLUMN package_id uuid REFERENCES packages(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'package_price'
  ) THEN
    ALTER TABLE contratos ADD COLUMN package_price numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contratos_event_type_id ON contratos(event_type_id);
CREATE INDEX IF NOT EXISTS idx_contratos_package_id ON contratos(package_id);

-- Update existing records to match new event types where possible
DO $$
DECLARE
  casamento_id uuid;
  aniversario_15_id uuid;
  aniversario_infantil_id uuid;
  formatura_id uuid;
  ensaio_id uuid;
BEGIN
  -- Get event type IDs
  SELECT id INTO casamento_id FROM event_types WHERE name = 'Casamento';
  SELECT id INTO aniversario_15_id FROM event_types WHERE name = 'Aniversário de 15 Anos';
  SELECT id INTO aniversario_infantil_id FROM event_types WHERE name = 'Aniversário Infantil';
  SELECT id INTO formatura_id FROM event_types WHERE name = 'Formatura';
  SELECT id INTO ensaio_id FROM event_types WHERE name = 'Ensaio Fotográfico';

  -- Update existing contracts based on tipo_evento field
  UPDATE contratos SET event_type_id = casamento_id 
  WHERE tipo_evento = 'Casamento' OR tipo_evento = 'casamento';
  
  UPDATE contratos SET event_type_id = aniversario_15_id 
  WHERE tipo_evento = 'Aniversário de 15 Anos' OR tipo_evento = 'aniversario_15';
  
  UPDATE contratos SET event_type_id = aniversario_infantil_id 
  WHERE tipo_evento = 'Aniversário Infantil' OR tipo_evento = 'aniversario_infantil';
  
  UPDATE contratos SET event_type_id = formatura_id 
  WHERE tipo_evento = 'Formatura' OR tipo_evento = 'formatura';
  
  UPDATE contratos SET event_type_id = ensaio_id 
  WHERE tipo_evento = 'Ensaio Fotográfico' OR tipo_evento = 'ensaio_fotografico';
END $$;