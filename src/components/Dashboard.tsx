import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, TrendingUp, Plus, List, Settings, User, LogOut, FileText, Camera, Sun, Moon, Edit2, Save, X, Percent } from 'lucide-react';
import { DollarSign, Phone } from 'lucide-react';
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
import { BarChart3, Users, Calendar, TrendingUp, Plus, List, Settings, User, LogOut, FileText, Camera, Sun, Moon, Edit2, Save, X, Percent, DollarSign, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ContractData } from '../types';

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
  contractsThisYear: number;
  monthlyContractsValue: number;
  yearlyContractsValue: number;
}

interface ContractEdit {
  discount_percentage: number;
  custom_notes: string;
  adjusted_price: number;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedEvents: 0,
    recentContracts: [],
    contractsThisMonth: 0,
    averageContractValue: 0,
    contractsThisYear: 0,
    monthlyContractsValue: 0,
    yearlyContractsValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [generatedContract, setGeneratedContract] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [editingContract, setEditingContract] = useState(false);
  const [contractEdit, setContractEdit] = useState<ContractEdit>({
    discount_percentage: 0,
    custom_notes: '',
    adjusted_price: 0
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const updateContractStatus = async (contractId: string, status: 'sent' | 'signed') => {
    try {
      const { error } = await supabase
        .from('contratos')
        .update({ status })
        .eq('id', contractId);

      if (error) throw error;

      // Update local state
      setStats(prev => ({
        ...prev,
        recentContracts: prev.recentContracts.map(contract =>
          contract.id === contractId ? { ...contract, status } : contract
        )
      }));

      console.log(`Contrato ${contractId} marcado como ${status}`);
    } catch (error) {
      console.error('Erro ao atualizar status do contrato:', error);
      alert('Erro ao atualizar status do contrato');
    }
  };

  const saveContractEdits = async () => {
    if (!selectedContract) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('contratos')
        .update({
          discount_percentage: contractEdit.discount_percentage,
          custom_notes: contractEdit.custom_notes,
          adjusted_price: contractEdit.adjusted_price
        })
        .eq('id', selectedContract.id);

      if (error) throw error;

      // Update local state
      setStats(prev => ({
        ...prev,
        recentContracts: prev.recentContracts.map(contract =>
          contract.id === selectedContract.id 
            ? { 
                ...contract, 
                discount_percentage: contractEdit.discount_percentage,
                custom_notes: contractEdit.custom_notes,
                adjusted_price: contractEdit.adjusted_price
              } 
            : contract
        )
      }));

      setSelectedContract(prev => ({
        ...prev,
        discount_percentage: contractEdit.discount_percentage,
        custom_notes: contractEdit.custom_notes,
        adjusted_price: contractEdit.adjusted_price
      }));

      setEditingContract(false);
      alert('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      alert('Erro ao salvar alterações');
    } finally {
      setSavingEdit(false);
    }
  };

  const startEditingContract = () => {
    if (!selectedContract) return;
    
    const originalPrice = selectedContract.final_price || selectedContract.package_price || 0;
    
    setContractEdit({
      discount_percentage: selectedContract.discount_percentage || 0,
      custom_notes: selectedContract.custom_notes || '',
      adjusted_price: selectedContract.adjusted_price || originalPrice
    });
    setEditingContract(true);
  };

  const calculateAdjustedPrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100);
  };

  const handleDiscountChange = (discount: number) => {
    const originalPrice = selectedContract?.final_price || selectedContract?.package_price || 0;
    const adjustedPrice = calculateAdjustedPrice(originalPrice, discount);
    
    setContractEdit(prev => ({
      ...prev,
      discount_percentage: discount,
      adjusted_price: adjustedPrice
    }));
  };

  const sendWhatsAppContract = (contract: any, contractText?: string) => {
    const phone = contract.whatsapp.replace(/\D/g, '');
    const clientName = contract.nome_completo;
    const eventType = contract.tipo_evento;
    
    let message = `Olá ${clientName}! 👋\n\n`;
    message += `Segue o contrato para seu ${eventType}:\n\n`;
    
    if (contractText) {
      // Se temos o texto do contrato, incluir uma versão resumida
      message += `📋 *CONTRATO DE PRESTAÇÃO DE SERVIÇOS*\n\n`;
      message += `Cliente: ${clientName}\n`;
      message += `Evento: ${eventType}\n`;
      if (contract.data_evento) {
        message += `Data: ${formatDate(contract.data_evento)}\n`;
      }
      if (contract.final_price || contract.package_price) {
        message += `Valor: R$ ${(contract.final_price || contract.package_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      }
      message += `\n📄 O contrato completo será enviado por email ou pode ser retirado pessoalmente.\n\n`;
    }
    
    message += `Para confirmar, responda este WhatsApp! 📱\n\n`;
    message += `Obrigado! 😊`;
    
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const fetchAllContracts = async () => {
    // Implementation for fetching all contracts
  };

  useEffect(() => {
    loadDashboardData();
    fetchAllContracts();
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
        averageContractValue: 0,
        contractsThisYear: 0,
        monthlyContractsValue: 0,
        yearlyContractsValue: 0
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

          // Contratos do mês atual
          const monthlyContracts = contracts
            .filter(c => {
              const createdDate = new Date(c.created_at);
              return createdDate.getMonth() === currentMonth && 
                     createdDate.getFullYear() === currentYear;
            });

          // Contratos do ano atual
          const yearlyContracts = contracts
            .filter(c => {
              const createdDate = new Date(c.created_at);
              return createdDate.getFullYear() === currentYear;
            });

          // Calcular valores mensais
          const monthlyContractsValue = monthlyContracts
            .reduce((sum, c) => sum + Number(c.adjusted_price || c.final_price || c.package_price || 0), 0);

          // Calcular valores anuais
          const yearlyContractsValue = yearlyContracts
            .reduce((sum, c) => sum + Number(c.adjusted_price || c.final_price || c.package_price || 0), 0);

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
            monthlyRevenue: monthlyContractsValue,
            pendingPayments: realPendingPayments,
            completedEvents: realCompletedEvents,
            recentContracts: contracts.slice(0, 5),
            contractsThisMonth: monthlyContracts.length,
            averageContractValue,
            contractsThisYear: yearlyContracts.length,
            monthlyContractsValue,
            yearlyContractsValue
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
            averageContractValue: 0,
            contractsThisYear: 0,
            monthlyContractsValue: 0,
            yearlyContractsValue: 0
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
        averageContractValue: 0,
        contractsThisYear: 0,
        monthlyContractsValue: 0,
        yearlyContractsValue: 0
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
      
      // Add custom notes if available
      if (contract.custom_notes) {
        contractContent = contractContent.replace(/\{\{custom_notes\}\}/g, contract.custom_notes);
      }
      
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
        
        // Use adjusted price if available, otherwise use original price
        const finalPrice = contract.adjusted_price || contract.final_price || contract.package_price || packageData.price;
        contractContent = contractContent.replace(/\{\{package_price\}\}/g, 
          `R$ ${finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        // Add discount information if applicable
        if (contract.discount_percentage > 0) {
          const originalPrice = contract.final_price || contract.package_price || packageData.price;
          contractContent = contractContent.replace(/\{\{discount_info\}\}/g, 
            `Desconto aplicado: ${contract.discount_percentage}% (Valor original: R$ ${originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
        } else {
          contractContent = contractContent.replace(/\{\{discount_info\}\}/g, '');
        }
        
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Bem-vindo, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all"
                title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              >
                {theme === 'light' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              
              {/* Settings access - requires double click */}
              <button
                onDoubleClick={() => onNavigate('settings')}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all"
                title="Duplo clique para configurações"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-4 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md p-4 border border-white/20 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{contracts.length} contratos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  R$ {(contracts.reduce((sum, c) => sum + Number(c.final_price || c.package_price || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md p-4 border border-white/20 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Este Mês</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.contractsThisMonth} contratos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  R$ {stats.monthlyContractsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">valor total</p>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md p-4 border border-white/20 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-2">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Este Ano</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.contractsThisYear} contratos</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  R$ {stats.yearlyContractsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">valor médio</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('form')}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title={linkCopied ? 'Link Copiado!' : 'Copiar Link para Cliente'}
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
              <span>{linkCopied ? 'Link Copiado!' : 'Link Cliente'}</span>
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total: {stats.totalContracts} contrato{stats.totalContracts !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Recent Contracts */}
        {stats.recentContracts.length > 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Todos os Contratos</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">{stats.recentContracts.length} contrato{stats.recentContracts.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentContracts.map((contract) => (
                  <div key={contract.id} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200">
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowModal(true);
                      }}
                    >
                      <div className="grid grid-cols-5 gap-4 items-center">
                        {/* Nome do Cliente */}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{contract.nome_completo}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            contract.tipo_evento === 'Casamento' ? 'bg-pink-100 text-pink-800' :
                            contract.tipo_evento === 'Aniversário' ? 'bg-yellow-100 text-yellow-800' :
                            contract.tipo_evento === 'Ensaio Fotográfico' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {contract.tipo_evento}
                          </span>
                        </div>

                        {/* Data do Evento */}
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {contract.data_evento ? formatDate(contract.data_evento) : 'Data não definida'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Data do Evento</div>
                        </div>

                        {/* Cidade */}
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{contract.cidade}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Cidade</div>
                        </div>

                        {/* Pacote */}
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {contract.package_id ? 'Pacote Selecionado' : 'Sem Pacote'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Pacote</div>
                        </div>

                        {/* Valor */}
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {(contract.adjusted_price || contract.final_price || contract.package_price) 
                              ? formatCurrency(contract.adjusted_price || contract.final_price || contract.package_price)
                              : 'Valor não definido'
                            }
                          </div>
                          {contract.discount_percentage > 0 && (
                            <div className="text-xs text-red-500 dark:text-red-400">
                              {contract.discount_percentage}% desconto
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">Valor</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum contrato encontrado</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Comece criando seu primeiro contrato</p>
            <button
              onClick={() => onNavigate('form')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Criar Primeiro Contrato</span>
            </button>
          </div>
        )}

        {/* Contract Details Modal */}
        {showModal && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Contrato</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Dados Pessoais</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nome Completo</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.nome_completo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">CPF</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.cpf}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">WhatsApp</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.whatsapp}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Data de Nascimento</label>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedContract.data_nascimento)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Endereço</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.endereco}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Cidade</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.cidade}</p>
                    </div>
                  </div>

                  {/* Dados do Evento */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">Dados do Evento</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Tipo de Evento</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.tipo_evento}</p>
                    </div>
                    {selectedContract.data_evento && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Data do Evento</label>
                        <p className="text-gray-900 dark:text-white">{formatDate(selectedContract.data_evento)}</p>
                      </div>
                    )}
                    {selectedContract.horario_evento && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Horário</label>
                        <p className="text-gray-900 dark:text-white">{selectedContract.horario_evento}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Local da Festa</label>
                      <p className="text-gray-900 dark:text-white">{selectedContract.local_festa}</p>
                    </div>
                    {selectedContract.nome_noivos && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nome dos Noivos</label>
                        <p className="text-gray-900 dark:text-white">{selectedContract.nome_noivos}</p>
                      </div>
                    )}
                    {selectedContract.nome_aniversariante && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nome do Aniversariante</label>
                        <p className="text-gray-900 dark:text-white">{selectedContract.nome_aniversariante}</p>
                      </div>
                    )}
                    {(selectedContract.final_price || selectedContract.package_price) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Valor</label>
                        {editingContract ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Valor Original
                              </label>
                              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {formatCurrency(selectedContract.final_price || selectedContract.package_price)}
                              </p>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Desconto (%)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={contractEdit.discount_percentage}
                                onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Valor Final
                              </label>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(contractEdit.adjusted_price)}
                              </p>
                              {contractEdit.discount_percentage > 0 && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                  Desconto de {contractEdit.discount_percentage}% aplicado
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(selectedContract.adjusted_price || selectedContract.final_price || selectedContract.package_price)}
                            </p>
                            {selectedContract.discount_percentage > 0 && (
                              <p className="text-xs text-red-600 dark:text-red-400">
                                Desconto de {selectedContract.discount_percentage}% aplicado
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Observações Personalizadas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Observações Personalizadas
                      </label>
                      {editingContract ? (
                        <textarea
                          value={contractEdit.custom_notes}
                          onChange={(e) => setContractEdit(prev => ({ ...prev, custom_notes: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Adicione observações personalizadas que aparecerão no contrato..."
                        />
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 min-h-[80px]">
                          {selectedContract.custom_notes ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {selectedContract.custom_notes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              Nenhuma observação personalizada
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status do Contrato */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status do Contrato</label>
                      <select
                        value={selectedContract.status || 'draft'}
                        onChange={(e) => {
                          updateContractStatus(selectedContract.id, e.target.value as 'draft' | 'sent' | 'signed' | 'cancelled');
                          setSelectedContract({...selectedContract, status: e.target.value});
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">📝 Rascunho</option>
                        <option value="sent">📤 Enviado</option>
                        <option value="signed">✓ Assinado</option>
                        <option value="cancelled">❌ Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex justify-between">
                  <div className="flex space-x-4">
                    {editingContract ? (
                      <>
                        <button
                          onClick={saveContractEdits}
                          disabled={savingEdit}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-green-300 dark:disabled:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          {savingEdit ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span>{savingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                        </button>
                        <button
                          onClick={() => setEditingContract(false)}
                          className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <span>Cancelar</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={startEditingContract}
                          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>Editar Contrato</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        generateContract(selectedContract);
                        setShowModal(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Gerar Contrato</span>
                    </button>
                    <button
                      onClick={() => sendWhatsAppContract(selectedContract)}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este contrato?')) {
                          deleteContract(selectedContract.id);
                          setShowModal(false);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
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

        {/* Contract Generation Modal */}
        {showContractModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contrato Gerado</h2>
                  <button
                    onClick={() => setShowContractModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {generatedContract}
                  </pre>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={downloadContract}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={printContract}
                    className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={() => sendWhatsAppContract(selectedContract)}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Enviar WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowContractModal(false);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
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
  );
}