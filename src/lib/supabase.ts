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
  const url = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || 'https://bdzvqewxciiozkppwsyk.supabase.co';
  console.log('Supabase URL:', url ? 'Configurado' : 'Não configurado');
  return isValidUrl(url) ? url : '';
};

const getSupabaseAnonKey = () => {
  const key = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkenZxZXd4Y2lpb3prcHB3c3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDAxMjcsImV4cCI6MjA3MjI3NjEyN30.jxW6hUABrXTVGNPBB38IO4EyxSPLD6FTYqwbKGnqfYw';
  console.log('Supabase Key:', key ? 'Configurado' : 'Não configurado');
  return key && key.length > 20 ? key : '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('Credenciais do Supabase não encontradas!');
  // Create a dummy client to prevent initialization errors
  supabase = createClient('https://dummy.supabase.co', 'dummy-key');
} else {
  console.log('Inicializando cliente Supabase...');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
