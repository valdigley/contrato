/*
  # Sistema de Configurações - Tipos de Eventos e Pacotes

  1. New Tables
    - `event_types`
      - `id` (uuid, primary key)
      - `name` (text, nome do tipo de evento)
      - `is_active` (boolean, se está ativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `packages`
      - `id` (uuid, primary key)
      - `event_type_id` (uuid, foreign key)
      - `name` (text, nome do pacote)
      - `description` (text, descrição do pacote)
      - `price` (numeric, valor do pacote)
      - `features` (jsonb, características do pacote)
      - `is_active` (boolean, se está ativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage configurations
    - Add policies for public read access to active items

  3. Initial Data
    - Insert default event types and packages
*/

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Policies for event_types
CREATE POLICY "Public can read active event types"
  ON event_types
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage event types"
  ON event_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for packages
CREATE POLICY "Public can read active packages"
  ON packages
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_types_active ON event_types(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_event_type_id ON packages(event_type_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_event_types_updated_at'
  ) THEN
    CREATE TRIGGER update_event_types_updated_at
      BEFORE UPDATE ON event_types
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_packages_updated_at'
  ) THEN
    CREATE TRIGGER update_packages_updated_at
      BEFORE UPDATE ON packages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default event types
INSERT INTO event_types (name) VALUES
  ('Casamento'),
  ('Aniversário de 15 Anos'),
  ('Aniversário Infantil'),
  ('Formatura'),
  ('Ensaio Fotográfico')
ON CONFLICT DO NOTHING;

-- Insert default packages
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

  -- Insert packages for Casamento
  INSERT INTO packages (event_type_id, name, description, price, features) VALUES
    (casamento_id, 'Pacote Básico', 'Cobertura essencial do seu casamento', 2500.00, '["Cerimônia e festa", "200 fotos editadas", "Álbum digital"]'::jsonb),
    (casamento_id, 'Pacote Completo', 'Cobertura completa com pré-wedding', 4500.00, '["Pré-wedding", "Making of", "Cerimônia e festa", "400 fotos editadas", "Álbum físico + digital"]'::jsonb),
    (casamento_id, 'Pacote Premium', 'Experiência completa de luxo', 7000.00, '["Pré-wedding", "Making of", "Cerimônia e festa", "600+ fotos editadas", "Álbum premium", "Vídeo highlights"]'::jsonb);

  -- Insert packages for Aniversário de 15 Anos
  INSERT INTO packages (event_type_id, name, description, price, features) VALUES
    (aniversario_15_id, 'Pacote Essencial', 'Cobertura da festa de 15 anos', 1800.00, '["Festa completa", "150 fotos editadas", "Álbum digital"]'::jsonb),
    (aniversario_15_id, 'Pacote Completo', 'Festa + ensaio de debutante', 3200.00, '["Ensaio pré-festa", "Festa completa", "250 fotos editadas", "Álbum físico + digital"]'::jsonb);

  -- Insert packages for Aniversário Infantil
  INSERT INTO packages (event_type_id, name, description, price, features) VALUES
    (aniversario_infantil_id, 'Pacote Básico', 'Cobertura da festa infantil', 800.00, '["2 horas de festa", "80 fotos editadas", "Galeria online"]'::jsonb),
    (aniversario_infantil_id, 'Pacote Completo', 'Festa completa com smash cake', 1400.00, '["Smash cake", "Festa completa", "150 fotos editadas", "Álbum digital"]'::jsonb);

  -- Insert packages for Formatura
  INSERT INTO packages (event_type_id, name, description, price, features) VALUES
    (formatura_id, 'Pacote Individual', 'Sessão individual de formatura', 600.00, '["Sessão de 1 hora", "30 fotos editadas", "Galeria digital"]'::jsonb),
    (formatura_id, 'Pacote Turma', 'Cobertura da cerimônia + individual', 1200.00, '["Cerimônia completa", "Sessão individual", "100 fotos editadas", "Álbum digital"]'::jsonb);

  -- Insert packages for Ensaio Fotográfico
  INSERT INTO packages (event_type_id, name, description, price, features) VALUES
    (ensaio_id, 'Ensaio Simples', 'Sessão fotográfica básica', 400.00, '["1 hora de sessão", "20 fotos editadas", "Galeria online"]'::jsonb),
    (ensaio_id, 'Ensaio Completo', 'Sessão fotográfica completa', 800.00, '["2 horas de sessão", "50 fotos editadas", "2 looks", "Álbum digital"]'::jsonb),
    (ensaio_id, 'Ensaio Premium', 'Experiência fotográfica de luxo', 1500.00, '["3 horas de sessão", "80+ fotos editadas", "3 looks", "Álbum premium", "Maquiagem inclusa"]'::jsonb);
END $$;