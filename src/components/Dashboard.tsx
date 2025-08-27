import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Settings,
  User,
  LogOut,
  FileText,
  Camera,
  Sun,
  Moon,
  Edit2,
  Save,
  X,
  Search,
  Eye,
  Trash2,
  MessageCircle,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

interface Contract {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  data_nascimento: string;
  tipo_evento: string;
  event_type_id?: string;
  package_id?: string;
  package_price?: number;
  local_festa: string;
  nome_noivos?: string;
  nome_aniversariante?: string;
  local_pre_wedding?: string;
  local_making_of?: string;
  local_cerimonia?: string;
  data_evento?: string;
  horario_evento?: string;
  final_price?: number;
  preferred_payment_day?: number;
  created_at: string;
  status?: 'draft' | 'sent' | 'signed';
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    business_name: '',
    phone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchContracts();
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Buscar dados do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      // Buscar dados do fotógrafo
      const { data: photographerData } = await supabase
        .from('photographers')
        .select('business_name, phone')
        .eq('user_id', user.id)
        .single();

      setProfileData({
        name: userData?.name || '',
        business_name: photographerData?.business_name || '',
        phone: photographerData?.phone || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      // Atualizar dados do usuário
      await supabase
        .from('users')
        .update({ name: profileData.name })
        .eq('id', user.id);

      // Atualizar ou criar dados do fotógrafo
      const { data: existingPhotographer } = await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPhotographer) {
        await supabase
          .from('photographers')
          .update({
            business_name: profileData.business_name,
            phone: profileData.phone
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('photographers')
          .insert([{
            user_id: user.id,
            business_name: profileData.business_name,
            phone: profileData.phone,
            settings: {}
          }]);
      }

      setShowProfileModal(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchContracts = async () => {
    if (!user) return;

    try {
      // Get photographer profile for current user
      const { data: photographerData, error: photographerError } = await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (photographerError) {
        console.error('Erro ao buscar fotógrafo:', photographerError);
        setLoading(false);
        return;
      }

      // Fetch contracts for this photographer
      const { data: contracts, error: contractsError } = await supabase
        .from('contratos')
        .select('*')
        .eq('photographer_id', photographerData.id);

      if (contractsError) {
        console.error('Erro ao buscar contratos:', contractsError);
        setLoading(false);
        return;
      }

      setContracts(contracts?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const deleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setContracts(prevContracts => prevContracts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato');
    }
  };

  const updateContractStatus = async (contractId: string, status: 'draft' | 'sent' | 'signed') => {
    try {
      const { error } = await supabase
        .from('contratos')
        .update({ status })
        .eq('id', contractId);

      if (error) throw error;

      setContracts(prev => prev.map(contract =>
        contract.id === contractId ? { ...contract, status } : contract
      ));
    } catch (error) {
      console.error('Erro ao atualizar status do contrato:', error);
      alert('Erro ao atualizar status do contrato');
    }
  };

  const sendWhatsAppContract = (contract: Contract) => {
    const phone = contract.whatsapp.replace(/\D/g, '');
    const message = `Olá ${contract.nome_completo}! Segue o contrato para seu ${contract.tipo_evento}.`;
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return '';
    const clean = whatsapp.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'signed':
        return '✓ Assinado';
      case 'sent':
        return '📤 Enviado';
      case 'cancelled':
        return '❌ Cancelado';
      default:
        return '📝 Rascunho';
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'Casamento': 'bg-pink-100 text-pink-800 border border-pink-200',
      'Aniversário': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Ensaio Fotográfico': 'bg-purple-100 text-purple-800 border border-purple-200',
      'Formatura': 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Filter contracts based on search term and filter type
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cpf.includes(searchTerm) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === '' || contract.tipo_evento === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sistema de Controle Fotográfico
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bem-vindo, {profileData.name || user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>

              {/* Profile Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:block">Perfil</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:block">Configurações</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:block">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => onNavigate('form')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg p-6 text-left transition-colors hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <Plus className="h-8 w-8" />
              <span className="text-sm opacity-75">Ação Rápida</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Novo Contrato</h3>
            <p className="text-blue-100 dark:text-blue-200">Criar um novo contrato de evento</p>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg p-6 text-left transition-colors hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <Settings className="h-8 w-8" />
              <span className="text-sm opacity-75">Configurar</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Configurações</h3>
            <p className="text-green-100 dark:text-green-200">Configurar sistema e tipos de eventos</p>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="Casamento">Casamento</option>
                <option value="Aniversário">Aniversário</option>
                <option value="Ensaio Fotográfico">Ensaio Fotográfico</option>
                <option value="Formatura">Formatura</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Todos os Contratos</h3>
          </div>
          
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Nenhum resultado encontrado'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {contracts.length === 0 
                  ? 'Comece criando seu primeiro contrato'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo de Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {contract.nome_completo}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCPF(contract.cpf)} • {contract.cidade}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            📧 {contract.email} • 📱 {contract.whatsapp ? formatWhatsApp(contract.whatsapp) : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(contract.tipo_evento)}`}>
                          {contract.tipo_evento}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                            {getStatusText(contract.status)}
                          </span>
                        </div>
                        {contract.data_evento && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            📅 {formatDate(contract.data_evento)}
                            {contract.horario_evento && (
                              <span className="ml-2">🕐 {contract.horario_evento}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(contract.created_at)}
                        <div className="text-xs text-gray-400 dark:text-gray-500">Cadastrado em</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => sendWhatsAppContract(contract)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Status Controls */}
                        <div className="flex space-x-1 mt-2">
                          <button
                            onClick={() => updateContractStatus(contract.id, 'sent')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              contract.status === 'sent' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                            }`}
                            title="Marcar como enviado"
                          >
                            📤
                          </button>
                          <button
                            onClick={() => updateContractStatus(contract.id, 'signed')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              contract.status === 'signed' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                            }`}
                            title="Marcar como assinado"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => deleteContract(contract.id)}
                            className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                            title="Excluir contrato"
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum contrato encontrado</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Comece criando seu primeiro contrato</p>
                <button
                  onClick={() => onNavigate('form')}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Criar Contrato
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{contract.nome_completo}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contract.tipo_evento}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{formatDate(contract.created_at)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {(contract.final_price || contract.package_price) && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(contract.final_price || contract.package_price || 0)}
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                        {getStatusText(contract.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
                        {formatDate(contract.created_at)}
                        <div className="text-xs text-gray-400 dark:text-gray-500">Cadastrado em</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => sendWhatsAppContract(contract)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Status Controls */}
                        <div className="flex space-x-1 mt-2">
                          <button
                            onClick={() => updateContractStatus(contract.id, 'sent')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              contract.status === 'sent' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                            }`}
                            title="Marcar como enviado"
                          >
                            📤
                          </button>
                          <button
                            onClick={() => updateContractStatus(contract.id, 'signed')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              contract.status === 'signed' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                            }`}
                            title="Marcar como assinado"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => deleteContract(contract.id)}
                            className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                            title="Excluir contrato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Perfil</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Negócio
                  </label>
                  <input
                    type="text"
                    value={profileData.business_name}
                    onChange={(e) => setProfileData({...profileData, business_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: João Silva Fotografia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefone/WhatsApp
                  </label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {savingProfile ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{savingProfile ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}