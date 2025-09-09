import React, { useState, useEffect } from 'react';
import { User, FileText, DollarSign, Calendar, Settings, LogOut, Plus, List, BarChart3, UserCircle, Building2, Phone, Mail, MapPin, Clock, TrendingUp, Users, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

interface BusinessInfo {
  id: string;
  name: string;
  address?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  state?: string;
  instagram?: string;
  document?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [stats, setStats] = useState({
    totalContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    totalRevenue: 0,
    thisMonthRevenue: 0,
    recentContracts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching business info:', error);
      } else {
        setBusinessInfo(data);
      }
    } catch (error) {
      console.error('Error loading business info:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contratos')
        .select('*');

      if (contractsError) {
        console.error('Error fetching contracts:', contractsError);
        return;
      }

      const totalContracts = contracts?.length || 0;
      const pendingContracts = contracts?.filter(c => c.status === 'draft' || c.status === 'sent').length || 0;
      const completedContracts = contracts?.filter(c => c.status === 'signed').length || 0;
      
      // Calculate revenue
      const totalRevenue = contracts?.reduce((sum, contract) => {
        const price = contract.adjusted_price || contract.final_price || contract.package_price || 0;
        return sum + price;
      }, 0) || 0;

      // This month revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthRevenue = contracts?.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear;
      }).reduce((sum, contract) => {
        const price = contract.adjusted_price || contract.final_price || contract.package_price || 0;
        return sum + price;
      }, 0) || 0;

      // Recent contracts (last 5)
      const recentContracts = contracts?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5) || [];

      setStats({
        totalContracts,
        pendingContracts,
        completedContracts,
        totalRevenue,
        thisMonthRevenue,
        recentContracts
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'signed':
        return 'text-green-600 bg-green-100';
      case 'sent':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'signed':
        return 'Assinado';
      case 'sent':
        return 'Enviado';
      default:
        return 'Rascunho';
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-2">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Sistema de Contratos</h1>
                <p className="text-sm text-gray-500">Dashboard Principal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('settings')}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={() => signOut()}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo{businessInfo?.name ? ` ao ${businessInfo.name}` : ' ao Sistema de Contratos'}!
              </h1>
              <p className="text-gray-600 mt-2">
                {businessInfo?.city && businessInfo?.state 
                  ? `${businessInfo.city}, ${businessInfo.state} • ` 
                  : ''
                }Gerencie seus contratos fotográficos de forma profissional
              </p>
              {businessInfo?.whatsapp && (
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {businessInfo.whatsapp}
                  {businessInfo.email && (
                    <>
                      <span className="mx-2">•</span>
                      <Mail className="h-4 w-4 mr-1" />
                      {businessInfo.email}
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Novo Contrato</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingContracts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedContracts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate('form')}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium text-gray-900">Criar Novo Contrato</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              
              <button
                onClick={() => onNavigate('contracts')}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <List className="h-5 w-5 text-green-600 mr-3" />
                  <span className="font-medium text-gray-900">Ver Todos os Contratos</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="font-medium text-gray-900">Configurações</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Receita Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Este Mês</span>
                <span className="font-semibold text-green-600">{formatCurrency(stats.thisMonthRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ticket Médio</span>
                <span className="font-semibold text-gray-900">
                  {stats.totalContracts > 0 ? formatCurrency(stats.totalRevenue / stats.totalContracts) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Contratos Recentes</h3>
              <button
                onClick={() => onNavigate('contracts')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todos
              </button>
            </div>
          </div>
          
          {stats.recentContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600">Comece criando seu primeiro contrato</p>
              <button
                onClick={() => onNavigate('form')}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Criar Contrato
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentContracts.map((contract: any) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{contract.nome_completo}</div>
                        <div className="text-sm text-gray-500">{contract.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contract.tipo_evento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(contract.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(contract.adjusted_price || contract.final_price || contract.package_price || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}