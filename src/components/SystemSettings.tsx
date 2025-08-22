import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, Key, Globe, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Package, FileText, CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventType, Package as PackageType, PaymentMethod, ContractTemplate } from '../types';

interface SystemSettingsProps {
  onBack: () => void;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const [activeTab, setActiveTab] = useState<'supabase' | 'event-types' | 'packages' | 'payment-methods' | 'templates'>('supabase');
  const [activeTab, setActiveTab] = useState<'supabase' | 'event-types' | 'packages' | 'payment-methods' | 'templates'>('event-types');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: ''
  });
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    // Carregar configurações atuais do localStorage ou variáveis de ambiente
    const savedUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    const savedKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    setSupabaseConfig({
      url: savedUrl,
      anonKey: savedKey
    });
    
    // Load system data
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      const [eventTypesRes, packagesRes, paymentMethodsRes, templatesRes] = await Promise.all([
        supabase.from('event_types').select('*').order('name'),
        supabase.from('packages').select('*').order('name'),
        supabase.from('payment_methods').select('*').order('name'),
        supabase.from('contract_templates').select('*').order('name')
      ]);

      if (!eventTypesRes.error) setEventTypes(eventTypesRes.data || []);
      if (!packagesRes.error) setPackages(packagesRes.data || []);
      if (!paymentMethodsRes.error) setPaymentMethods(paymentMethodsRes.data || []);
      if (!templatesRes.error) setContractTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do sistema:', error);
    }
  };

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
    setTestStatus('testing');

    try {
      // Primeiro testar a conexão
      const response = await fetch(`${supabaseConfig.url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseConfig.anonKey,
          'Authorization': `Bearer ${supabaseConfig.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Conexão falhou: HTTP ${response.status}`);
      }

      setTestStatus('success');

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
      setTestStatus('error');
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'supabase':
        return renderSupabaseConfig();
      case 'event-types':
        return renderEventTypes();
      case 'packages':
        return renderPackages();
      case 'payment-methods':
        return renderPaymentMethods();
      case 'templates':
        return renderContractTemplates();
      default:
        return renderSupabaseConfig();
    }
  };

  const renderSupabaseConfig = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
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
        <div className="flex justify-center">
          <button
            onClick={saveConfiguration}
            disabled={loading || !supabaseConfig.url || !supabaseConfig.anonKey}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Salvar e Testar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
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
  );

  const renderEventTypes = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Tipos de Eventos</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Tipo</span>
        </button>
      </div>

      <div className="space-y-4">
        {eventTypes.map((eventType) => (
          <div key={eventType.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{eventType.name}</h3>
              <p className="text-sm text-gray-500">
                Status: {eventType.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingItem(eventType)}
                className="text-blue-600 hover:text-blue-900 p-1 rounded"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button className="text-red-600 hover:text-red-900 p-1 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPackages = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Pacotes</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Pacote</span>
        </button>
      </div>

      <div className="space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{pkg.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-green-600">
                  R$ {pkg.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => setEditingItem(pkg)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900 p-1 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
            <p className="text-xs text-gray-500">
              Status: {pkg.is_active ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Formas de Pagamento</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Forma</span>
        </button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{method.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {method.installments}x
                </span>
                <button
                  onClick={() => setEditingItem(method)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900 p-1 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{method.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Desconto: {method.discount_percentage}%</span>
              <span>Status: {method.is_active ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContractTemplates = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">Modelos de Contrato</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Modelo</span>
        </button>
      </div>

      <div className="space-y-4">
        {contractTemplates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingItem(template)}
                  className="text-blue-600 hover:text-blue-900 p-1 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="text-red-600 hover:text-red-900 p-1 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Status: {template.is_active ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

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

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('event-types')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'event-types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Tipos de Eventos</span>
            </button>

            <button
              onClick={() => setActiveTab('packages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'packages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Pacotes</span>
            </button>

            <button
              onClick={() => setActiveTab('payment-methods')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'payment-methods'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Pagamentos</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Contratos</span>
            </button>

            <button
              onClick={() => setActiveTab('supabase')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'supabase'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Supabase</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}