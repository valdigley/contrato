/*
  # Add photographer relationship to contratos table

  1. Changes
    - Add photographer_id column to contratos table if it doesn't exist
    - Add foreign key constraint to photographers table
    - Create index for better performance
    - Update existing records to have null photographer_id (will be populated by users)

  2. Security
    - No RLS changes needed as contratos table already has appropriate policies
*/

-- Add photographer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'photographer_id'
  ) THEN
    ALTER TABLE contratos ADD COLUMN photographer_id uuid;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contratos_photographer_id_fkey'
  ) THEN
    ALTER TABLE contratos 
    ADD CONSTRAINT contratos_photographer_id_fkey 
    FOREIGN KEY (photographer_id) REFERENCES photographers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contratos_photographer_id ON contratos(photographer_id);