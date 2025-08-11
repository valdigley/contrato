/*
  # Create contract templates system

  1. New Tables
    - `contract_templates`
      - `id` (uuid, primary key)
      - `event_type_id` (uuid, foreign key to event_types)
      - `name` (text)
      - `content` (text, template content with placeholders)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `contract_templates` table
    - Add policies for authenticated users to manage templates
    - Add policies for public to read active templates

  3. Initial Data
    - Create default templates for each event type
*/

CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contract templates"
  ON contract_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read active contract templates"
  ON contract_templates
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_contract_templates_event_type_id ON contract_templates(event_type_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);

CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates for existing event types
DO $$
DECLARE
  casamento_id uuid;
  aniversario_id uuid;
  ensaio_id uuid;
  formatura_id uuid;
BEGIN
  -- Get event type IDs
  SELECT id INTO casamento_id FROM event_types WHERE name = 'Casamento' LIMIT 1;
  SELECT id INTO aniversario_id FROM event_types WHERE name = 'Aniversário' LIMIT 1;
  SELECT id INTO ensaio_id FROM event_types WHERE name = 'Ensaio Fotográfico' LIMIT 1;
  SELECT id INTO formatura_id FROM event_types WHERE name = 'Formatura' LIMIT 1;

  -- Insert default templates
  IF casamento_id IS NOT NULL THEN
    INSERT INTO contract_templates (event_type_id, name, content) VALUES
    (casamento_id, 'Contrato de Casamento Padrão', 
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - CASAMENTO

CONTRATANTE: {{nome_completo}}
CPF: {{cpf}}
ENDEREÇO: {{endereco}}, {{cidade}}
DATA DE NASCIMENTO: {{data_nascimento}}

NOIVOS: {{nome_noivos}}

DETALHES DO EVENTO:
- Tipo: {{tipo_evento}}
- Pacote: {{package_name}}
- Valor: R$ {{package_price}}

LOCAIS:
{{#local_pre_wedding}}- Pré-Wedding: {{local_pre_wedding}}{{/local_pre_wedding}}
{{#local_making_of}}- Making Of: {{local_making_of}}{{/local_making_of}}
{{#local_cerimonia}}- Cerimônia: {{local_cerimonia}}{{/local_cerimonia}}
- Festa: {{local_festa}}

CARACTERÍSTICAS DO PACOTE:
{{#package_features}}
- {{.}}
{{/package_features}}

CLÁUSULAS:
1. O presente contrato tem por objeto a prestação de serviços fotográficos para o evento de casamento.
2. O valor total do serviço é de R$ {{package_price}}.
3. O pagamento será realizado conforme acordado entre as partes.
4. O fotógrafo se compromete a entregar as fotos editadas em até 30 dias após o evento.

Data: ___/___/______

_________________________        _________________________
    Contratante                      Fotógrafo');
  END IF;

  IF aniversario_id IS NOT NULL THEN
    INSERT INTO contract_templates (event_type_id, name, content) VALUES
    (aniversario_id, 'Contrato de Aniversário Padrão',
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - ANIVERSÁRIO

CONTRATANTE: {{nome_completo}}
CPF: {{cpf}}
ENDEREÇO: {{endereco}}, {{cidade}}
DATA DE NASCIMENTO: {{data_nascimento}}

ANIVERSARIANTE: {{nome_aniversariante}}

DETALHES DO EVENTO:
- Tipo: {{tipo_evento}}
- Pacote: {{package_name}}
- Valor: R$ {{package_price}}
- Local: {{local_festa}}

CARACTERÍSTICAS DO PACOTE:
{{#package_features}}
- {{.}}
{{/package_features}}

CLÁUSULAS:
1. O presente contrato tem por objeto a prestação de serviços fotográficos para festa de aniversário.
2. O valor total do serviço é de R$ {{package_price}}.
3. O pagamento será realizado conforme acordado entre as partes.
4. O fotógrafo se compromete a entregar as fotos editadas em até 15 dias após o evento.

Data: ___/___/______

_________________________        _________________________
    Contratante                      Fotógrafo');
  END IF;

  IF ensaio_id IS NOT NULL THEN
    INSERT INTO contract_templates (event_type_id, name, content) VALUES
    (ensaio_id, 'Contrato de Ensaio Fotográfico Padrão',
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - ENSAIO

CONTRATANTE: {{nome_completo}}
CPF: {{cpf}}
ENDEREÇO: {{endereco}}, {{cidade}}
DATA DE NASCIMENTO: {{data_nascimento}}

DETALHES DO EVENTO:
- Tipo: {{tipo_evento}}
- Pacote: {{package_name}}
- Valor: R$ {{package_price}}
- Local: {{local_festa}}

CARACTERÍSTICAS DO PACOTE:
{{#package_features}}
- {{.}}
{{/package_features}}

CLÁUSULAS:
1. O presente contrato tem por objeto a prestação de serviços de ensaio fotográfico.
2. O valor total do serviço é de R$ {{package_price}}.
3. O pagamento será realizado conforme acordado entre as partes.
4. O fotógrafo se compromete a entregar as fotos editadas em até 7 dias após o ensaio.

Data: ___/___/______

_________________________        _________________________
    Contratante                      Fotógrafo');
  END IF;

  IF formatura_id IS NOT NULL THEN
    INSERT INTO contract_templates (event_type_id, name, content) VALUES
    (formatura_id, 'Contrato de Formatura Padrão',
    'CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS - FORMATURA

CONTRATANTE: {{nome_completo}}
CPF: {{cpf}}
ENDEREÇO: {{endereco}}, {{cidade}}
DATA DE NASCIMENTO: {{data_nascimento}}

DETALHES DO EVENTO:
- Tipo: {{tipo_evento}}
- Pacote: {{package_name}}
- Valor: R$ {{package_price}}
- Local: {{local_festa}}

CARACTERÍSTICAS DO PACOTE:
{{#package_features}}
- {{.}}
{{/package_features}}

CLÁUSULAS:
1. O presente contrato tem por objeto a prestação de serviços fotográficos para formatura.
2. O valor total do serviço é de R$ {{package_price}}.
3. O pagamento será realizado conforme acordado entre as partes.
4. O fotógrafo se compromete a entregar as fotos editadas em até 20 dias após o evento.

Data: ___/___/______

_________________________        _________________________
    Contratante                      Fotógrafo');
  END IF;
END $$;