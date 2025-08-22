/*
  # Fix RLS policies for contratos table

  1. Security Updates
    - Add policy for anon users to insert contracts
    - Add policy for anon users to read contracts
    - Ensure authenticated users can manage contracts
  
  2. Changes
    - Allow anon role to INSERT contracts (for client form)
    - Allow anon role to SELECT contracts (for listing)
    - Maintain existing authenticated policies
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Permitir inserção de contratos" ON contratos;
DROP POLICY IF EXISTS "Usuários autenticados podem ler contratos" ON contratos;

-- Allow anon users to insert contracts (for client form submissions)
CREATE POLICY "Allow anon insert contracts"
  ON contratos
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users to read contracts (for listing and management)
CREATE POLICY "Allow anon read contracts"
  ON contratos
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users full access to contracts
CREATE POLICY "Allow authenticated full access to contracts"
  ON contratos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anon users to update contracts if needed
CREATE POLICY "Allow anon update contracts"
  ON contratos
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users to delete contracts if needed
CREATE POLICY "Allow anon delete contracts"
  ON contratos
  FOR DELETE
  TO anon
  USING (true);