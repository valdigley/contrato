import { createClient } from '@supabase/supabase-js';

// Priorizar credenciais do localStorage (configurações do sistema)
const getSupabaseUrl = () => {
  const url = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
  console.log('Supabase URL:', url ? 'Configurado' : 'Não configurado');
  return url;
};

const getSupabaseAnonKey = () => {
  const key = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.log('Supabase Key:', key ? 'Configurado' : 'Não configurado');
  return key;
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não encontradas!');
  throw new Error('Missing Supabase environment variables');
}

console.log('Inicializando cliente Supabase...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
