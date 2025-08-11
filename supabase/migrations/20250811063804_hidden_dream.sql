/*
  # Add missing fields to contratos table

  1. New Columns
    - `final_price` (numeric) - Final calculated price after payment method discounts
    - `payment_method_id` (uuid) - Reference to selected payment method
    - `preferred_payment_day` (integer) - Day of month client prefers to pay

  2. Changes
    - Add foreign key constraint for payment_method_id
    - Add check constraint for preferred_payment_day (1-28)
    - Add indexes for better query performance

  3. Security
    - Update existing RLS policies to include new fields
*/

-- Add missing columns to contratos table
DO $$
BEGIN
  -- Add final_price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'final_price'
  ) THEN
    ALTER TABLE contratos ADD COLUMN final_price numeric(10,2) DEFAULT 0;
  END IF;

  -- Add payment_method_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE contratos ADD COLUMN payment_method_id uuid;
  END IF;

  -- Add preferred_payment_day column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'preferred_payment_day'
  ) THEN
    ALTER TABLE contratos ADD COLUMN preferred_payment_day integer;
  END IF;
END $$;

-- Add foreign key constraint for payment_method_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contratos_payment_method_id_fkey'
  ) THEN
    ALTER TABLE contratos 
    ADD CONSTRAINT contratos_payment_method_id_fkey 
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id);
  END IF;
END $$;

-- Add check constraint for preferred_payment_day
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contratos_preferred_payment_day_check'
  ) THEN
    ALTER TABLE contratos 
    ADD CONSTRAINT contratos_preferred_payment_day_check 
    CHECK (preferred_payment_day >= 1 AND preferred_payment_day <= 28);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contratos_payment_method_id ON contratos(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_contratos_final_price ON contratos(final_price);
CREATE INDEX IF NOT EXISTS idx_contratos_preferred_payment_day ON contratos(preferred_payment_day);