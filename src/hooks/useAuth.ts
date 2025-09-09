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
          // Se o token de refresh é inválido, limpar a sessão
          if (error.message.includes('Refresh Token Not Found') || 
              error.message.includes('Invalid Refresh Token')) {
            console.log('Token de refresh inválido, limpando sessão...');
            await supabase.auth.signOut();
            setUser(null);
            setError(null);
          } else {
            console.error('Erro ao verificar sessão:', error);
            setError(error.message);
          }
        } else {
          console.log('Sessão verificada:', session?.user?.email || 'Nenhum usuário logado');
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        // Verificar se é erro de token inválido
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Refresh Token Not Found') || 
            errorMessage.includes('Invalid Refresh Token')) {
          console.log('Token de refresh inválido detectado, limpando sessão...');
          await supabase.auth.signOut();
          setUser(null);
          setError(null);
        } else {
          console.error('Erro inesperado ao verificar sessão:', err);
          setError('Erro ao verificar autenticação');
        }
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