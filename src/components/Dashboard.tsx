import React, { useState, useEffect } from 'react';
import { FileText, Users, Calendar, DollarSign, Settings, User, LogOut, Plus, Eye, TrendingUp, Clock, CheckCircle, AlertTriangle, Link, Copy, Check, BarChart3, PieChart, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

interface DashboardStats {
  totalContracts: number;
  pendingContracts: number;
  completedContracts: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentContracts: any[];
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    recentContracts: []
  });
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [photographerId, setPhotographerId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get photographer profile for current user
      const { data: photographerData, error: photographerError } = await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (photographerError) {
        console.error('Erro ao buscar perfil do fotógrafo:', photographerError);
        setLoading(false);
        return;
      }

      setPhotographerId(photographerData.id);

      // Fetch contracts for this photographer
      const { data: contracts, error: contractsError } = await supabase
        .from('contratos')
        .select('*')
        .eq('photographer_id', photographerData.id)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('Erro ao buscar contratos:', contractsError);
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalContracts = contracts?.length || 0;
      const pendingContracts = contracts?.filter(c => c.status === 'draft' || c.status === 'sent').length || 0;
      const completedContracts = contracts?.filter(c => c.status === 'signed').length || 0;
      
      // Calculate revenue
      const totalRevenue = contracts?.reduce((sum, contract) => {
        const price = contract.final_price || contract.package_price || 0;
        return sum + Number(price);
      }, 0) || 0;

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = contracts?.filter(contract => {
        const contractDate = new Date(contract.created_at);
        return contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear;
      }).reduce((sum, contract) => {
        const price = contract.final_price || contract.package_price || 0;
        return sum + Number(price);
      }, 0) || 0;

      // Get recent contracts (last 5)
      const recentContracts = contracts?.slice(0, 5) || [];

      setStats({
        totalContracts,
        pendingContracts,
        completedContracts,
        totalRevenue,
        monthlyRevenue,
        recentContracts
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyClientLink = () => {
    if (!photographerId) {
      alert('ID do fotógrafo não encontrado');
      return;
    }
    
    const clientLink = `${window.location.origin}?client=true&photographer_id=${photographerId}`;
    navigator.clipboard.writeText(clientLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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

  const getEventTypeColor = (type: string) => {
    const colors = {
      'Casamento': 'bg-pink-100 text-pink-800 border border-pink-200',
      'Aniversário': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Ensaio Fotográfico': 'bg-purple-100 text-purple-800 border border-purple-200',
      'Formatura': 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciador de Contratos</h1>
                <p className="text-gray-600">Bem-vindo, {user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
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

          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
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

          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
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

          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* New Contract */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Novo Contrato</h3>
              <p className="text-gray-600 mb-4">Criar um novo contrato para cliente</p>
              <button
                onClick={() => onNavigate('form')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Criar Contrato
              </button>
            </div>
          </div>

          {/* View Contracts */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Eye className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ver Contratos</h3>
              <p className="text-gray-600 mb-4">Visualizar e gerenciar contratos existentes</p>
              <button
                onClick={() => onNavigate('contracts')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Ver Contratos
              </button>
            </div>
          </div>

          {/* Client Link */}
          <div className="bg-white rounded-lg shadow-sm p-6 hover-lift">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Link className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Link para Clientes</h3>
              <p className="text-gray-600 mb-4">Compartilhe este link com seus clientes</p>
              <button
                onClick={copyClientLink}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Contratos Recentes</h2>
            <button
              onClick={() => onNavigate('contracts')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>

          {stats.recentContracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro contrato</p>
              <button
                onClick={() => onNavigate('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Criar Primeiro Contrato
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentContracts.map((contract) => (
                <div key={contract.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">{contract.nome_completo}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(contract.tipo_evento)}`}>
                          {contract.tipo_evento}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>📧 {contract.email}</span>
                        <span>📱 {contract.whatsapp}</span>
                        {contract.data_evento && (
                          <span>📅 {formatDate(contract.data_evento)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {(contract.final_price || contract.package_price) && (
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(contract.final_price || contract.package_price)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatDate(contract.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Receita Mensal</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(stats.monthlyRevenue)}
              </div>
              <p className="text-gray-600">Este mês</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status dos Contratos</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Pendentes</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats.pendingContracts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Concluídos</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats.completedContracts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}