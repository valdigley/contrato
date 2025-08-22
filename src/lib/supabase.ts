import { createClient } from '@supabase/supabase-js';

// Function to validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('https://') && url.includes('.supabase.co');
  } catch {
    return false;
  }
};

// Priorizar credenciais do localStorage (configurações do sistema)
const getSupabaseUrl = () => {
  const url = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  console.log('Supabase URL:', url ? 'Configurado' : 'Não configurado');
  return isValidUrl(url) ? url : '';
};

const getSupabaseAnonKey = () => {
  const key = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  console.log('Supabase Key:', key ? 'Configurado' : 'Não configurado');
  return key && key.length > 20 ? key : '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Credenciais do Supabase não encontradas!');
  // Create a dummy client to prevent initialization errors
  export const supabase = createClient('https://dummy.supabase.co', 'dummy-key');
} else {
  console.log('Inicializando cliente Supabase...');
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}

