import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, Key, Globe, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle, Package, FileText, CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventType, Package as PackageType, PaymentMethod, ContractTemplate } from '../types';
import { useTheme } from '../hooks/useTheme';

interface SystemSettingsProps {
  onBack: () => void;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const { theme, toggleTheme } = useTheme();
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

  // Form states for different entities
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!validateSupabaseUrl(supabaseConfig.url)) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    if (!validateSupabaseKey(supabaseConfig.anonKey)) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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

  const handleSave = async (type: string, data: any) => {
    setSaving(true);
    try {
      let result;
      
      if (editingItem) {
        // Update existing item
        result = await supabase
          .from(type)
          .update(data)
          .eq('id', editingItem.id)
          .select()
          .single();
      } else {
        // Create new item
        result = await supabase
          .from(type)
          .insert([data])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Update local state
      if (type === 'event_types') {
        if (editingItem) {
          setEventTypes(prev => prev.map(item => 
            item.id === editingItem.id ? result.data : item
          ));
        } else {
          setEventTypes(prev => [...prev, result.data]);
        }
      } else if (type === 'packages') {
        if (editingItem) {
          setPackages(prev => prev.map(item => 
            item.id === editingItem.id ? result.data : item
          ));
        } else {
          setPackages(prev => [...prev, result.data]);
        }
      } else if (type === 'payment_methods') {
        if (editingItem) {
          setPaymentMethods(prev => prev.map(item => 
            item.id === editingItem.id ? result.data : item
          ));
        } else {
          setPaymentMethods(prev => [...prev, result.data]);
        }
      } else if (type === 'contract_templates') {
        if (editingItem) {
          setContractTemplates(prev => prev.map(item => 
            item.id === editingItem.id ? result.data : item
          ));
        } else {
          setContractTemplates(prev => [...prev, result.data]);
        }
      }

      // Close modal and reset form
      setShowAddModal(false);
      setEditingItem(null);
      setFormData({});
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      if (type === 'event_types') {
        setEventTypes(prev => prev.filter(item => item.id !== id));
      } else if (type === 'packages') {
        setPackages(prev => prev.filter(item => item.id !== id));
      } else if (type === 'payment_methods') {
        setPaymentMethods(prev => prev.filter(item => item.id !== id));
      } else if (type === 'contract_templates') {
        setContractTemplates(prev => prev.filter(item => item.id !== id));
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (error) {
      console.error('Erro ao excluir:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const openEditModal = (type: string, item?: any) => {
    setEditingItem(item || null);
    setFormData(item || {});
    setShowAddModal(true);
    setActiveTab(type);
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configuração do Supabase</h2>
      </div>

      <div className="space-y-6">
        {/* URL do Supabase */}
        <div>
          <label htmlFor="supabase_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Globe className="inline h-4 w-4 mr-1" />
            URL do Projeto Supabase *
          </label>
          <input
            type="url"
            id="supabase_url"
            value={supabaseConfig.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="https://seu-projeto.supabase.co"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Encontre esta URL no painel do Supabase em: Configurações → API → Project URL
          </p>
        </div>

        {/* Chave Anônima */}
        <div>
          <label htmlFor="supabase_anon_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Key className="inline h-4 w-4 mr-1" />
            Chave Anônima (anon key) *
          </label>
          <div className="relative">
            <input
              type={showAnonKey ? 'text' : 'password'}
              id="supabase_anon_key"
              value={supabaseConfig.anonKey}
              onChange={(e) => handleInputChange('anonKey', e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
            <button
              type="button"
              onClick={() => setShowAnonKey(!showAnonKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
            >
              {showAnonKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
            onClick={testConnection}
            disabled={testStatus === 'testing' || !supabaseConfig.url || !supabaseConfig.anonKey}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-green-300 dark:disabled:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 mr-4"
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
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2"
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
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Como obter as credenciais do Supabase:</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
          <li>Acesse <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">https://supabase.com/dashboard</a></li>
          <li>Selecione seu projeto</li>
          <li>Vá em "Settings" (Configurações) no menu lateral</li>
          <li>Clique em "API" na seção de configurações</li>
          <li>Copie a "Project URL" e cole no campo URL acima</li>
          <li>Copie a chave "anon public" e cole no campo Chave Anônima acima</li>
          <li>Clique em "Testar Conexão" para verificar se as credenciais estão corretas</li>
          <li>Se o teste for bem-sucedido, clique em "Salvar Configurações"</li>
        </ol>
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Importante:</strong> Após salvar as configurações, será necessário recarregar a página para que as mudanças tenham efeito.
          </p>
        </div>
      </div>
    </div>
  );

  const renderEventTypes = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tipos de Eventos</h2>
        </div>
        <button
          onClick={() => openEditModal('event_types')}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Tipo</span>
        </button>
      </div>

      <div className="space-y-4">
        {eventTypes.map((eventType) => (
          <div key={eventType.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{eventType.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Status: {eventType.is_active ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => openEditModal('event_types', eventType)}
                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDelete('event_types', eventType.id)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPackages = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pacotes</h2>
        </div>
        <button
          onClick={() => openEditModal('packages')}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Pacote</span>
        </button>
      </div>

      <div className="space-y-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{pkg.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  R$ {pkg.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => openEditModal('packages', pkg)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete('packages', pkg.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{pkg.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Status: {pkg.is_active ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Formas de Pagamento</h2>
        </div>
        <button
          onClick={() => openEditModal('payment_methods')}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Forma</span>
        </button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div key={method.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{method.name}</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {method.installments}x
                </span>
                <button
                  onClick={() => openEditModal('payment_methods', method)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete('payment_methods', method.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{method.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Desconto: {method.discount_percentage}%</span>
              <span>Status: {method.is_active ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContractTemplates = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Modelos de Contrato</h2>
        </div>
        <button
          onClick={() => openEditModal('contract_templates')}
          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Modelo</span>
        </button>
      </div>

      <div className="space-y-4">
        {contractTemplates.map((template) => (
          <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal('contract_templates', template)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete('contract_templates', template.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Status: {template.is_active ? 'Ativo' : 'Inativo'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações do Sistema</h1>
                <p className="text-gray-600 dark:text-gray-300">Configure as conexões e parâmetros do sistema</p>
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
              
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('event-types')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'event-types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Supabase</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingItem ? 'Editar' : 'Adicionar'} {
                      activeTab === 'event_types' ? 'Tipo de Evento' :
                      activeTab === 'packages' ? 'Pacote' :
                      activeTab === 'payment_methods' ? 'Forma de Pagamento' :
                      activeTab === 'contract_templates' ? 'Modelo de Contrato' : 'Item'
                    }
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {saveStatus === 'success' && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-green-700">Salvo com sucesso!</span>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-red-700">Erro ao salvar. Tente novamente.</span>
                  </div>
                )}

                {/* Event Types Form */}
                {activeTab === 'event_types' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome do Tipo de Evento *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Casamento, Aniversário, Ensaio..."
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active !== false}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Ativo</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Packages Form */}
                {activeTab === 'packages' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Evento *
                      </label>
                      <select
                        value={formData.event_type_id || ''}
                        onChange={(e) => setFormData({...formData, event_type_id: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione o tipo de evento</option>
                        {eventTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome do Pacote *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Pacote Básico, Premium..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Descrição do pacote..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preço *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recursos Inclusos (um por linha)
                      </label>
                      <textarea
                        value={Array.isArray(formData.features) ? formData.features.join('\n') : ''}
                        onChange={(e) => setFormData({...formData, features: e.target.value.split('\n').filter(f => f.trim())})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        placeholder="Ex:&#10;Sessão de fotos de 2 horas&#10;50 fotos editadas&#10;Álbum digital"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active !== false}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Ativo</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Payment Methods Form */}
                {activeTab === 'payment_methods' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Forma de Pagamento *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: À vista, Parcelado em 3x..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Descrição da forma de pagamento..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Desconto/Acréscimo (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount_percentage || ''}
                        onChange={(e) => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0 (negativo para desconto, positivo para acréscimo)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.installments || 1}
                        onChange={(e) => setFormData({...formData, installments: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active !== false}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Ativo</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Contract Templates Form */}
                {activeTab === 'contract_templates' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Evento *
                      </label>
                      <select
                        value={formData.event_type_id || ''}
                        onChange={(e) => setFormData({...formData, event_type_id: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Selecione o tipo de evento</option>
                        {eventTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome do Modelo *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Contrato de Casamento Padrão"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conteúdo do Contrato *
                      </label>
                      <textarea
                        value={formData.content || ''}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={10}
                        placeholder="Digite o modelo do contrato aqui. Use variáveis como {{nome_completo}}, {{cpf}}, {{data_evento}}, etc."
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Variáveis disponíveis: {'{{nome_completo}}'}, {'{{cpf}}'}, {'{{email}}'}, {'{{whatsapp}}'}, {'{{endereco}}'}, {'{{cidade}}'}, {'{{data_nascimento}}'}, {'{{tipo_evento}}'}, {'{{data_evento}}'}, {'{{horario_evento}}'}, {'{{local_festa}}'}, {'{{nome_noivos}}'}, {'{{nome_aniversariante}}'}, {'{{package_name}}'}, {'{{package_price}}'}, {'{{package_features}}'}
                      </p>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active !== false}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Ativo</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const tableMap = {
                        'event_types': 'event_types',
                        'packages': 'packages', 
                        'payment_methods': 'payment_methods',
                        'contract_templates': 'contract_templates'
                      };
                      handleSave(tableMap[activeTab as keyof typeof tableMap], formData);
                    }}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}