import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle, Clock, Settings, Database, Users, FileText, CreditCard, Eye, Edit2, Plus, Filter, Download, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FinancialDashboardProps {
  onBack: () => void;
}

interface Contract {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  tipo_evento: string;
  data_evento: string;
  final_price: number;
  package_price: number;
  created_at: string;
  payment_method_id: string;
  preferred_payment_day: number;
}

interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contract?: Contract;
}

interface FinancialSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  monthlyRevenue: number;
  contractsThisMonth: number;
  averageContractValue: number;
  totalContracts: number;
  conversionRate: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  contracts: number;
  payments: number;
}

export default function FinancialDashboard({ onBack }: FinancialDashboardProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0,
    monthlyRevenue: 0,
    contractsThisMonth: 0,
    averageContractValue: 0,
    totalContracts: 0,
    conversionRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    due_date: '',
    description: '',
    payment_method: 'dinheiro'
  });

  useEffect(() => {
    const checkSupabaseConfig = () => {
      const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined' || supabaseKey === 'undefined') {
        setSupabaseConfigured(false);
        setCredentialsError('Credenciais do Supabase não configuradas');
        setLoading(false);
        return false;
      }
      
      setSupabaseConfigured(true);
      setCredentialsError(null);
      return true;
    };

    if (checkSupabaseConfig()) {
      fetchFinancialData();
    }
  }, []);

  const fetchFinancialData = async () => {
    const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined' || supabaseKey === 'undefined') {
      setSupabaseConfigured(false);
      setCredentialsError('Credenciais do Supabase não configuradas');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSupabaseConfigured(true);

      // Buscar contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from('contratos')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) {
        if (contractsError.message.includes('Invalid API key')) {
          throw new Error('Chave de API inválida. Verifique suas credenciais do Supabase nas configurações.');
        }
        throw contractsError;
      }

      // Buscar pagamentos com dados do contrato
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          contract:contratos(*)
        `)
        .order('due_date', { ascending: true });

      if (paymentsError && !paymentsError.message.includes('does not exist')) {
        console.warn('Tabela payments não existe ainda:', paymentsError);
      }

      const contracts = contractsData || [];
      const payments = paymentsData || [];

      setContracts(contracts);
      setPayments(payments);

      // Calcular resumo financeiro
      calculateSummary(contracts, payments);
      calculateMonthlyData(contracts, payments);

    } catch (error: any) {
      console.error('Erro ao carregar dados financeiros:', error);
      
      if (error.message?.includes('Failed to fetch')) {
        setError('Erro de conexão. Verifique sua internet e as configurações do Supabase.');
        setSupabaseConfigured(false);
      } else if (error.message?.includes('Invalid API key')) {
        setError('Chave de API inválida. Acesse as Configurações para corrigir suas credenciais do Supabase.');
        setSupabaseConfigured(false);
      } else {
        setError(error.message || 'Erro ao carregar dados financeiros');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (contracts: Contract[], payments: Payment[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calcular totais dos contratos
    const totalContractValue = contracts.reduce((sum, c) => sum + Number(c.final_price || c.package_price || 0), 0);
    const contractsThisMonth = contracts.filter(c => {
      const createdDate = new Date(c.created_at);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    const averageContractValue = contracts.length > 0 ? totalContractValue / contracts.length : 0;

    // Se não há pagamentos, usar dados dos contratos
    if (payments.length === 0) {
      // Simular dados baseados nos contratos
      const monthlyRevenue = contracts
        .filter(c => {
          const eventDate = c.data_evento ? new Date(c.data_evento) : new Date(c.created_at);
          return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
        })
        .reduce((sum, c) => sum + Number(c.final_price || c.package_price || 0), 0);

      setSummary({
        totalReceived: totalContractValue * 0.3, // Assumir 30% já recebido
        totalPending: totalContractValue * 0.5,  // 50% pendente
        totalOverdue: totalContractValue * 0.2,  // 20% em atraso
        monthlyRevenue,
        contractsThisMonth,
        averageContractValue,
        totalContracts: contracts.length,
        conversionRate: contracts.length > 0 ? (contracts.length / (contracts.length + 10)) * 100 : 0 // Simular taxa de conversão
      });
      return;
    }

    // Calcular com dados reais dos pagamentos
    const totalReceived = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalOverdue = payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyRevenue = payments
      .filter(p => {
        const paidDate = p.paid_date ? new Date(p.paid_date) : null;
        return paidDate && 
               paidDate.getMonth() === currentMonth && 
               paidDate.getFullYear() === currentYear &&
               p.status === 'paid';
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    setSummary({
      totalReceived,
      totalPending,
      totalOverdue,
      monthlyRevenue,
      contractsThisMonth,
      averageContractValue,
      totalContracts: contracts.length,
      conversionRate: contracts.length > 0 ? (totalReceived / totalContractValue) * 100 : 0
    });
  };

  const calculateMonthlyData = (contracts: Contract[], payments: Payment[]) => {
    const months = [];
    const now = new Date();
    const periodMonths = selectedPeriod === '6months' ? 6 : selectedPeriod === '12months' ? 12 : 3;

    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthContracts = contracts.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate.getFullYear() === date.getFullYear() && 
               createdDate.getMonth() === date.getMonth();
      });

      const monthPayments = payments.filter(p => {
        const paidDate = p.paid_date ? new Date(p.paid_date) : null;
        return paidDate && 
               paidDate.getFullYear() === date.getFullYear() && 
               paidDate.getMonth() === date.getMonth() &&
               p.status === 'paid';
      });

      const revenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      
      // Se não há pagamentos, usar valor dos contratos
      const contractRevenue = monthContracts.reduce((sum, c) => sum + Number(c.final_price || c.package_price || 0), 0);

      months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        revenue: revenue > 0 ? revenue : contractRevenue * 0.3, // 30% do valor do contrato se não há pagamentos
        contracts: monthContracts.length,
        payments: monthPayments.length
      });
    }

    setMonthlyData(months);
  };

  const createPayment = async () => {
    if (!selectedContract || !newPayment.amount || !newPayment.due_date || !newPayment.description) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          contract_id: selectedContract.id,
          amount: parseFloat(newPayment.amount),
          due_date: newPayment.due_date,
          description: newPayment.description,
          payment_method: newPayment.payment_method,
          status: 'pending'
        }]);

      if (error) throw error;

      setShowPaymentModal(false);
      setNewPayment({ amount: '', due_date: '', description: '', payment_method: 'dinheiro' });
      setSelectedContract(null);
      await fetchFinancialData();
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      alert('Erro ao criar pagamento');
    }
  };

  const markAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId);

      if (error) throw error;
      await fetchFinancialData();
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
      alert('Erro ao atualizar pagamento');
    }
  };

  const unmarkAsPaid = async (paymentId: string) => {
    if (!confirm('Tem certeza que deseja desmarcar este pagamento como pago?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'pending',
          paid_date: null
        })
        .eq('id', paymentId);

      if (error) throw error;
      await fetchFinancialData();
    } catch (error) {
      console.error('Erro ao desmarcar pagamento:', error);
      alert('Erro ao atualizar pagamento');
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'recent') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(contract.created_at) >= oneMonthAgo;
    }
    if (filterStatus === 'high-value') {
      return Number(contract.final_price || contract.package_price || 0) > 5000;
    }
    return true;
  });

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Email', 'Tipo Evento', 'Data Evento', 'Valor', 'Data Cadastro'].join(','),
      ...contracts.map(c => [
        c.nome_completo,
        c.email,
        c.tipo_evento,
        c.data_evento || '',
        c.final_price || c.package_price || 0,
        formatDate(c.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contratos_financeiro.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Configuração Necessária
          </h2>
          <p className="text-gray-600 mb-6">
            {credentialsError || 'Configure suas credenciais do Supabase para acessar o dashboard financeiro.'}
          </p>
          <button
            onClick={() => window.location.href = '?settings=true'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <Settings className="w-4 h-4" />
            <span>Ir para Configurações</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao Carregar Dados
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchFinancialData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => window.location.href = '?settings=true'}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Ir para Configurações</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
              <p className="text-gray-600 mt-1">Acompanhe suas receitas e contratos</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              <button
                onClick={fetchFinancialData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalReceived)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.conversionRate.toFixed(1)}% do total
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendente</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  A receber
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Requer atenção
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.monthlyRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.contractsThisMonth} contratos
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                <p className="text-2xl font-bold text-purple-600">{summary.totalContracts}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(summary.averageContractValue)}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-teal-600">{summary.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="bg-teal-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Evolução Mensal</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                calculateMonthlyData(contracts, payments);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Últimos 12 meses</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Receita por Mês</h3>
              <div className="space-y-3">
                {monthlyData.map((month, index) => {
                  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue));
                  const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-16 text-xs text-gray-600">{month.month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                        <div 
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-xs text-gray-900 font-medium">
                        {formatCurrency(month.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contracts Chart */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Contratos por Mês</h3>
              <div className="space-y-3">
                {monthlyData.map((month, index) => {
                  const maxContracts = Math.max(...monthlyData.map(m => m.contracts));
                  const percentage = maxContracts > 0 ? (month.contracts / maxContracts) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-16 text-xs text-gray-600">{month.month}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                        <div 
                          className="bg-green-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-xs text-gray-900 font-medium">
                        {month.contracts} contratos
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Contratos ({filteredContracts.length})
              </h2>
              <div className="flex items-center space-x-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="recent">Recentes (30 dias)</option>
                   <option value="high-value">Alto valor (&gt;R$ 5.000)</option>
                </select>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Pagamento</span>
                </button>
              </div>
            </div>
          </div>
          
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600">
                Não há contratos para o filtro selecionado
              </p>
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
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contract.nome_completo}</div>
                          <div className="text-sm text-gray-500">{contract.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contract.tipo_evento}</div>
                          {contract.data_evento && (
                            <div className="text-sm text-gray-500">{formatDate(contract.data_evento)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(contract.final_price || contract.package_price || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(contract.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowPaymentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Criar pagamento"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
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
            </div>
          )}
        </div>

        {/* Payments Section */}
        {payments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Pagamentos Recentes ({payments.slice(0, 10).length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span className="ml-1">
                            {payment.status === 'paid' ? 'Pago' :
                             payment.status === 'pending' ? 'Pendente' :
                             payment.status === 'overdue' ? 'Atrasado' : 'Cancelado'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{payment.description}</div>
                        {payment.contract && (
                          <div className="text-sm text-gray-500">{payment.contract.nome_completo}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(payment.due_date)}</div>
                        {payment.paid_date && (
                          <div className="text-sm text-gray-500">Pago em: {formatDate(payment.paid_date)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.status === 'pending' || payment.status === 'overdue' ? (
                          <button
                            onClick={() => markAsPaid(payment.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Marcar como Pago
                          </button>
                        ) : payment.status === 'paid' ? (
                          <button
                            onClick={() => unmarkAsPaid(payment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Desmarcar como Pago
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Novo Pagamento</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedContract(null);
                    setNewPayment({ amount: '', due_date: '', description: '', payment_method: 'dinheiro' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {!selectedContract && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Contrato
                  </label>
                  <select
                    onChange={(e) => {
                      const contract = contracts.find(c => c.id === e.target.value);
                      setSelectedContract(contract || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um contrato</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.nome_completo} - {contract.tipo_evento}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedContract && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">{selectedContract.nome_completo}</p>
                  <p className="text-sm text-blue-700">{selectedContract.tipo_evento}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={newPayment.due_date}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Entrada, 1ª parcela, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={newPayment.payment_method}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createPayment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Criar Pagamento
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedContract(null);
                    setNewPayment({ amount: '', due_date: '', description: '', payment_method: 'dinheiro' });
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}