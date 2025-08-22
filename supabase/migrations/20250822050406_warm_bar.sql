/*
  # Fix RLS policies for package_payment_methods table

  1. Security Updates
    - Add INSERT policy for authenticated users
    - Add DELETE policy for authenticated users  
    - Ensure SELECT policy exists for public access
    - Add UPDATE policy for authenticated users

  2. Changes
    - Allow authenticated users to manage package payment method associations
    - Maintain public read access for the contract form
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage package payment methods" ON package_payment_methods;
DROP POLICY IF EXISTS "Public can read package payment methods" ON package_payment_methods;
DROP POLICY IF EXISTS "package_payment_methods_insert_policy" ON package_payment_methods;
DROP POLICY IF EXISTS "package_payment_methods_delete_policy" ON package_payment_methods;
DROP POLICY IF EXISTS "package_payment_methods_update_policy" ON package_payment_methods;

-- Create comprehensive RLS policies for package_payment_methods
CREATE POLICY "package_payment_methods_select_policy"
  ON package_payment_methods
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "package_payment_methods_insert_policy"
  ON package_payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "package_payment_methods_update_policy"
  ON package_payment_methods
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "package_payment_methods_delete_policy"
  ON package_payment_methods
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE package_payment_methods ENABLE ROW LEVEL SECURITY;