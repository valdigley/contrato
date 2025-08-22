import React from 'react';
import { useState, useEffect } from 'react';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import SystemSettings from './components/SystemSettings';
import FinancialDashboard from './components/FinancialDashboard';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import { LogOut, User } from 'lucide-react';

function App() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isClientMode = urlParams.get('client') === 'true';
    const editId = urlParams.get('edit');
    const isSettings = urlParams.get('settings') === 'true';
    const isFinancial = urlParams.get('financial') === 'true';
    
    if (isFinancial) {
      return 'financial';
    }
    if (isSettings) {
      return 'settings';
    }
    if (isClientMode || editId) {
      return 'form';
    }
    return 'list';
  });

  const handleViewChange = (view: 'list' | 'form' | 'settings' | 'financial') => {
    setCurrentView(view);
    // Update URL without page reload
    if (view === 'list') {
      window.history.pushState({}, '', window.location.pathname);
    } else if (view === 'settings') {
      window.history.pushState({}, '', '?settings=true');
    } else if (view === 'financial') {
      window.history.pushState({}, '', '?financial=true');
    } else if (view === 'financial') {
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
    return <Login onLogin={() => handleViewChange('list')} />;
  }

  if (currentView === 'financial') {
    return (
      <div>
        {isAuthenticated && <UserHeader user={user} onSignOut={signOut} />}
        <FinancialDashboard onBack={() => handleViewChange('list')} />
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div>
        {isAuthenticated && <UserHeader user={user} onSignOut={signOut} />}
        <SystemSettings onBack={() => handleViewChange('list')} />
      </div>
    );
  }

  if (currentView === 'form') {
    return <ContractForm onBackToList={() => handleViewChange('list')} />;
  }
  
  return (
    <div>
      {isAuthenticated && <UserHeader user={user} onSignOut={signOut} />}
      <ContractList 
        onNewContract={() => handleViewChange('form')}
        onFinancial={() => handleViewChange('financial')}
        onFinancial={() => handleViewChange('financial')}
      />
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