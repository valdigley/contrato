import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  Settings, 
  User, 
  LogOut, 
  Eye,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

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
  local_festa: string;
  nome_noivos?: string;
  nome_aniversariante?: string;
  package_price?: number;
  final_price?: number;
  created_at: string;
  status?: 'draft' | 'sent' | 'signed' | 'cancelled';
}

interface PhotographerData {
  business_name: string;
  phone: string;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [photographerData, setPhotographerData] = useState<PhotographerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Helper function to safely query tables
      const safeQuery = async (tableName: string, query: any) => {
        try {
          const result = await query;
          if (result.error) {
            // Handle specific Supabase errors
            if (result.error.code === 'PGRST205' || result.error.code === 'PGRST116') {
              console.info(`Table ${tableName} not found or empty, returning empty result`);
              return { data: tableName === 'contratos' ? [] : null, error: null };
            }
            throw result.error;
          }
          return result;
        } catch (error: any) {
          console.info(`Error querying ${tableName}:`, error.message);
          return { data: tableName === 'contratos' ? [] : null, error: null };
        }
      };

      // Fetch contracts
      const contractsResult = await safeQuery('contratos', 
        supabase
          .from('contratos')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (contractsResult.data) {
        setContracts(contractsResult.data);
      }

      // Fetch photographer data
      const photographerResult = await safeQuery('photographers',
        supabase
          .from('photographers')
          .select('business_name, phone')
          .eq('user_id', user.id)
          .single()
      );

      if (photographerResult.data) {
        setPhotographerData(photographerResult.data);
      }

    } catch (error) {
      console.info('Error fetching dashboard data:', error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-4 h-4" />;
      case 'sent':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'signed':
        return 'Assinado';
      case 'sent':
        return 'Enviado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Rascunho';
    }
  };

  // Filter contracts based on search and status
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tipo_evento.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === '' || contract.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalContracts = contracts.length;
  const signedContracts = contracts.filter(c => c.status === 'signed').length;
  const totalRevenue = contracts
    .filter(c => c.status === 'signed')
    .reduce((sum, c) => sum + (c.final_price || c.package_price || 0), 0);
  const pendingContracts = contracts.filter(c => !c.status || c.status === 'draft').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {photographerData?.business_name || 'Gerenciador de Contratos'}
                </h1>
                <p className="text-sm text-gray-500">Dashboard Principal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block">{user?.email}</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Configurações"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                <p className="text-2xl font-bold text-gray-900">{totalContracts}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Assinados</p>
                <p className="text-2xl font-bold text-green-600">{signedContracts}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingContracts}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate('form')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="bg-blue-600 rounded-lg p-2 group-hover:bg-blue-700 transition-colors">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Novo Contrato</p>
                <p className="text-sm text-gray-600">Criar contrato</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('contracts')}
              className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="bg-green-600 rounded-lg p-2 group-hover:bg-green-700 transition-colors">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Ver Contratos</p>
                <p className="text-sm text-gray-600">Gerenciar todos</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="bg-purple-600 rounded-lg p-2 group-hover:bg-purple-700 transition-colors">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Meu Perfil</p>
                <p className="text-sm text-gray-600">Editar dados</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <div className="bg-gray-600 rounded-lg p-2 group-hover:bg-gray-700 transition-colors">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Configurações</p>
                <p className="text-sm text-gray-600">Sistema</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Contratos Recentes</h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar contratos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos os status</option>
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviado</option>
                  <option value="signed">Assinado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {contracts.length === 0 
                    ? 'Comece criando seu primeiro contrato'
                    : 'Tente ajustar os filtros de busca'
                  }
                </p>
                {contracts.length === 0 && (
                  <button
                    onClick={() => onNavigate('form')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Criar Primeiro Contrato
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.slice(0, 10).map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {contract.nome_completo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contract.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {contract.tipo_evento}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.final_price || contract.package_price 
                          ? formatCurrency(contract.final_price || contract.package_price || 0)
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                          {getStatusIcon(contract.status)}
                          <span className="ml-1">{getStatusText(contract.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contract.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowContractModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredContracts.length > 10 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => onNavigate('contracts')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos os contratos ({contracts.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contract Details Modal */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Contrato</h2>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <p className="text-sm text-gray-900">{selectedContract.nome_completo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedContract.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                      <p className="text-sm text-gray-900">{selectedContract.whatsapp}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cidade</label>
                      <p className="text-sm text-gray-900">{selectedContract.cidade}</p>
                    </div>
                  </div>
                </div>

                {/* Event Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dados do Evento</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Evento</label>
                      <p className="text-sm text-gray-900">{selectedContract.tipo_evento}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Local</label>
                      <p className="text-sm text-gray-900">{selectedContract.local_festa}</p>
                    </div>
                    {selectedContract.nome_noivos && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Noivos</label>
                        <p className="text-sm text-gray-900">{selectedContract.nome_noivos}</p>
                      </div>
                    )}
                    {selectedContract.nome_aniversariante && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Aniversariante</label>
                        <p className="text-sm text-gray-900">{selectedContract.nome_aniversariante}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Info */}
                {(selectedContract.package_price || selectedContract.final_price) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações Financeiras</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {selectedContract.package_price && (
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-gray-700">Valor do Pacote</label>
                          <p className="text-sm text-gray-900">{formatCurrency(selectedContract.package_price)}</p>
                        </div>
                      )}
                      {selectedContract.final_price && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Valor Final</label>
                          <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedContract.final_price)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowContractModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}