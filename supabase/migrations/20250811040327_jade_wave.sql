/*
  # Criar tabela de contratos

  1. Nova Tabela
    - `contratos`
      - `id` (uuid, chave primária)
      - `nome_completo` (text, não nulo)
      - `cpf` (text, não nulo)
      - `endereco` (text, não nulo)
      - `cidade` (text, não nulo)
      - `data_nascimento` (date, não nulo)
      - `tipo_evento` (text, não nulo)
      - `created_at` (timestamptz, padrão agora)
      - `updated_at` (timestamptz, padrão agora)

  2. Segurança
    - Habilitar RLS na tabela `contratos`
    - Adicionar política para usuários autenticados lerem e criarem contratos
*/

CREATE TABLE IF NOT EXISTS contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text NOT NULL,
  endereco text NOT NULL,
  cidade text NOT NULL,
  data_nascimento date NOT NULL,
  tipo_evento text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção para todos (pode ser ajustada conforme necessário)
CREATE POLICY "Permitir inserção de contratos"
  ON contratos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler contratos"
  ON contratos
  FOR SELECT
  TO authenticated
  USING (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contratos_cpf ON contratos(cpf);
CREATE INDEX IF NOT EXISTS idx_contratos_tipo_evento ON contratos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_contratos_created_at ON contratos(created_at);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar automaticamente o updated_at
CREATE TRIGGER update_contratos_updated_at 
  BEFORE UPDATE ON contratos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();