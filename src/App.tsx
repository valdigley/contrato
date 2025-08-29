import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ContractForm from './components/ContractForm';
import ContractList from './components/ContractList';
import FinancialDashboard from './components/FinancialDashboard';
import SystemSettings from './components/SystemSettings';
import UserProfile from './components/UserProfile';
import SupabaseConfigScreen from './components/SupabaseConfigScreen';
import { AlertCircle, Database, Settings } from 'lucide-react';

function App() {
  const { user, loading, error: authError, isAuthenticated } = useAuth();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

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
      <SupabaseConfigScreen onConfigured={() => window.location.reload()} />
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

  // Financial dashboard view
  if (currentView === 'financial') {
    return (
      <FinancialDashboard onBack={() => setCurrentView('dashboard')} />
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