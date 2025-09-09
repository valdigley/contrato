/*
  # Remove photographer references from contratos table

  This migration removes any references to the photographers table since we're no longer using it.
  All photographer data is now stored directly in the users table.

  1. Changes
    - Remove photographer_id column if it exists
    - Remove any foreign key constraints to photographers table
    - Remove any indexes related to photographer_id

  2. Security
    - No changes to RLS policies needed
*/

-- Remove foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contratos_photographer_id_fkey'
  ) THEN
    ALTER TABLE contratos DROP CONSTRAINT contratos_photographer_id_fkey;
  END IF;
END $$;

-- Remove index if it exists
DROP INDEX IF EXISTS idx_contratos_photographer_id;

-- Remove photographer_id column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'photographer_id'
  ) THEN
    ALTER TABLE contratos DROP COLUMN photographer_id;
  END IF;
END $$;