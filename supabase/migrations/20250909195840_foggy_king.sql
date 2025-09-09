/*
  # Update package foreign key constraint to use CASCADE delete

  1. Changes
    - Drop existing foreign key constraint contratos_package_id_fkey
    - Recreate with ON DELETE SET NULL behavior (safer than CASCADE)
    - This will set package_id to NULL when a package is deleted instead of deleting the entire contract

  2. Security
    - Preserves contract data when packages are deleted
    - Sets package_id to NULL instead of deleting contracts
*/

-- Drop the existing foreign key constraint
ALTER TABLE contratos 
DROP CONSTRAINT IF EXISTS contratos_package_id_fkey;

-- Recreate the foreign key constraint with ON DELETE SET NULL
-- This is safer than CASCADE as it preserves the contract but removes the package reference
ALTER TABLE contratos 
ADD CONSTRAINT contratos_package_id_fkey 
FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL;

-- Update any existing NULL package_price values to 0 for consistency
UPDATE contratos 
SET package_price = 0 
WHERE package_id IS NULL AND package_price IS NULL;