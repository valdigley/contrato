import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, AlertTriangle, CheckCircle, Clock, Settings, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FinancialDashboardProps {
  onBack: () => void;
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
}

interface Contract {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  tipo_evento: string;
  data_evento: string;
  final_price: number;
  created_at: string;
}

interface FinancialSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  monthlyRevenue: number;
  contractsThisMonth: number;
  averageContractValue: number;
}

export default function FinancialDashboard({ onBack }: FinancialDashboardProps) {
  // All useState hooks at the top level - NEVER conditional
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalReceived: 0,
    totalPending: 0,
    totalOverdue: 0,
    monthlyRevenue: 0,
    contractsThisMonth: 0,
    averageContractValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  // All useEffect hooks after useState - NEVER conditional
  useEffect(() => {
    // Check Supabase configuration
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
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (supabaseConfigured) {
      updateOverduePayments();
    }
  }, [supabaseConfigured]);

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

      const [paymentsResponse, contractsResponse] = await Promise.all([
        supabase.from('payments').select('*').order('due_date', { ascending: true }),
        supabase.from('contratos').select('*').order('created_at', { ascending: false })
      ]);

      if (paymentsResponse.error) {
        if (paymentsResponse.error.message.includes('Invalid API key')) {
          throw new Error('Chave de API inválida. Verifique suas credenciais do Supabase nas configurações.');
        }
        throw paymentsResponse.error;
      }
      
      if (contractsResponse.error) {
        if (contractsResponse.error.message.includes('Invalid API key')) {
          throw new Error('Chave de API inválida. Verifique suas credenciais do Supabase nas configurações.');
        }
        throw contractsResponse.error;
      }

      const paymentsData = paymentsResponse.data || [];
      const contractsData = contractsResponse.data || [];

      setPayments(paymentsData);
      setContracts(contractsData);

      // Calculate summary
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const totalReceived = paymentsData
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalPending = paymentsData
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalOverdue = paymentsData
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const monthlyRevenue = paymentsData
        .filter(p => {
          const paidDate = p.paid_date ? new Date(p.paid_date) : null;
          return paidDate && 
                 paidDate.getMonth() === currentMonth && 
                 paidDate.getFullYear() === currentYear &&
                 p.status === 'paid';
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const contractsThisMonth = contractsData.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length;

      const averageContractValue = contractsData.length > 0 
        ? contractsData.reduce((sum, c) => sum + Number(c.final_price || 0), 0) / contractsData.length
        : 0;

      setSummary({
        totalReceived,
        totalPending,
        totalOverdue,
        monthlyRevenue,
        contractsThisMonth,
        averageContractValue
      });

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

  const updateOverduePayments = async () => {
    const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined' || supabaseKey === 'undefined') {
      return;
    }
    
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      // Get all pending payments that are past due
      const { data: overduePayments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', today.toISOString().split('T')[0]);

      if (error) throw error;

      if (overduePayments && overduePayments.length > 0) {
        // Update status to overdue
        const { error: updateError } = await supabase
          .from('payments')
          .update({ status: 'overdue' })
          .in('id', overduePayments.map(p => p.id));

        if (updateError) throw updateError;

        // Refresh data after updating
        await fetchFinancialData();
      }
    } catch (error) {
      console.error('Erro ao atualizar pagamentos em atraso:', error);
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

      // Refresh data
      await fetchFinancialData();
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
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
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (showOverdueOnly) {
      return payment.status === 'overdue';
    }
    
    if (selectedMonth) {
      const paymentDate = new Date(payment.due_date);
      const [year, month] = selectedMonth.split('-');
      return paymentDate.getFullYear() === parseInt(year) && 
             paymentDate.getMonth() === parseInt(month) - 1;
    }
    
    return true;
  });

  // Conditional rendering AFTER all hooks
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
              <p className="text-gray-600 mt-1">Acompanhe suas receitas e pagamentos</p>
            </div>
            <button
              onClick={fetchFinancialData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalReceived)}</p>
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
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos do Mês</p>
                <p className="text-2xl font-bold text-purple-600">{summary.contractsThisMonth}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Calendar className="w-6 h-6 text-purple-600" />
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
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Mês
              </label>
              <input
                type="month"
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOverdueOnly}
                  onChange={(e) => setShowOverdueOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Apenas em atraso</span>
              </label>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pagamentos ({filteredPayments.length})
            </h2>
          </div>
          
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
              <p className="text-gray-600">
                {showOverdueOnly 
                  ? 'Não há pagamentos em atraso no momento'
                  : 'Não há pagamentos para o período selecionado'
                }
              </p>
            </div>
          ) : (
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
                      Forma de Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
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
                        {payment.notes && (
                          <div className="text-sm text-gray-500">{payment.notes}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.payment_method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {payment.status === 'pending' || payment.status === 'overdue' ? (
                          <button
                            onClick={() => markAsPaid(payment.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Marcar como Pago
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
          )}
        </div>
      </div>
    </div>
  );
}