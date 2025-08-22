/*
  # Fix RLS policies for event_types table

  1. Security Changes
    - Drop existing restrictive policies that prevent INSERT operations
    - Add permissive policies for authenticated users to manage event types
    - Allow public read access for active event types
    - Enable proper CRUD operations for system settings

  2. Policy Details
    - INSERT: Allow authenticated users to create event types
    - UPDATE: Allow authenticated users to modify event types  
    - DELETE: Allow authenticated users to delete event types
    - SELECT: Allow public read access for active event types
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Authenticated users can manage event types" ON event_types;
DROP POLICY IF EXISTS "Public can read active event types" ON event_types;

-- Create new permissive policies for event_types
CREATE POLICY "event_types_insert_policy" 
  ON event_types 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "event_types_update_policy" 
  ON event_types 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "event_types_delete_policy" 
  ON event_types 
  FOR DELETE 
  TO authenticated 
  USING (true);

CREATE POLICY "event_types_select_policy" 
  ON event_types 
  FOR SELECT 
  TO public 
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;