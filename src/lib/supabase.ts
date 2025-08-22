import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== CONFIGURAÇÃO SUPABASE ===');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);
console.log('Key length:', supabaseAnonKey?.length || 0);
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Variáveis de ambiente do Supabase não encontradas!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

console.log('Criando cliente Supabase...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Cliente Supabase criado com sucesso!');