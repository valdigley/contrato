import React, { useState } from 'react';
import { Database, Save, Eye, EyeOff, CheckCircle, AlertCircle, Globe, Key } from 'lucide-react';

interface SupabaseConfigScreenProps {
  onConfigured: () => void;
}

export default function SupabaseConfigScreen({ onConfigured }: SupabaseConfigScreenProps) {
  const [config, setConfig] = useState({
    url: localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const testAndSave = async () => {
    if (!config.url || !config.anonKey) {
      setStatus('error');
      setMessage('Preencha URL e chave antes de continuar');
      return;
    }

    setLoading(true);
    setStatus('testing');
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

      setStatus('success');
      setMessage('Configuração salva com sucesso!');
      
      // Reload page after 2 seconds
      setTimeout(() => {
        onConfigured();
      }, 2000);

    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setStatus('error');
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

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-green-700">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700">{message}</span>
          </div>
        )}

        {status === 'testing' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700">{message}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* URL do Supabase */}
          <div>
            <label htmlFor="supabase_url" className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="inline h-4 w-4 mr-1" />
              URL do Projeto Supabase *
            </label>
            <input
              type="url"
              id="supabase_url"
              value={config.url}
              onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="https://seu-projeto.supabase.co"
              disabled={loading}
            />
          </div>

          {/* Chave Anônima */}
          <div>
            <label htmlFor="supabase_anon_key" className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="inline h-4 w-4 mr-1" />
              Chave Anônima (anon key) *
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                id="supabase_anon_key"
                value={config.anonKey}
                onChange={(e) => setConfig(prev => ({ ...prev, anonKey: e.target.value }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={testAndSave}
            disabled={loading || !config.url || !config.anonKey}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Salvar e Testar Conexão</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Como obter as credenciais:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">supabase.com/dashboard</a></li>
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