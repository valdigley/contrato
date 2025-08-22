import React from 'react';
import { useState, useEffect } from 'react';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import SystemSettings from './components/SystemSettings';
import FinancialDashboard from './components/FinancialDashboard';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import { LogOut, User, DollarSign, FileText, Settings, Plus } from 'lucide-react';

function App() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isClientMode = urlParams.get('client') === 'true';
    const editId = urlParams.get('edit');
    const isSettings = urlParams.get('settings') === 'true';
    const isContracts = urlParams.get('contracts') === 'true';
    
    if (isSettings) {
      return 'settings';
    }
    if (isContracts) {
      return 'contracts';
    }
    if (isClientMode || editId) {
      return 'form';
    }
    return 'dashboard'; // Dashboard como primeira tela
  });

  const handleViewChange = (view: 'dashboard' | 'contracts' | 'form' | 'settings') => {
    setCurrentView(view);
    // Update URL without page reload
    if (view === 'dashboard') {
      window.history.pushState({}, '', window.location.pathname);
    } else if (view === 'contracts') {
      window.history.pushState({}, '', '?contracts=true');
    } else if (view === 'settings') {
      window.history.pushState({}, '', '?settings=true');
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
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
        <UserHeader user={user} onSignOut={signOut} />
        <SystemSettings onBack={() => handleViewChange('dashboard')} />
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
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <User className="h-5 w-5 text-gray-600" />
          <span className="text-sm text-gray-700">
            Logado como: <span className="font-medium">{user?.email}</span>
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

export default App;