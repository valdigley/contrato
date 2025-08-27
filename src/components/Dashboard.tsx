import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  Plus, 
  List, 
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
  Percent,
  DollarSign,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

interface Stats {
  totalContracts: number;
  pendingContracts: number;
  completedContracts: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageContractValue: number;
}

interface RecentContract {
  id: string;
  nome_completo: string;
  tipo_evento: string;
  created_at: string;
  status?: string;
  final_price?: number;
  package_price?: number;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<Stats>({
    totalContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageContractValue: 0
  });
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    business_name: '',
    phone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
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

      // Calculate stats
      const totalContracts = contracts?.length || 0;
      const pendingContracts = contracts?.filter(c => c.status === 'draft' || c.status === 'sent').length || 0;
      const completedContracts = contracts?.filter(c => c.status === 'signed').length || 0;
      
      const totalRevenue = contracts?.reduce((sum, contract) => {
        const price = contract.final_price || contract.package_price || 0;
        return sum + Number(price);
      }, 0) || 0;

      // Monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = contracts?.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear;
      }).reduce((sum, contract) => {
        const price = contract.final_price || contract.package_price || 0;
        return sum + Number(price);
      }, 0) || 0;

      const averageContractValue = totalContracts > 0 ? totalRevenue / totalContracts : 0;

      setStats({
        totalContracts,
        pendingContracts,
        completedContracts,
        totalRevenue,
        monthlyRevenue,
        averageContractValue
      });

      // Get recent contracts (last 5)
      const recentContracts = contracts
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || [];

      setRecentContracts(recentContracts);

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Contratos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalContracts}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contratos Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingContracts}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contratos Assinados</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedContracts}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receita Total</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receita Mensal</h3>
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.monthlyRevenue)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mês atual</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Médio</h3>
              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.averageContractValue)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Por contrato</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            onClick={() => onNavigate('contracts')}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg p-6 text-left transition-colors hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <List className="h-8 w-8" />
              <span className="text-sm opacity-75">Gerenciar</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Ver Contratos</h3>
            <p className="text-green-100 dark:text-green-200">Gerenciar contratos existentes</p>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg p-6 text-left transition-colors hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <User className="h-8 w-8" />
              <span className="text-sm opacity-75">Configurar</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Meu Perfil</h3>
            <p className="text-purple-100 dark:text-purple-200">Gerenciar informações pessoais</p>
          </button>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contratos Recentes</h3>
              <button
                onClick={() => onNavigate('contracts')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Ver todos
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {recentContracts.length === 0 ? (
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