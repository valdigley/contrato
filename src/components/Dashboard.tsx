import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Calendar, 
  DollarSign, 
  Camera, 
  Settings,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut,
  User,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

interface DashboardStats {
  totalContracts: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedEvents: number;
  recentContracts: any[];
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedEvents: 0,
    recentContracts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getUniqueEventTypes = () => {
    const uniqueTypes = new Set(stats.recentContracts.map(c => c.tipo_evento));
    return uniqueTypes.size;
  };

  const loadDashboardData = async () => {
    try {
      // Inicializar com zeros
      setStats({
        totalContracts: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        completedEvents: 0,
        recentContracts: []
      });

      // Get photographer profile
      const { data: photographerData } = await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (photographerData) {
        // Get contracts
        const { data: contracts } = await supabase
          .from('contratos')
          .select('*')
          .eq('photographer_id', photographerData.id)
          .order('created_at', { ascending: false });

        if (contracts && contracts.length > 0) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // Calcular receita mensal REAL (apenas contratos do mês atual)
          const monthlyRevenue = contracts
            .filter(c => {
              const createdDate = new Date(c.created_at);
              return createdDate.getMonth() === currentMonth && 
                     createdDate.getFullYear() === currentYear;
            })
            .reduce((sum, c) => sum + Number(c.final_price || c.package_price || 0), 0);

          // Buscar pagamentos REAIS
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .in('contract_id', contracts.map(c => c.id));

          const realPendingPayments = payments ? 
            payments.filter(p => p.status === 'pending').length : 0;

          const realCompletedEvents = payments ? 
            payments.filter(p => p.status === 'paid').length : 0;

          setStats({
            totalContracts: contracts.length,
            monthlyRevenue,
            pendingPayments: realPendingPayments,
            completedEvents: realCompletedEvents,
            recentContracts: contracts.slice(0, 5)
          });
        } else {
          // Se não há contratos, manter tudo zerado
          setStats({
            totalContracts: 0,
            monthlyRevenue: 0,
            pendingPayments: 0,
            completedEvents: 0,
            recentContracts: []
          });
        }
      } else {
        // Se não há perfil de fotógrafo, manter tudo zerado
        console.log('Perfil de fotógrafo não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Em caso de erro, manter dados zerados
      setStats({
        totalContracts: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        completedEvents: 0,
        recentContracts: []
      });
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

  const modules = [
    {
      id: 'contracts',
      title: 'Contratos',
      description: 'Gerencie todos os seus contratos',
      icon: FileText,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      count: stats.totalContracts
    },
    {
      id: 'form',
      title: 'Novo Contrato',
      description: 'Criar um novo contrato',
      icon: Plus,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      count: null
    },
    {
      id: 'profile',
      title: 'Meu Perfil',
      description: 'Configurações do perfil',
      icon: User,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      count: null
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Configurações do sistema',
      icon: Settings,
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      count: null
    },
    {
      id: 'templates',
      title: 'Modelos',
      description: 'Templates de contratos',
      icon: FileText,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      count: null
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Bem-vindo, {user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white/50 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Este Mês</p>
                <p className="text-2xl font-bold text-green-600">{stats.contractsThisMonth}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tipos de Eventos</p>
                <p className="text-2xl font-bold text-purple-600">{getUniqueEventTypes()}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.averageContractValue)}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => onNavigate(module.id)}
                className={`${module.color} ${module.hoverColor} text-white rounded-xl shadow-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <IconComponent className="w-8 h-8" />
                  {module.count && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {module.count}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                <p className="text-white/80 text-sm">{module.description}</p>
              </button>
            );
          })}
        </div>

        {/* Recent Contracts */}
        {stats.recentContracts.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contratos Recentes</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{contract.nome_completo}</h3>
                      <p className="text-sm text-gray-600">{contract.tipo_evento}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(contract.final_price || contract.package_price || 0)}
                      </p>
                      <p className="text-sm text-gray-600">{formatDate(contract.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
      </div>
    </div>
  );
}