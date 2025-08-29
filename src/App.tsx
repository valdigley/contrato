import React, { useState, useEffect } from 'react';
import { Database, Settings, AlertCircle, FileText, Users, BarChart3, User, LogOut, Camera, Home } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import Login from './components/Login';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import UserProfile from './components/UserProfile';
import SystemSettings from './components/SystemSettings';

type View = 'dashboard' | 'contracts' | 'new-contract' | 'profile' | 'settings';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Check Supabase configuration
  useEffect(() => {
    const checkSupabaseConfig = () => {
      try {
        const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const isConfigured = supabaseUrl && supabaseKey && 
                            supabaseUrl.includes('supabase.co') && 
                            supabaseKey.length > 20;
        
        console.log('Supabase configured:', isConfigured);
        setSupabaseConfigured(isConfigured);
      } catch (error) {
        console.error('Error checking Supabase config:', error);
        setSupabaseConfigured(false);
      } finally {
        setCheckingConfig(false);
      }
    };

    checkSupabaseConfig();
  }, []);

  // Loading state
  if (authLoading || checkingConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  // Supabase not configured - show config screen
  if (!supabaseConfigured) {
    return <SupabaseConfigScreen onConfigured={() => window.location.reload()} />;
  }

  // User not authenticated - show login
  if (!user) {
    return <Login onLogin={() => setCurrentView('dashboard')} />;
  }

  // Render based on current view
  if (currentView === 'new-contract') {
    return <ContractForm onBackToList={() => setCurrentView('contracts')} />;
  }

  if (currentView === 'contracts') {
    return <ContractList onNewContract={() => setCurrentView('new-contract')} onBackToDashboard={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'profile') {
    return <UserProfile onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'settings') {
    return <SystemSettings onBack={() => setCurrentView('dashboard')} />;
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciador de Contratos</h1>
                <p className="text-gray-600 dark:text-gray-300">Sistema completo para gestão de contratos fotográficos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
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
              
              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentView('profile')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Perfil</span>
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Contratos Card */}
          <div 
            onClick={() => setCurrentView('contracts')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer hover-lift"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contratos</h3>
                <p className="text-gray-600 dark:text-gray-300">Gerenciar contratos de eventos</p>
              </div>
            </div>
          </div>

          {/* Novo Contrato Card */}
          <div 
            onClick={() => setCurrentView('new-contract')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer hover-lift"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Novo Contrato</h3>
                <p className="text-gray-600 dark:text-gray-300">Criar novo contrato</p>
              </div>
            </div>
          </div>

          {/* Configurações Card */}
          <div 
            onClick={() => setCurrentView('settings')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all cursor-pointer hover-lift"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3">
                <Settings className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações</h3>
                <p className="text-gray-600 dark:text-gray-300">Configurar sistema</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setCurrentView('new-contract')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Novo Contrato</span>
            </button>
            
            <button
              onClick={() => setCurrentView('contracts')}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Users className="h-5 w-5" />
              <span>Ver Contratos</span>
            </button>
            
            <button
              onClick={() => setCurrentView('settings')}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </button>
            
            <button
              onClick={() => setCurrentView('profile')}
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <User className="h-5 w-5" />
              <span>Meu Perfil</span>
            </button>
          </div>
        </div>

        {/* Status Info */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">Sistema conectado ao Supabase</p>
              <p className="text-blue-600 dark:text-blue-300 text-sm">Todas as funcionalidades estão disponíveis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Supabase Config Component
function SupabaseConfigScreen({ onConfigured }: { onConfigured: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [config, setConfig] = useState({
    url: '',
    anonKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!config.url || !config.anonKey) {
      setMessage('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setMessage('Testando conexão...');

    try {
      // Test connection
      const response = await fetch(`${config.url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Conexão falhou: HTTP ${response.status}`);
      }

      // Save to localStorage
      localStorage.setItem('supabase_url', config.url);
      localStorage.setItem('supabase_anon_key', config.anonKey);

      setMessage('Configuração salva! Recarregando...');
      
      setTimeout(() => {
        onConfigured();
      }, 1000);

    } catch (error) {
      setMessage(`Erro: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Configuração do Supabase
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Configure as credenciais do Supabase para usar o sistema
          </p>
        </div>

        {message && (
          <div className={`mb-6 border rounded-lg p-4 ${
            message.includes('Erro') 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' 
              : message.includes('sucesso') || message.includes('Recarregando')
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
          }`}>
            {loading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400 mr-2"></div>
                <span>{message}</span>
              </div>
            )}
            {!loading && <span>{message}</span>}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL do Projeto Supabase *
            </label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="https://seu-projeto.supabase.co"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chave Anônima (anon key) *
            </label>
            <textarea
              value={config.anonKey}
              onChange={(e) => setConfig(prev => ({ ...prev, anonKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !config.url || !config.anonKey}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Testando...' : 'Salvar e Testar Conexão'}
          </button>
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Como obter as credenciais:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-300">supabase.com/dashboard</a></li>
            <li>Crie um novo projeto ou selecione um existente</li>
            <li>Vá em "Settings" → "API"</li>
            <li>Copie a "Project URL" e cole no primeiro campo</li>
            <li>Copie a chave "anon public" e cole no segundo campo</li>
            <li>Clique em "Salvar e Testar Conexão"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;