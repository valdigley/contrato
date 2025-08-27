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
  Download,
  Calendar,
  DollarSign
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
  discount_percentage?: number;
  adjusted_price?: number;
  custom_notes?: string;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
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

  const openEditModal = (contract: Contract) => {
    setEditingContract(contract);
    setShowEditModal(true);
  };

  const saveEditedContract = async () => {
    if (!editingContract) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('contratos')
        .update({
          discount_percentage: editingContract.discount_percentage || 0,
          adjusted_price: editingContract.adjusted_price || editingContract.final_price || editingContract.package_price,
          custom_notes: editingContract.custom_notes || null
        })
        .eq('id', editingContract.id);

      if (error) throw error;

      // Update local state
      setContracts(prev => prev.map(contract =>
        contract.id === editingContract.id ? editingContract : contract
      ));

      setShowEditModal(false);
      setEditingContract(null);
    } catch (error) {
      console.error('Erro ao salvar edições:', error);
      alert('Erro ao salvar edições do contrato');
    } finally {
      setSavingEdit(false);
    }
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
        {/* Quick Action Button */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('form')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Novo Contrato</span>
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
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data do Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map((contract) => (
                    <tr 
                      key={contract.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowModal(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {contract.tipo_evento}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.nome_completo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {contract.data_evento ? formatDate(contract.data_evento) : 'Não definida'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {contract.cidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(contract.adjusted_price || contract.final_price || contract.package_price || 0)}
                        {contract.discount_percentage > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {contract.discount_percentage}% desconto
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Contract Details Modal */}
      {showModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Contrato - {selectedContract.nome_completo}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Ações do Contrato */}
                <div className="flex flex-wrap gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <button
                    onClick={() => sendWhatsAppContract(selectedContract)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar WhatsApp</span>
                  </button>
                  <button
                    onClick={() => openEditModal(selectedContract)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar Contrato</span>
                  </button>
                  <button
                    onClick={() => updateContractStatus(selectedContract.id, 'sent')}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      selectedContract.status === 'sent' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    <span>📤 Marcar como Enviado</span>
                  </button>
                  <button
                    onClick={() => updateContractStatus(selectedContract.id, 'signed')}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      selectedContract.status === 'signed' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                    }`}
                  >
                    <span>✓ Marcar como Assinado</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este contrato?')) {
                        deleteContract(selectedContract.id);
                        setShowModal(false);
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>

                {/* Dados Pessoais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedContract.nome_completo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                      <p className="text-sm text-gray-900 dark:text-white">{formatCPF(selectedContract.cpf)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedContract.data_nascimento)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cidade</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedContract.cidade}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedContract.endereco}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedContract.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp</label>
                      <p className="text-sm text-gray-900 dark:text-white">{formatWhatsApp(selectedContract.whatsapp)}</p>
                    </div>
                  </div>
                </div>

                {/* Dados do Evento */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Dados do Evento
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Evento</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(selectedContract.tipo_evento)}`}>
                        {selectedContract.tipo_evento}
                      </span>
                    </div>

                    {(selectedContract.data_evento || selectedContract.horario_evento) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedContract.data_evento && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data do Evento</label>
                            <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedContract.data_evento)}</p>
                          </div>
                        )}
                        {selectedContract.horario_evento && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Horário do Evento</label>
                            <p className="text-sm text-gray-900 dark:text-white">{selectedContract.horario_evento}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedContract.nome_noivos && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome dos Noivos</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedContract.nome_noivos}</p>
                      </div>
                    )}

                    {selectedContract.nome_aniversariante && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do(a) Aniversariante</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedContract.nome_aniversariante}</p>
                      </div>
                    )}

                    {selectedContract.local_festa && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedContract.tipo_evento === 'Ensaio Fotográfico' ? 'Local do Ensaio' : 'Local da Festa'}
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedContract.local_festa}</p>
                      </div>
                    )}

                    {selectedContract.local_pre_wedding && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local do Pré-Wedding</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedContract.local_pre_wedding}</p>
                      </div>
                    )}

                    {selectedContract.local_making_of && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local do Making Of</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedContract.local_making_of}</p>
                      </div>
                    )}

                    {selectedContract.local_cerimonia && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local da Cerimônia</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedContract.local_cerimonia}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dados Financeiros */}
                {(selectedContract.package_price || selectedContract.final_price || selectedContract.preferred_payment_day) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Dados Financeiros
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-4">
                      {selectedContract.package_price && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço do Pacote</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(selectedContract.package_price)}
                          </p>
                        </div>
                      )}
                      {selectedContract.final_price && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço Final</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(selectedContract.final_price)}
                          </p>
                        </div>
                      )}
                      {selectedContract.adjusted_price && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço Ajustado</label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatCurrency(selectedContract.adjusted_price)}
                          </p>
                        </div>
                      )}
                      {selectedContract.discount_percentage > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desconto Aplicado</label>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            {selectedContract.discount_percentage}%
                          </p>
                        </div>
                      )}
                      {selectedContract.preferred_payment_day && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dia Preferido para Pagamento</label>
                          <p className="text-sm text-gray-900 dark:text-white">Dia {selectedContract.preferred_payment_day} de cada mês</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observações Personalizadas */}
                {selectedContract.custom_notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Observações Personalizadas
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {selectedContract.custom_notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Data de Cadastro */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Informações do Sistema
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Cadastro</label>
                      <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedContract.created_at)}</p>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedContract.status)}`}>
                        {getStatusText(selectedContract.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {showEditModal && editingContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Contrato</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingContract(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Desconto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editingContract.discount_percentage || 0}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      discount_percentage: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Preço Ajustado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preço Final Ajustado
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingContract.adjusted_price || editingContract.final_price || editingContract.package_price || 0}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      adjusted_price: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Observações Personalizadas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações Personalizadas
                  </label>
                  <textarea
                    rows={4}
                    value={editingContract.custom_notes || ''}
                    onChange={(e) => setEditingContract({
                      ...editingContract,
                      custom_notes: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observações que aparecerão no contrato..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingContract(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEditedContract}
                  disabled={savingEdit}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  {savingEdit ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{savingEdit ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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