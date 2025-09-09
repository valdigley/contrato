import { createClient } from '@supabase/supabase-js';

// Configuração do novo projeto Supabase
const supabaseUrl = 'https://bdzvqewxciiozkppwsyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkenZxZXd4Y2lpb3prcHB3c3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDAxMjcsImV4cCI6MjA3MjI3NjEyN30.jxW6hUABrXTVGNPBB38IO4EyxSPLD6FTYqwbKGnqfYw';

console.log('Inicializando cliente Supabase com novo projeto...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabase };
