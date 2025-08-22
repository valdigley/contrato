/*
  # Fix RLS policies for event_types table

  1. Security Changes
    - Drop existing restrictive INSERT policy
    - Add new INSERT policy allowing anon role operations
    - Maintain existing SELECT, UPDATE, DELETE policies for authenticated users

  2. Policy Details
    - INSERT: Allow anon role (using VITE_SUPABASE_ANON_KEY) to create event types
    - Resolves "new row violates row-level security policy" error
    - Enables SystemSettings component to function properly
*/

-- Drop the existing INSERT policy that's blocking anon operations
DROP POLICY IF EXISTS "event_types_insert_policy" ON event_types;

-- Create new INSERT policy that allows anon role operations
CREATE POLICY "event_types_anon_insert_policy"
  ON event_types
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also ensure authenticated users can still insert
CREATE POLICY "event_types_authenticated_insert_policy"
  ON event_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);