/*
  # Fix RLS policies for package_payment_methods table

  1. Security Changes
    - Drop existing restrictive policies
    - Add permissive policies for authenticated users
    - Allow public read access for contract forms
    - Enable proper CRUD operations

  2. Policy Details
    - INSERT: Allow authenticated users to create associations
    - SELECT: Allow public read access for displaying payment options
    - UPDATE: Allow authenticated users to modify associations  
    - DELETE: Allow authenticated users to remove associations
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "package_payment_methods_insert_policy" ON package_payment_methods;
DROP POLICY IF EXISTS "package_payment_methods_select_policy" ON package_payment_methods;
DROP POLICY IF EXISTS "package_payment_methods_update_policy" ON package_payment_methods;
DROP POLICY IF EXISTS "package_payment_methods_delete_policy" ON package_payment_methods;

-- Create new permissive policies
CREATE POLICY "Allow authenticated users to insert package payment methods"
  ON package_payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read access to package payment methods"
  ON package_payment_methods
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to update package payment methods"
  ON package_payment_methods
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete package payment methods"
  ON package_payment_methods
  FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anonymous users to insert for system operations
CREATE POLICY "Allow anonymous users to insert package payment methods"
  ON package_payment_methods
  FOR INSERT
  TO anon
  WITH CHECK (true);