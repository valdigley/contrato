/*
  # Fix event_types RLS policies for INSERT operations

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Add new permissive INSERT policy for authenticated users
    - Ensure authenticated users can create event types in SystemSettings

  2. Policy Updates
    - INSERT: Allow authenticated users to create event types
    - Maintains existing SELECT, UPDATE, DELETE policies
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "event_types_insert_policy" ON event_types;

-- Create a new permissive insert policy for authenticated users
CREATE POLICY "event_types_insert_policy" 
  ON event_types 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Ensure the table has RLS enabled
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;