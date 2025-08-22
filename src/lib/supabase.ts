import { createClient } from '@supabase/supabase-js';

// Priorizar credenciais do localStorage (configurações do sistema)
const getSupabaseUrl = () => {
  return localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
};

const getSupabaseAnonKey = () => {
  return localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
