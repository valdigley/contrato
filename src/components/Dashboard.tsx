import React, { useState, useEffect } from 'react';
import { User, FileText, Calendar, DollarSign, Settings, LogOut, Plus, Eye, BarChart3, Users, Camera, Link, Copy, Check } from 'lucide-react';
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
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    totalRevenue: 0
  });
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
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
      const totalRevenue = contracts?.reduce((sum, contract) => {
        return sum + (Number(contract.final_price) || Number(contract.package_price) || 0);
      }, 0) || 0;

      setStats({
        totalContracts,
        pendingContracts,
        completedContracts,
        totalRevenue
      });

      // Set recent contracts (last 5)
      setRecentContracts(contracts?.slice(0, 5) || []);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyClientLink = () => {
    const clientLink = `${window.location.origin}?client=true&photographer_id=${user?.id}`;
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-2">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gerenciador de Contratos</h1>
                <p className="text-sm text-gray-600">Bem-vindo, {user?.user_metadata?.name || user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-red-600 hover:text-red-900 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
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
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingContracts}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedContracts}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate('form')}
                  className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                >
                  <div className="bg-blue-600 rounded-full p-2 group-hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Novo Contrato</p>
                    <p className="text-sm text-gray-600">Criar um novo contrato</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('contracts')}
                  className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
                >
                  <div className="bg-green-600 rounded-full p-2 group-hover:bg-green-700 transition-colors">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Ver Contratos</p>
                    <p className="text-sm text-gray-600">Gerenciar contratos existentes</p>
                  </div>
                </button>

                <button
                  onClick={copyClientLink}
                  className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
                >
                  <div className="bg-purple-600 rounded-full p-2 group-hover:bg-purple-700 transition-colors">
                    {linkCopied ? <Check className="h-5 w-5 text-white" /> : <Link className="h-5 w-5 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {linkCopied ? 'Link Copiado!' : 'Link do Cliente'}
                    </p>
                    <p className="text-sm text-gray-600">Copiar link para clientes</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('settings')}
                  className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                >
                  <div className="bg-gray-600 rounded-full p-2 group-hover:bg-gray-700 transition-colors">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Configurações</p>
                    <p className="text-sm text-gray-600">Configurar sistema</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Link para Clientes</h2>
            <p className="text-sm text-gray-600 mb-4">
              Compartilhe este link com seus clientes para que eles possam preencher os dados do contrato:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
              <p className="text-xs text-gray-500 break-all">
                {window.location.origin}?client=true&photographer_id={user?.id}
              </p>
            </div>
            <button
              onClick={copyClientLink}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                linkCopied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{linkCopied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>

        {/* Recent Contracts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Contratos Recentes</h2>
              <button
                onClick={() => onNavigate('contracts')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos
              </button>
            </div>
          </div>
          
          {recentContracts.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro contrato</p>
              <button
                onClick={() => onNavigate('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Criar Primeiro Contrato
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
                      Tipo de Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.nome_completo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {contract.tipo_evento}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contract.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(Number(contract.final_price) || Number(contract.package_price) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}