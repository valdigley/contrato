import React, { useState, useEffect } from 'react';
import { Database, Settings, AlertCircle } from 'lucide-react';

function App() {
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

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
  if (checkingConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando configuração...</p>
        </div>
      </div>
    );
  }

  // Supabase not configured
  if (!supabaseConfigured || showConfig) {
    return <SupabaseConfigScreen onConfigured={() => window.location.reload()} />;
  }

  // Main app (placeholder for now)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Database className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema Configurado!</h1>
          <p className="text-gray-600 mb-4">Supabase conectado com sucesso</p>
          <button
            onClick={() => setShowConfig(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <Settings className="h-4 w-4" />
            <span>Reconfigurar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Supabase Config Component
function SupabaseConfigScreen({ onConfigured }: { onConfigured: () => void }) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configuração do Supabase
          </h1>
          <p className="text-gray-600">
            Configure as credenciais do Supabase para usar o sistema
          </p>
        </div>

        {message && (
          <div className={`mb-6 border rounded-lg p-4 ${
            message.includes('Erro') 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : message.includes('sucesso') || message.includes('Recarregando')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {loading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span>{message}</span>
              </div>
            )}
            {!loading && <span>{message}</span>}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Projeto Supabase *
            </label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://seu-projeto.supabase.co"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave Anônima (anon key) *
            </label>
            <textarea
              value={config.anonKey}
              onChange={(e) => setConfig(prev => ({ ...prev, anonKey: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !config.url || !config.anonKey}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Testando...' : 'Salvar e Testar Conexão'}
          </button>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Como obter as credenciais:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/dashboard</a></li>
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