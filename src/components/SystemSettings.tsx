import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, Key, Globe, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface SystemSettingsProps {
  onBack: () => void;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: ''
  });
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Carregar configurações atuais do localStorage ou variáveis de ambiente
    const savedUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    const savedKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    setSupabaseConfig({
      url: savedUrl,
      anonKey: savedKey
    });
  }, []);

  const validateSupabaseUrl = (url: string): boolean => {
    const urlPattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;
    return urlPattern.test(url);
  };

  const validateSupabaseKey = (key: string): boolean => {
    // Supabase anon keys geralmente começam com 'eyJ' (JWT format)
    return key.length > 100 && key.startsWith('eyJ');
  };

  const testConnection = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      alert('Preencha URL e chave antes de testar a conexão');
      return;
    }

    setTestStatus('testing');

    try {
      const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTestStatus('success');
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const saveConfiguration = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateSupabaseUrl(supabaseConfig.url)) {
      alert('URL do Supabase inválida. Use o formato: https://seu-projeto.supabase.co');
      return;
    }

    if (!validateSupabaseKey(supabaseConfig.anonKey)) {
      alert('Chave anônima do Supabase inválida. Verifique se copiou a chave correta.');
      return;
    }

    setLoading(true);
    setSaveStatus('idle');

    try {
      // Salvar no localStorage
      localStorage.setItem('supabase_url', supabaseConfig.url);
      localStorage.setItem('supabase_anon_key', supabaseConfig.anonKey);

      // Tentar atualizar as variáveis de ambiente (isso requer reload da página)
      const envContent = `VITE_SUPABASE_URL=${supabaseConfig.url}\nVITE_SUPABASE_ANON_KEY=${supabaseConfig.anonKey}`;
      
      // Simular salvamento (em produção, isso seria feito no backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      
      // Mostrar mensagem de sucesso e instruir reload
      setTimeout(() => {
        if (confirm('Configurações salvas! É necessário recarregar a página para aplicar as mudanças. Recarregar agora?')) {
          window.location.reload();
        }
      }, 1000);

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SupabaseConfig, value: string) => {
    setSupabaseConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveStatus('idle');
    setTestStatus('idle');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                <p className="text-gray-600">Configure as conexões e parâmetros do sistema</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* Supabase Configuration */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configuração do Supabase</h2>
          </div>

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
                value={supabaseConfig.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://seu-projeto.supabase.co"
              />
              <p className="mt-1 text-sm text-gray-500">
                Encontre esta URL no painel do Supabase em: Configurações → API → Project URL
              </p>
            </div>

            {/* Chave Anônima */}
            <div>
              <label htmlFor="supabase_anon_key" className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="inline h-4 w-4 mr-1" />
                Chave Anônima (anon key) *
              </label>
              <div className="relative">
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  id="supabase_anon_key"
                  value={supabaseConfig.anonKey}
                  onChange={(e) => handleInputChange('anonKey', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAnonKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Encontre esta chave no painel do Supabase em: Configurações → API → anon public
              </p>
            </div>

            {/* Status Messages */}
            {saveStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-green-700">Configurações salvas com sucesso!</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">Erro ao salvar configurações. Tente novamente.</span>
              </div>
            )}

            {testStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-green-700">Conexão testada com sucesso!</span>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">Erro na conexão. Verifique as credenciais.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={testConnection}
                disabled={testStatus === 'testing' || !supabaseConfig.url || !supabaseConfig.anonKey}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {testStatus === 'testing' ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Database className="h-5 w-5" />
                    <span>Testar Conexão</span>
                  </>
                )}
              </button>

              <button
                onClick={saveConfiguration}
                disabled={loading || !supabaseConfig.url || !supabaseConfig.anonKey}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Como obter as credenciais do Supabase:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">https://supabase.com/dashboard</a></li>
            <li>Selecione seu projeto</li>
            <li>Vá em "Settings" (Configurações) no menu lateral</li>
            <li>Clique em "API" na seção de configurações</li>
            <li>Copie a "Project URL" e cole no campo URL acima</li>
            <li>Copie a chave "anon public" e cole no campo Chave Anônima acima</li>
            <li>Clique em "Testar Conexão" para verificar se as credenciais estão corretas</li>
            <li>Se o teste for bem-sucedido, clique em "Salvar Configurações"</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Após salvar as configurações, será necessário recarregar a página para que as mudanças tenham efeito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}