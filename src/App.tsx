import React from 'react';
import { useState, useEffect } from 'react';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import SystemSettings from './components/SystemSettings';
import FinancialDashboard from './components/FinancialDashboard';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import { LogOut, User, DollarSign, FileText, Settings, Plus, Database, AlertCircle, UserCircle } from 'lucide-react';

function App() {
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isClientMode = urlParams.get('client') === 'true';
    const editId = urlParams.get('edit');
    const isSettings = urlParams.get('settings') === 'true';
    const isContracts = urlParams.get('contracts') === 'true';
    const isProfile = urlParams.get('profile') === 'true';
    
    if (isSettings) {
      return 'settings';
    }
    if (isProfile) {
      return 'profile';
    }
    if (isContracts) {
      return 'contracts';
    }
    if (isClientMode || editId) {
      return 'form';
    }
    return 'dashboard'; // Dashboard como primeira tela
  });

  // Verificar configuração do Supabase na inicialização
  useEffect(() => {
    const checkSupabaseConfig = () => {
      const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const isConfigured = supabaseUrl && supabaseKey && 
                          supabaseUrl.includes('supabase.co') && 
                          supabaseKey.length > 20;
      
      setSupabaseConfigured(isConfigured);
      setCheckingConfig(false);
    };

    checkSupabaseConfig();
  }, []);

  const handleViewChange = (view: 'dashboard' | 'contracts' | 'form' | 'settings' | 'profile') => {
    setCurrentView(view);
    // Update URL without page reload
    if (view === 'dashboard') {
      window.history.pushState({}, '', window.location.pathname);
    } else if (view === 'contracts') {
      window.history.pushState({}, '', '?contracts=true');
    } else if (view === 'settings') {
      window.history.pushState({}, '', '?settings=true');
    } else if (view === 'profile') {
      window.history.pushState({}, '', '?profile=true');
    }
  };

  // Mostrar loading enquanto verifica configuração e autenticação
  if (checkingConfig || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {checkingConfig ? 'Verificando configuração...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  // Se Supabase não está configurado, mostrar tela de configuração
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Configuração Necessária
            </h2>
            <p className="text-gray-600 mb-6">
              Para usar o sistema, você precisa configurar as credenciais do Supabase primeiro.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Database className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">
                    Credenciais do Supabase Necessárias:
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• URL do projeto Supabase</li>
                    <li>• Chave anônima (anon key)</li>
                  </ul>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentView('settings');
                // Forçar recheck após configurar
                setTimeout(() => {
                  const supabaseUrl = localStorage.getItem('supabase_url');
                  const supabaseKey = localStorage.getItem('supabase_anon_key');
                  const isConfigured = supabaseUrl && supabaseKey && 
                                      supabaseUrl.includes('supabase.co') && 
                                      supabaseKey.length > 20;
                  setSupabaseConfigured(isConfigured);
                }, 1000);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Settings className="h-5 w-5" />
              <span>Ir para Configurações</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se é modo cliente (não precisa de autenticação)
  const urlParams = new URLSearchParams(window.location.search);
  const isClientMode = urlParams.get('client') === 'true';

  // Se não está autenticado e não é modo cliente, mostrar login
  if (!isAuthenticated && !isClientMode) {
    return <Login onLogin={() => handleViewChange('dashboard')} />;
  }

  // Modo cliente - apenas formulário
  if (isClientMode) {
    return <ContractForm onBackToList={() => handleViewChange('contracts')} />;
  }

  // Formulário interno (para usuários autenticados)
  if (currentView === 'form') {
    return (
      <div>
        <UserHeader user={user} onSignOut={signOut} />
        <ContractForm onBackToList={() => handleViewChange('contracts')} />
      </div>
    );
  }

  // Configurações
  if (currentView === 'settings') {
    return (
      <div>
        {isAuthenticated ? (
          <UserHeader user={user} onSignOut={signOut} />
        ) : null}
        <SystemSettings 
          onBack={() => handleViewChange('dashboard')} 
          onConfigSaved={() => {
            // Recheck configuration after saving
            const supabaseUrl = localStorage.getItem('supabase_url');
            const supabaseKey = localStorage.getItem('supabase_anon_key');
            const isConfigured = supabaseUrl && supabaseKey && 
                                supabaseUrl.includes('supabase.co') && 
                                supabaseKey.length > 20;
            setSupabaseConfigured(isConfigured);
          }}
        />
      </div>
    );
  }

  // Perfil do usuário
  if (currentView === 'profile') {
    return (
      <div>
        <UserHeader user={user} onSignOut={signOut} />
        <UserProfile onBack={() => handleViewChange('dashboard')} />
      </div>
    );
  }

  // Layout principal com guias
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader user={user} onSignOut={signOut} />
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleViewChange('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Dashboard Financeiro</span>
            </button>
            
            <button
              onClick={() => handleViewChange('contracts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === 'contracts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Contratos</span>
            </button>

            <button
              onClick={() => handleViewChange('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </button>

            <button
              onClick={() => handleViewChange('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                currentView === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCircle className="h-4 w-4" />
              <span>Perfil</span>
            </button>

            <div className="flex-1"></div>

            <button
              onClick={() => handleViewChange('form')}
              className="py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg my-2 flex items-center space-x-2 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Contrato</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {currentView === 'dashboard' && (
          <FinancialDashboard onBack={() => handleViewChange('dashboard')} />
        )}
        
        {currentView === 'contracts' && (
          <ContractList 
            onNewContract={() => handleViewChange('form')}
            onFinancial={() => handleViewChange('dashboard')}
          />
        )}
      </div>
    </div>
  );
}

// Componente para mostrar informações do usuário logado
function UserHeader({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">
              Logado como: <span className="font-medium">{user?.email}</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.href = '?profile=true'}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <UserCircle className="h-4 w-4" />
            <span>Meu Perfil</span>
          </button>
          
          <button
            onClick={onSignOut}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;