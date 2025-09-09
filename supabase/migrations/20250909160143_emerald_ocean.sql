/*
  # Create photographers table

  1. New Tables
    - `photographers`
      - `user_id` (uuid, primary key, references auth.users)
      - `business_name` (text, business/company name)
      - `phone` (text, phone/WhatsApp number)
      - `settings` (jsonb, photographer settings)
      - `created_at` (timestamp, creation date)

  2. Security
    - Enable RLS on `photographers` table
    - Add policy for public read access
    - Add policy for authenticated users to insert their own data
    - Add policy for authenticated users to update their own data
    - Add policy for authenticated users to delete their own data
*/

CREATE TABLE IF NOT EXISTS public.photographers (
    user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    business_name text,
    phone text,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.photographers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.photographers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.photographers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users" ON public.photographers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users" ON public.photographers
  FOR DELETE USING (auth.uid() = user_id);