import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Eye, Edit2, Check, X, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contract {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  tipo_evento: string;
  package_price: number;
  final_price: number;
  payment_method_id: string;
  preferred_payment_day: number;
  created_at: string;
  payment_status?: 'pending' | 'partial' | 'paid' | 'overdue';
  next_payment_date?: string;
  total_paid?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  installments: number;
  payment_schedule: Array<{
    percentage: number;
    description: string;
  }>;
}

interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
  created_at: string;
}

interface FinancialDashboardProps {
  onBack?: () => void;
}

export default function FinancialDashboard({ onBack }: FinancialDashboardProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    due_date: '',
    description: ''
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const [contractsResponse, paymentMethodsResponse, paymentsResponse] = await Promise.all([
        supabase
          .from('contratos')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('payments')
          .select('*')
          .order('due_date', { ascending: true })
      ]);

      if (contractsResponse.error) throw contractsResponse.error;
      if (paymentMethodsResponse.error) throw paymentMethodsResponse.error;
      if (paymentsResponse.error) throw paymentsResponse.error;

      const contractsData = contractsResponse.data || [];
      setContracts(contractsData);
      setPaymentMethods(paymentMethodsResponse.data || []);
      setPayments(paymentsResponse.data || []);

      // Se não há pagamentos cadastrados, criar pagamentos automáticos baseados nos contratos
      if (paymentsResponse.data?.length === 0 && contractsData.length > 0) {
        await createAutomaticPayments(contractsData, paymentMethodsResponse.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAutomaticPayments = async (contracts: Contract[], paymentMethods: PaymentMethod[]) => {
    try {
      const paymentsToCreate: Omit<Payment, 'id' | 'created_at'>[] = [];
      
      contracts.forEach(contract => {
        if (contract.final_price || contract.package_price) {
          const paymentMethod = paymentMethods.find(pm => pm.id === contract.payment_method_id);
          const totalAmount = contract.final_price || contract.package_price || 0;
          
          if (!paymentMethod) {
            // Se não tem método de pagamento, criar um pagamento único
            const dueDate = new Date();
            if (contract.preferred_payment_day) {
              dueDate.setDate(contract.preferred_payment_day);
            }
            
            paymentsToCreate.push({
              contract_id: contract.id,
              amount: totalAmount,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'pending',
              description: 'Pagamento único',
              payment_method: 'Não especificado'
            });
            return;
          }
          
          const installments = paymentMethod.installments || 1;
          const paymentSchedule = paymentMethod.payment_schedule || [];
          
          // Se tem cronograma personalizado (ex: 50% + 50%)
          if (paymentSchedule.length > 0) {
            paymentSchedule.forEach((schedule, index) => {
              let dueDate: Date;
              
              if (index === 0) {
                // Primeira parcela: SEMPRE no ato do contrato (data atual)
                dueDate = new Date();
              } else if (index === paymentSchedule.length - 1 && contract.data_evento) {
                // Última parcela: um dia antes do evento
                dueDate = new Date(contract.data_evento);
                dueDate.setDate(dueDate.getDate() - 1);
              } else {
                // Parcelas intermediárias: distribuídas mensalmente respeitando dia preferido
                dueDate = new Date();
                if (contract.preferred_payment_day) {
                  dueDate.setDate(contract.preferred_payment_day);
                  dueDate.setMonth(dueDate.getMonth() + index);
                } else {
                  dueDate.setMonth(dueDate.getMonth() + index);
                }
              }
              
              const amount = schedule.percentage > 0 
                ? (totalAmount * schedule.percentage / 100)
                : totalAmount / paymentSchedule.length;
              
              const description = index === 0 
                ? 'Entrada (no ato do contrato)'
                : index === paymentSchedule.length - 1 && contract.data_evento
                ? 'Saldo final (um dia antes do evento)'
                : schedule.description || `Parcela ${index + 1}/${paymentSchedule.length}`;
              
              paymentsToCreate.push({
                contract_id: contract.id,
                amount: amount,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'pending',
                description: description,
                payment_method: paymentMethod.name || 'Não especificado'
              });
            });
          } else {
            // Parcelas iguais distribuídas até a data do evento
            const installmentAmount = totalAmount / installments;
            
            // Calcular quantos meses até o evento
            const eventDate = contract.data_evento ? new Date(contract.data_evento) : new Date();
            const currentDate = new Date();
            const monthsUntilEvent = Math.max(1, Math.ceil((eventDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
            
            // Ajustar número de parcelas se necessário (não pode ser maior que meses até evento)
            const actualInstallments = Math.min(installments, monthsUntilEvent);
            const adjustedInstallmentAmount = totalAmount / actualInstallments;
            
            for (let i = 0; i < actualInstallments; i++) {
              let dueDate = new Date();
              
              if (i === 0) {
                // Primeira parcela: SEMPRE no ato do contrato (data atual)
                // Mantém a data atual
              } else {
                // Demais parcelas: distribuídas mensalmente até o evento
                if (contract.preferred_payment_day) {
                  dueDate.setDate(contract.preferred_payment_day);
                  dueDate.setMonth(dueDate.getMonth() + i);
                } else {
                  dueDate.setDate(dueDate.getDate() + (i * 30));
                }
                
                // Garantir que não passe da data do evento
                if (contract.data_evento && dueDate > eventDate) {
                  dueDate = new Date(eventDate);
                  dueDate.setDate(dueDate.getDate() - 1); // Um dia antes do evento
                }
              }
              
              paymentsToCreate.push({
                contract_id: contract.id,
                amount: adjustedInstallmentAmount,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'pending',
                description: i === 0 ? 'Entrada (no ato do contrato)' : actualInstallments > 1 ? `Parcela ${i + 1}/${actualInstallments}` : 'Pagamento único',
                payment_method: paymentMethod.name || 'Não especificado'
              });
            }
          }
        }
      });
      
      if (paymentsToCreate.length > 0) {
        const { data, error } = await supabase
          .from('payments')
          .insert(paymentsToCreate)
          .select();
          
        if (error) throw error;
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Erro ao criar pagamentos automáticos:', error);
    }
  };
  const calculateFinancialSummary = () => {
    const totalContracts = contracts.length;
    const totalValue = contracts.reduce((sum, contract) => {
      // Debug: Log dos valores de cada contrato
      console.log('Contrato:', contract.nome_completo, {
        final_price: contract.final_price,
        package_price: contract.package_price,
        payment_method_id: contract.payment_method_id
      });
      
      // Usar final_price se existir, senão usar package_price
      const value = Number(contract.final_price) || Number(contract.package_price) || 0;
      return sum + value;
    }, 0);
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
    const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, payment) => sum + payment.amount, 0);

    console.log('Resumo financeiro:', {
      totalContracts,
      totalValue,
      totalPaid,
      totalPending,
      totalOverdue
    });
    return {
      totalContracts,
      totalValue,
      totalPaid,
      totalPending,
      totalOverdue,
      paidPercentage: totalValue > 0 ? (totalPaid / totalValue) * 100 : 0
    };
  };

  const getContractPayments = (contractId: string) => {
    return payments.filter(p => p.contract_id === contractId);
  };

  const getPaymentStatus = (contract: Contract): 'pending' | 'partial' | 'paid' | 'overdue' => {
    const contractPayments = getContractPayments(contract.id);
    const paidPayments = contractPayments.filter(p => p.status === 'paid');
    const overduePayments = contractPayments.filter(p => p.status === 'overdue');

    if (overduePayments.length > 0) return 'overdue';
    if (paidPayments.length === contractPayments.length) return 'paid';
    if (paidPayments.length > 0) return 'partial';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'partial': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'Pendente',
      'partial': 'Parcial',
      'paid': 'Pago',
      'overdue': 'Vencido'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? data : payment
      ));
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
      alert('Erro ao atualizar pagamento');
    }
  };

  const addNewPayment = async () => {
    if (!selectedContract || !newPayment.amount || !newPayment.due_date) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          contract_id: selectedContract.id,
          amount: parseFloat(newPayment.amount),
          due_date: newPayment.due_date,
          status: 'pending',
          description: newPayment.description || 'Pagamento adicional',
          payment_method: 'Manual'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setPayments(prev => [...prev, data]);
      setNewPayment({ amount: '', due_date: '', description: '' });
      setShowAddPaymentModal(false);
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      alert('Erro ao adicionar pagamento');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const status = getPaymentStatus(contract);
    const matchesStatus = !filterStatus || status === filterStatus;
    
    const contractDate = new Date(contract.created_at);
    const matchesMonth = !filterMonth || 
      contractDate.toISOString().slice(0, 7) === filterMonth;
    
    return matchesStatus && matchesMonth;
  });

  const summary = calculateFinancialSummary();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
              <p className="text-gray-600">Visão geral e controle financeiro dos contratos</p>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Valor Total</p>
                <p className="text-2xl font-semibold text-gray-900">
                  R$ {summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recebido</p>
                <p className="text-2xl font-semibold text-green-600">
                  R$ {summary.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  {summary.paidPercentage.toFixed(1)}% do total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">A Receber</p>
                <p className="text-2xl font-semibold text-yellow-600">
                  R$ {summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Em Atraso</p>
                <p className="text-2xl font-semibold text-red-600">
                  R$ {summary.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status do Pagamento
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="partial">Parcial</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês do Contrato
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contratos ({filteredContracts.length})</h2>
          </div>
          
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de busca</p>
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progresso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.map((contract) => {
                    const contractPayments = getContractPayments(contract.id);
                    const paidPayments = contractPayments.filter(p => p.status === 'paid');
                    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
                    const totalValue = contract.final_price || contract.package_price || 0;
                    const progress = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
                    const status = getPaymentStatus(contract);

                    return (
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
                          <div className="text-sm text-gray-900">{contract.tipo_evento}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            R$ {Number(totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-gray-500">
                            Pago: R$ {Number(totalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-400">
                            Final: R$ {Number(contract.final_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | 
                            Pacote: R$ {Number(contract.package_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                progress === 100 ? 'bg-green-600' : 
                                progress > 0 ? 'bg-blue-600' : 'bg-gray-300'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {progress.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowPaymentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded mr-2"
                            title="Ver pagamentos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        {showPaymentModal && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Pagamentos - {selectedContract.nome_completo}</h2>
                    <p className="text-gray-600">{selectedContract.tipo_evento}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddPaymentModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {getContractPayments(selectedContract.id).map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{payment.description}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                              {getStatusLabel(payment.status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Valor: R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p>Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}</p>
                            {payment.paid_date && (
                              <p>Pago em: {new Date(payment.paid_date).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {payment.status !== 'paid' && (
                            <button
                              onClick={() => markPaymentAsPaid(payment.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Marcar como pago"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Modal */}
        {showAddPaymentModal && selectedContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Adicionar Pagamento</h2>
                  <button
                    onClick={() => setShowAddPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
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
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={newPayment.description}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descrição do pagamento"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={addNewPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddPaymentModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    Cancelar
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