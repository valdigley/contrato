import React, { useState, useEffect } from 'react';
import { User, FileText, DollarSign, Calendar, Settings, LogOut, Users, Package, CreditCard, UserCircle, Plus, Eye, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  user: User | null;
  onNavigate: (view: string) => void;
}

interface DashboardStats {
  totalContracts: number;
  totalRevenue: number;
  pendingContracts: number;
  completedContracts: number;
}

interface RecentContract {
  id: string;
  nome_completo: string;
  tipo_evento: string;
  final_price: number;
  created_at: string;
  status: string;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    totalRevenue: 0,
    pendingContracts: 0,
    completedContracts: 0
  });
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar todos os contratos
      const { data: contracts, error: contractsError } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) throw contractsError;

      // Calcular estatísticas
      const totalContracts = contracts?.length || 0;
      const totalRevenue = contracts?.reduce((sum, contract) => sum + (contract.final_price || 0), 0) || 0;
      const pendingContracts = contracts?.filter(c => c.status === 'draft' || c.status === 'sent').length || 0;
      const completedContracts = contracts?.filter(c => c.status === 'signed').length || 0;

      setStats({
        totalContracts,
        totalRevenue,
        pendingContracts,
        completedContracts
      });

      // Contratos recentes (últimos 5)
      setRecentContracts(contracts?.slice(0, 5) || []);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Bem-vindo, {user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserCircle className="h-5 w-5" />
                <span>Perfil</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Configurações</span>
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-red-600 hover:text-red-900 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalContracts}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
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
                <p className="text-3xl font-bold text-gray-900">{stats.pendingContracts}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completedContracts}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onNavigate('form')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Novo Contrato</span>
              </button>
              
              <button
                onClick={() => onNavigate('contracts')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Ver Contratos</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Pacotes</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="h-8 w-8 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Pagamentos</span>
              </button>
            </div>
          </div>

          {/* Recent Contracts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contratos Recentes</h2>
              <button
                onClick={() => onNavigate('contracts')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos
              </button>
            </div>
            
            {recentContracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum contrato encontrado</p>
                <button
                  onClick={() => onNavigate('form')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Criar primeiro contrato
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{contract.nome_completo}</p>
                      <p className="text-sm text-gray-600">{contract.tipo_evento}</p>
                      <p className="text-xs text-gray-500">{formatDate(contract.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(contract.final_price || 0)}
                      </p>
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

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => onNavigate('contracts')}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contratos</h3>
                <p className="text-gray-600">Gerencie todos os seus contratos</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('settings')}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
                <p className="text-gray-600">Configure pacotes e pagamentos</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('profile')}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 rounded-full p-3">
                <UserCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Perfil</h3>
                <p className="text-gray-600">Gerencie suas informações</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}