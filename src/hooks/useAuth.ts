import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      try {
        console.log('Verificando sessão atual...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setError(error.message);
        } else {
          console.log('Sessão verificada:', session?.user?.email || 'Nenhum usuário logado');
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        console.error('Erro inesperado ao verificar sessão:', err);
        setError('Erro ao verificar autenticação');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Mudança de autenticação:', event, session?.user?.email || 'Nenhum usuário');
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
        setError(error.message);
      } else {
        console.log('Logout realizado com sucesso');
        setError(null);
      }
    } catch (err) {
      console.error('Erro inesperado no logout:', err);
      setError('Erro ao fazer logout');
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    isAuthenticated: !!user
  };
}