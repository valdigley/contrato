import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import FinancialDashboard from './components/FinancialDashboard';
import SystemSettings from './components/SystemSettings';
import UserProfile from './components/UserProfile';
import { AlertCircle, Database, Settings } from 'lucide-react';

function App() {
  const { user, loading, error: authError, isAuthenticated } = useAuth();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  // Check Supabase configuration
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

  // Check URL parameters for client mode
  const urlParams = new URLSearchParams(window.location.search);
  const isClientMode = urlParams.get('client') === 'true';

  // Loading state
  if (checkingConfig || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {checkingConfig ? 'Verificando configuração...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  // Supabase not configured
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Configuração Necessária
            </h2>
            <p className="text-gray-600 mb-6">
              Configure as credenciais do Supabase para usar o sistema.
            </p>
            <button
              onClick={() => setCurrentView('settings')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Settings className="h-5 w-5" />
              <span>Configurar Supabase</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Client mode - only form
  if (isClientMode) {
    return <ContractForm onBackToList={() => setCurrentView('dashboard')} />;
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <Login onLogin={() => setCurrentView('dashboard')} />;
  }

  // Settings view
  if (currentView === 'settings') {
    return (
      <SystemSettings 
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  // Profile view
  if (currentView === 'profile') {
    return (
      <UserProfile onBack={() => setCurrentView('dashboard')} />
    );
  }

  // Contract form view
  if (currentView === 'form') {
    return (
      <ContractForm onBackToList={() => setCurrentView('dashboard')} />
    );
  }

  // Contract list view
  if (currentView === 'contracts') {
    return (
      <ContractList 
        onNewContract={() => setCurrentView('form')}
        onBackToDashboard={() => setCurrentView('dashboard')}
      />
    );
  }


  // Main dashboard
  return (
    <Dashboard 
      user={user}
      onNavigate={setCurrentView}
    />
  );
}

export default App;