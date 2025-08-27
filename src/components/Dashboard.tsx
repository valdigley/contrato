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
  BarChart3,
  Check,
  Link
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
  contractsThisMonth: number;
  averageContractValue: number;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedEvents: 0,
    recentContracts: [],
    contractsThisMonth: 0,
    averageContractValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getUniqueEventTypes = () => {
    const uniqueTypes = new Set(stats.recentContracts.map(c => c.tipo_evento));
    return uniqueTypes.size;
  };

  const copyClientLink = () => {
    // Implementation for copying client link
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const loadDashboardData = async () => {
    try {
      // Inicializar com zeros
      setStats({
        totalContracts: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        completedEvents: 0,
        recentContracts: [],
        contractsThisMonth: 0,
        averageContractValue: 0
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

          const contractsThisMonth = contracts
            .filter(c => {
              const createdDate = new Date(c.created_at);
              return createdDate.getMonth() === currentMonth && 
                     createdDate.getFullYear() === currentYear;
            }).length;

          const totalValue = contracts.reduce((sum, c) => sum + Number(c.final_price || c.package_price || 0), 0);
          const averageContractValue = contracts.length > 0 ? totalValue / contracts.length : 0;

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
            recentContracts: contracts.slice(0, 5),
            contractsThisMonth,
            averageContractValue
          });
        } else {
          // Se não há contratos, manter tudo zerado
          setStats({
            totalContracts: 0,
            monthlyRevenue: 0,
            pendingPayments: 0,
            completedEvents: 0,
            recentContracts: [],
            contractsThisMonth: 0,
            averageContractValue: 0
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
        recentContracts: [],
        contractsThisMonth: 0,
        averageContractValue: 0
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
            <div className="flex items-center space-x-4">
              {/* Settings access - requires double click */}
              <button
                onDoubleClick={() => onNavigate('settings')}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/30 transition-all"
                title="Duplo clique para configurações"
              >
                <Settings className="h-4 w-4" />
              </button>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('form')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Contrato</span>
            </button>
            <button
              onClick={() => {
                const getPhotographerId = async () => {
                  try {
                    console.log('Buscando photographer_id para o usuário:', user?.id);
                    const { data: photographerData } = await supabase
                      .from('photographers')
                      .select('id')
                      .eq('user_id', user?.id)
                      .single();
                    
                    console.log('Dados do fotógrafo encontrados:', photographerData);
                    
                    if (photographerData) {
                      const clientLink = `${window.location.origin}?client=true&photographer_id=${photographerData.id}`;
                      console.log('Link gerado:', clientLink);
                      navigator.clipboard.writeText(clientLink);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2000);
                    } else {
                      console.error('Nenhum perfil de fotógrafo encontrado para o usuário:', user?.id);
                      alert('Erro: Perfil de fotógrafo não encontrado. Crie seu perfil primeiro.');
                    }
                  } catch (error) {
                    console.error('Erro ao obter photographer_id:', error);
                    alert('Erro ao gerar link do cliente');
                  }
                };
                getPhotographerId();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title={linkCopied ? 'Link Copiado!' : 'Copiar Link para Cliente'}
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
              <span>{linkCopied ? 'Link Copiado!' : 'Link Cliente'}</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Total: {stats.totalContracts} contrato{stats.totalContracts !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Recent Contracts */}
        {stats.recentContracts.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Todos os Contratos</h2>
                <span className="text-sm text-gray-500">{stats.recentContracts.length} contrato{stats.recentContracts.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentContracts.map((contract) => (
                  <div key={contract.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{contract.nome_completo}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            contract.tipo_evento === 'Casamento' ? 'bg-pink-100 text-pink-800' :
                            contract.tipo_evento === 'Aniversário' ? 'bg-yellow-100 text-yellow-800' :
                            contract.tipo_evento === 'Ensaio Fotográfico' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {contract.tipo_evento}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <span>📧</span>
                            <span>{contract.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>📱</span>
                            <span>{contract.whatsapp ? contract.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>🏙️</span>
                            <span>{contract.cidade}</span>
                          </div>
                          {contract.data_evento && (
                            <div className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{formatDate(contract.data_evento)}</span>
                            </div>
                          )}
                        </div>
                        {(contract.nome_noivos || contract.nome_aniversariante) && (
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="font-medium">
                              {contract.nome_noivos ? `Noivos: ${contract.nome_noivos}` : ''}
                              {contract.nome_aniversariante ? `Aniversariante: ${contract.nome_aniversariante}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-green-600">
                          {formatCurrency(contract.final_price || contract.package_price || 0)}
                        </p>
                        <p className="text-xs text-gray-500">Cadastrado em</p>
                        <p className="text-sm text-gray-600">{formatDate(contract.created_at)}</p>
                      </div>
                    </div>
                    {contract.local_festa && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <span>📍</span>
                          <span className="font-medium">Local:</span>
                          <span>{contract.local_festa}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contratos</h2>
            </div>
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <FileText className="w-12 h-12 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato ainda</h3>
              <p className="text-gray-600 mb-4">Comece criando seu primeiro contrato</p>
              <button
                onClick={() => onNavigate('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Criar Primeiro Contrato
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}