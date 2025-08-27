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
  Link,
  Eye,
  Trash2,
  Download
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
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [generatedContract, setGeneratedContract] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

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
      
      // Update local state
      setStats(prev => ({
        ...prev,
        recentContracts: prev.recentContracts.filter(c => c.id !== id),
        totalContracts: prev.totalContracts - 1
      }));
      
      alert('Contrato excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato');
    }
  };

  const generateContract = async (contract: any) => {
    try {
      // Load templates and packages if not loaded
      if (templates.length === 0 || packages.length === 0) {
        const [templatesResponse, packagesResponse] = await Promise.all([
          supabase.from('contract_templates').select('*').eq('is_active', true),
          supabase.from('packages').select('*').eq('is_active', true)
        ]);
        
        if (!templatesResponse.error) setTemplates(templatesResponse.data || []);
        if (!packagesResponse.error) setPackages(packagesResponse.data || []);
      }

      // Find template for event type
      const template = templates.find(t => t.event_type_id === contract.event_type_id);
      
      if (!template) {
        alert('Modelo de contrato não encontrado para este tipo de evento');
        return;
      }

      // Find package data
      const packageData = contract.package_id 
        ? packages.find(p => p.id === contract.package_id)
        : null;

      // Replace variables in template
      let contractContent = template.content;
      
      // Personal data
      contractContent = contractContent.replace(/\{\{nome_completo\}\}/g, contract.nome_completo);
      contractContent = contractContent.replace(/\{\{cpf\}\}/g, contract.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
      contractContent = contractContent.replace(/\{\{email\}\}/g, contract.email);
      contractContent = contractContent.replace(/\{\{whatsapp\}\}/g, contract.whatsapp ? contract.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : '');
      contractContent = contractContent.replace(/\{\{endereco\}\}/g, contract.endereco);
      contractContent = contractContent.replace(/\{\{cidade\}\}/g, contract.cidade);
      contractContent = contractContent.replace(/\{\{data_nascimento\}\}/g, formatDate(contract.data_nascimento));
      
      // Event data
      contractContent = contractContent.replace(/\{\{tipo_evento\}\}/g, contract.tipo_evento);
      contractContent = contractContent.replace(/\{\{data_evento\}\}/g, contract.data_evento ? formatDate(contract.data_evento) : '');
      contractContent = contractContent.replace(/\{\{horario_evento\}\}/g, contract.horario_evento || '');
      contractContent = contractContent.replace(/\{\{local_festa\}\}/g, contract.local_festa);
      
      // Optional data
      if (contract.nome_noivos) {
        contractContent = contractContent.replace(/\{\{nome_noivos\}\}/g, contract.nome_noivos);
      }
      if (contract.nome_aniversariante) {
        contractContent = contractContent.replace(/\{\{nome_aniversariante\}\}/g, contract.nome_aniversariante);
      }
      if (contract.local_pre_wedding) {
        contractContent = contractContent.replace(/\{\{local_pre_wedding\}\}/g, contract.local_pre_wedding);
      }
      if (contract.local_making_of) {
        contractContent = contractContent.replace(/\{\{local_making_of\}\}/g, contract.local_making_of);
      }
      if (contract.local_cerimonia) {
        contractContent = contractContent.replace(/\{\{local_cerimonia\}\}/g, contract.local_cerimonia);
      }
      
      // Package data
      if (packageData) {
        contractContent = contractContent.replace(/\{\{package_name\}\}/g, packageData.name);
        contractContent = contractContent.replace(/\{\{package_price\}\}/g, 
          `R$ ${(contract.package_price || packageData.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        // Package features
        if (packageData.features && packageData.features.length > 0) {
          const featuresList = packageData.features.map((f: string) => `• ${f}`).join('\n');
          contractContent = contractContent.replace(/\{\{package_features\}\}/g, featuresList);
        }
      }
      
      // Remove unreplaced variables
      contractContent = contractContent.replace(/\{\{[^}]+\}\}/g, '');
      
      setGeneratedContract(contractContent);
      setShowContractModal(true);
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      alert('Erro ao gerar contrato');
    }
  };

  const downloadContract = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContract], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `contrato_${selectedContract?.nome_completo.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const printContract = () => {
    try {
      const printContent = `
        <html>
          <head>
            <title>Contrato - ${selectedContract?.nome_completo || 'Cliente'}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                margin: 40px; 
                color: #000;
                font-size: 14px;
              }
              h2 {
                text-align: center;
                margin-bottom: 30px;
                text-transform: uppercase;
              }
              .content {
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            <h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2>
            <div class="content">${generatedContract.replace(/</g, '<').replace(/>/g, '>')}</div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.onload = function() {
          printWindow.print();
          printWindow.close();
        };
      } else {
        alert('Por favor, permita pop-ups para imprimir o contrato.');
      }
    } catch (error) {
      console.error('Erro na impressão:', error);
      alert('Erro ao imprimir. Tente novamente.');
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
                    <div className="flex items-start justify-between mb-3 group">
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
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-lg text-green-600">
                              {formatCurrency(contract.final_price || contract.package_price || 0)}
                            </p>
                            <p className="text-xs text-gray-500">Cadastrado em</p>
                            <p className="text-sm text-gray-600">{formatDate(contract.created_at)}</p>
                          </div>
                          <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => generateContract(contract)}
                              className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors"
                              title="Gerar contrato"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteContract(contract.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 w-4" />
                            </button>
                          </div>
                        </div>
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
              
              {/* Contract Details Modal */}
              {showModal && selectedContract && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Detalhes do Contrato</h2>
                        <button
                          onClick={() => setShowModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Dados Pessoais */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Dados Pessoais
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                              <p className="text-sm text-gray-900">{selectedContract.nome_completo}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">CPF</label>
                              <p className="text-sm text-gray-900">{selectedContract.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                              <p className="text-sm text-gray-900">{formatDate(selectedContract.data_nascimento)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Cidade</label>
                              <p className="text-sm text-gray-900">{selectedContract.cidade}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700">Endereço</label>
                              <p className="text-sm text-gray-900">{selectedContract.endereco}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">E-mail</label>
                              <p className="text-sm text-gray-900">{selectedContract.email}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                              <p className="text-sm text-gray-900">{selectedContract.whatsapp ? selectedContract.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dados do Evento */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Dados do Evento
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Tipo de Evento</label>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedContract.tipo_evento === 'Casamento' ? 'bg-pink-100 text-pink-800' :
                                selectedContract.tipo_evento === 'Aniversário' ? 'bg-yellow-100 text-yellow-800' :
                                selectedContract.tipo_evento === 'Ensaio Fotográfico' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {selectedContract.tipo_evento}
                              </span>
                            </div>

                            {(selectedContract.data_evento || selectedContract.horario_evento) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedContract.data_evento && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Data do Evento</label>
                                    <p className="text-sm text-gray-900">{formatDate(selectedContract.data_evento)}</p>
                                  </div>
                                )}
                                {selectedContract.horario_evento && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Horário do Evento</label>
                                    <p className="text-sm text-gray-900">{selectedContract.horario_evento}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {selectedContract.nome_noivos && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Nome dos Noivos</label>
                                <p className="text-sm text-gray-900">{selectedContract.nome_noivos}</p>
                              </div>
                            )}

                            {selectedContract.nome_aniversariante && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Nome do(a) Aniversariante</label>
                                <p className="text-sm text-gray-900">{selectedContract.nome_aniversariante}</p>
                              </div>
                            )}

                            {selectedContract.local_festa && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  {selectedContract.tipo_evento === 'Ensaio Fotográfico' ? 'Local do Ensaio' : 'Local da Festa'}
                                </label>
                                <p className="text-sm text-gray-900">{selectedContract.local_festa}</p>
                              </div>
                            )}

                            {selectedContract.local_pre_wedding && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Local do Pré-Wedding</label>
                                <p className="text-sm text-gray-900">{selectedContract.local_pre_wedding}</p>
                              </div>
                            )}

                            {selectedContract.local_making_of && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Local do Making Of</label>
                                <p className="text-sm text-gray-900">{selectedContract.local_making_of}</p>
                              </div>
                            )}

                            {selectedContract.local_cerimonia && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Local da Cerimônia</label>
                                <p className="text-sm text-gray-900">{selectedContract.local_cerimonia}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dados Financeiros */}
                        {(selectedContract.package_price || selectedContract.final_price || selectedContract.preferred_payment_day) && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                              <DollarSign className="w-5 h-5 mr-2" />
                              Dados Financeiros
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                              {selectedContract.package_price && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Preço do Pacote</label>
                                  <p className="text-sm text-gray-900">
                                    R$ {Number(selectedContract.package_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              )}
                              {selectedContract.final_price && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Preço Final</label>
                                  <p className="text-sm text-gray-900">
                                    R$ {Number(selectedContract.final_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              )}
                              {selectedContract.preferred_payment_day && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Dia Preferido para Pagamento</label>
                                  <p className="text-sm text-gray-900">Dia {selectedContract.preferred_payment_day} de cada mês</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Data de Cadastro */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <Calendar className="w-5 h-5 mr-2" />
                            Informações do Sistema
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
                              <p className="text-sm text-gray-900">{formatDate(selectedContract.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setShowModal(false)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Contract Modal */}
              {showContractModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Contrato Gerado</h2>
                        <button
                          onClick={() => setShowContractModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg mb-6 max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm font-mono">{generatedContract}</pre>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={downloadContract}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar</span>
                        </button>
                        <button
                          onClick={printContract}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          onClick={() => setShowContractModal(false)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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