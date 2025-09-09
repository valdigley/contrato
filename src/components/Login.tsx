import React, { useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff, LogIn, UserPlus, Building2, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setDebugInfo('');

    try {
      setDebugInfo('Iniciando processo de autenticação...');
      
      if (isLogin) {
        // Login
        setDebugInfo('Tentando fazer login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setDebugInfo('Login realizado com sucesso!');
          setSuccess('Login realizado com sucesso!');
          setTimeout(() => {
            onLogin();
          }, 1000);
        }
      } else {
        // Cadastro
        setDebugInfo('Tentando criar conta...');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            }
          }
        });

        if (error) throw error;
        setDebugInfo('Conta criada no Supabase Auth, criando perfil...');

        if (data.user) {
          // Inserir dados na tabela users e photographers
          setDebugInfo('Inserindo dados na tabela users...');
          
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .insert([
                {
                  id: data.user.id,
                  email: data.user.email,
                  name: name,
                  role: 'photographer'
                }
              ])
              .select()
              .single();

            if (userError) {
              if (userError.code === 'PGRST205') {
                console.info('Tabela users não encontrada, continuando sem perfil de usuário');
                setDebugInfo('Tabela users não encontrada, continuando...');
              } else {
                console.info('Continuando sem perfil de usuário:', userError.message);
                setDebugInfo('Continuando sem perfil de usuário...');
              }
            }
          } catch (error) {
            console.info('Continuando sem perfil de usuário:', error);
            setDebugInfo('Continuando sem perfil de usuário...');
          }

          setDebugInfo('Usuário criado, criando perfil de fotógrafo...');
          
          try {
            const { error: photographerError } = await supabase
              .from('photographers')
              .insert([
                {
                  user_id: data.user.id,
                  business_name: businessName,
                  phone: phone,
                  settings: {}
                }
              ]);

            if (photographerError) {
              if (photographerError.code === 'PGRST205') {
                console.info('Tabela photographers não encontrada, continuando sem perfil de fotógrafo');
                setDebugInfo('Tabela photographers não encontrada, continuando...');
              } else {
                console.info('Continuando sem perfil de fotógrafo:', photographerError.message);
                setDebugInfo('Continuando sem perfil de fotógrafo...');
              }
            }
          } catch (error) {
            console.info('Continuando sem perfil de fotógrafo:', error);
            setDebugInfo('Continuando sem perfil de fotógrafo...');
          }

          setDebugInfo('Cadastro concluído com sucesso!');
          setSuccess('Conta criada com sucesso! Você pode fazer login agora.');
          setIsLogin(true);
          // Clear form
          setTimeout(() => {
            setEmail('');
            setPassword('');
            setName('');
            setBusinessName('');
            setPhone('');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      setDebugInfo(`Erro: ${error.message}`);
      setError(error.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
          >
            {theme === 'light' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isLogin 
              ? 'Acesse sua conta para gerenciar contratos' 
              : 'Crie sua conta para começar a usar o sistema'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-300 text-sm">
            <CheckCircle className="inline w-4 h-4 mr-2" />
            {success}
          </div>
        )}

        {debugInfo && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-blue-700 dark:text-blue-300 text-sm">
            <div className="flex items-start">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2 mt-0.5"></div>
              <span>{debugInfo}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite seu nome completo"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Negócio/Empresa
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: João Silva Fotografia"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone/WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="(11) 99999-9999"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite seu e-mail"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite sua senha"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {!isLogin && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A senha deve ter pelo menos 6 caracteres
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setEmail('');
              setPassword('');
              setName('');
              setBusinessName('');
              setPhone('');
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            {isLogin 
              ? 'Não tem uma conta? Criar conta' 
              : 'Já tem uma conta? Fazer login'
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Esqueceu sua senha? Entre em contato com o suporte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}