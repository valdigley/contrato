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
  data_evento?: string;
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
  payment_method?: string;
  notes?: string;
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

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPaymentsForContract = async (contract: Contract) => {
    try {
      console.log('=== CRIANDO PARCELAS PARA CONTRATO ===');
      console.log('Cliente:', contract.nome_completo);
      console.log('Contract ID:', contract.id);
      
      // Verificar se já existem pagamentos para este contrato
      const { data: existingPayments, error: checkError } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contract.id);
        
      if (checkError) {
        console.error('Erro ao verificar pagamentos existentes:', checkError);
        throw checkError;
      }
      
      console.log('Pagamentos existentes:', existingPayments?.length || 0);
      
      if (existingPayments.length > 0) {
        alert('Este contrato já possui pagamentos cadastrados');
        console.log('Parcelas já existem, cancelando criação');
        return;
      }

      const totalAmount = Number(contract.final_price) || Number(contract.package_price) || 0;
      console.log('Valor total do contrato:', totalAmount);
      
      if (totalAmount <= 0) {
        alert('Contrato sem valor definido');
        console.log('Valor inválido, cancelando');
        return;
      }

      const paymentMethod = paymentMethods.find(pm => pm.id === contract.payment_method_id);
      console.log('Método de pagamento encontrado:', paymentMethod?.name || 'Nenhum');
      
      const paymentsToCreate: Omit<Payment, 'id' | 'created_at'>[] = [];

      if (!paymentMethod) {
        console.log('Criando pagamento único');
        // Pagamento único
        paymentsToCreate.push({
          contract_id: contract.id,
          amount: totalAmount,
          due_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          description: 'Pagamento único',
          payment_method: 'Pagamento único'
        });
      } else {
        const paymentSchedule = paymentMethod.payment_schedule || [];
        console.log('Cronograma de pagamento:', paymentSchedule);
        
        if (paymentSchedule.length > 0) {
          console.log('Usando cronograma personalizado');
          // Cronograma personalizado
          let totalPercentage = 0;
          paymentSchedule.forEach((schedule, index) => {
            let dueDate = new Date();
            
            if (index === 0) {
              // Primeira parcela: hoje
            } else if (paymentSchedule.length === 2 && index === 1 && contract.data_evento) {
              // Segunda parcela: um dia antes do evento
              dueDate = new Date(contract.data_evento);
              dueDate.setDate(dueDate.getDate() - 1);
            } else {
              // Outras parcelas: mensalmente
              dueDate.setMonth(dueDate.getMonth() + index);
              if (contract.preferred_payment_day >= 1 && contract.preferred_payment_day <= 28) {
                dueDate.setDate(contract.preferred_payment_day);
              }
            }
            
            let amount: number;
            if (schedule.percentage > 0) {
              amount = (totalAmount * schedule.percentage / 100);
              totalPercentage += schedule.percentage;
              console.log(`Parcela ${index + 1}: ${schedule.percentage}% = R$ ${amount.toFixed(2)}`);
            } else {
              amount = totalAmount / paymentSchedule.length;
              console.log(`Parcela ${index + 1}: Divisão igual = R$ ${amount.toFixed(2)}`);
            }
            
            paymentsToCreate.push({
              contract_id: contract.id,
              amount: Math.round(amount * 100) / 100,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'pending',
              description: index === 0 
                ? 'Entrada (no ato do contrato)'
                : paymentSchedule.length === 2 && index === 1 
                ? 'Saldo final (um dia antes do evento)'
                : schedule.description || `Parcela ${index + 1}/${paymentSchedule.length}`,
              payment_method: paymentMethod.name
            });
          });
          
          console.log('Total de porcentagem:', totalPercentage);
          if (totalPercentage > 100) {
            alert(`Erro: Total de porcentagem (${totalPercentage}%) excede 100%`);
            return;
          }
        } else {
          console.log('Usando parcelas iguais');
          // Parcelas iguais
          const installments = paymentMethod.installments || 1;
          console.log('Número de parcelas:', installments);
          const installmentAmount = totalAmount / installments;
          console.log('Valor por parcela:', installmentAmount);
          
          for (let i = 0; i < installments; i++) {
            let dueDate = new Date();
            
            if (i > 0) {
              dueDate.setMonth(dueDate.getMonth() + i);
              if (contract.preferred_payment_day >= 1 && contract.preferred_payment_day <= 28) {
                dueDate.setDate(contract.preferred_payment_day);
              }
            }
            
            paymentsToCreate.push({
              contract_id: contract.id,
              amount: Math.round(installmentAmount * 100) / 100,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'pending',
              description: i === 0 
                ? 'Entrada (no ato do contrato)'
                : `Parcela ${i + 1}/${installments}`,
              payment_method: paymentMethod.name
            });
          }
        }
      }

      console.log('Parcelas a serem criadas:', paymentsToCreate.length);
      const totalToCreate = paymentsToCreate.reduce((sum, p) => sum + p.amount, 0);
      console.log('Valor total das parcelas:', totalToCreate);
      console.log('Valor do contrato:', totalAmount);
      
      if (Math.abs(totalToCreate - totalAmount) > 0.01) {
        alert(`Erro: Soma das parcelas (R$ ${totalToCreate.toFixed(2)}) não confere com o valor do contrato (R$ ${totalAmount.toFixed(2)})`);
        console.error('Valores não conferem!');
        return;
      }
      
      if (paymentsToCreate.length > 0) {
        console.log('Inserindo parcelas no banco...');
        const { data, error } = await supabase
          .from('payments')
          .insert(paymentsToCreate)
          .select();
          
        if (error) {
          console.error('Erro ao inserir parcelas:', error);
          throw error;
        }
        
        console.log('Parcelas criadas com sucesso:', data?.length);
        
        // Recarregar todos os dados
        await fetchFinancialData();
        alert('Parcelas criadas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao criar pagamentos automáticos:', error);
      alert(`Erro ao criar parcelas: ${(error as Error).message}`);
    }
  };
  
  // Função para atualizar status de pagamentos vencidos
  const updateOverduePayments = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const overduePayments = payments.filter(payment => {
        if (payment.status === 'paid') return false;
        const dueDate = new Date(payment.due_date);
        return dueDate < today;
      });
      
      if (overduePayments.length > 0) {
        const { error } = await supabase
          .from('payments')
          .update({ status: 'overdue' })
          .in('id', overduePayments.map(p => p.id));
          
        if (!error) {
          await fetchFinancialData(); // Recarregar dados
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar pagamentos vencidos:', error);
    }
  };

  const calculateFinancialSummary = () => {
    const totalContracts = contracts.length;
    const totalValue = contracts.reduce((sum, contract) => {
      const value = Number(contract.final_price) || Number(contract.package_price) || 0;
      return sum + value;
    }, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calcular totais baseados nos pagamentos reais
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    // Pagamentos em atraso (vencidos e não pagos)
    const totalOverdue = payments
      .filter(p => {
        if (p.status === 'paid') return false;
        const dueDate = new Date(p.due_date);
        return dueDate < today;
      })
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
    
    // Pagamentos pendentes (futuros e não pagos)
    const totalPending = payments
      .filter(p => {
        if (p.status === 'paid') return false;
        const dueDate = new Date(p.due_date);
        return dueDate >= today;
      })
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    console.log('Resumo financeiro calculado:', {
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

  // Executar atualização de status ao carregar
  React.useEffect(() => {
    if (payments.length > 0) {
      updateOverduePayments();
    }
  }, [payments.length]);

  const getContractPayments = (contractId: string) => {
    return payments.filter(p => p.contract_id === contractId);
  };

  const getPaymentStatus = (contract: Contract): 'pending' | 'partial' | 'paid' | 'overdue' => {
    const contractPayments = getContractPayments(contract.id);
    if (contractPayments.length === 0) return 'pending';
    
    const paidPayments = contractPayments.filter(p => p.status === 'paid');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overduePayments = contractPayments.filter(p => {
      if (p.status === 'paid') return false;
      const dueDate = new Date(p.due_date);
      return dueDate < today;
    });

    if (overduePayments.length > 0) return 'overdue';
    if (paidPayments.length === contractPayments.length && contractPayments.length > 0) return 'paid';
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
      const existingPayment = payments.find(p => p.id === paymentId);
      if (!existingPayment) {
        alert('Pagamento não encontrado');
        return;
      }
      
      if (existingPayment.status === 'paid') {
        alert('Este pagamento já foi marcado como pago');
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'paid',
          paid_date: today,
          notes: 'Marcado como pago manualmente'
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar estado local
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? data : payment
      ));
      
      alert('Pagamento marcado como pago com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar pagamento como pago:', error);
      alert(`Erro ao atualizar pagamento: ${(error as Error).message}`);
    }
  };

  const markPaymentAsUnpaid = async (paymentId: string) => {
    try {
      const existingPayment = payments.find(p => p.id === paymentId);
      if (!existingPayment) {
        alert('Pagamento não encontrado');
        return;
      }
      
      if (existingPayment.status !== 'paid') {
        alert('Este pagamento não está marcado como pago');
        return;
      }

      if (!confirm('Tem certeza que deseja desmarcar este pagamento como pago?')) {
        return;
      }

      // Determinar o status correto baseado na data de vencimento
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(existingPayment.due_date);
      const newStatus = dueDate < today ? 'overdue' : 'pending';

      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: newStatus,
          paid_date: null,
          notes: 'Desmarcado como pago manualmente'
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar estado local
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId ? data : payment
      ));
      
      alert('Pagamento desmarcado como pago com sucesso!');
    } catch (error) {
      console.error('Erro ao desmarcar pagamento como pago:', error);
      alert(`Erro ao atualizar pagamento: ${(error as Error).message}`);
    }
  };

  const addNewPayment = async () => {
    if (!selectedContract || !newPayment.amount || !newPayment.due_date) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Valor deve ser um número positivo');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          contract_id: selectedContract.id,
          amount: amount,
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
      alert('Pagamento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      alert(`Erro ao adicionar pagamento: ${(error as Error).message}`);
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
                    const totalValue = Number(contract.final_price) || Number(contract.package_price) || 0;
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
                            Contrato: {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          {contract.data_evento && (
                            <div className="text-sm text-gray-500">
                              Evento: {new Date(contract.data_evento).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            R$ {Number(totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-sm text-gray-500">
                            Pago: R$ {Number(totalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {contractPayments.length > 0 && (
                            <div className="text-xs text-gray-400">
                              {contractPayments.length} parcela{contractPayments.length > 1 ? 's' : ''}
                            </div>
                          )}
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
                    <div className="text-gray-600 space-y-1">
                      <p>{selectedContract.tipo_evento}</p>
                      {(() => {
                        const paymentMethod = paymentMethods.find(pm => pm.id === selectedContract.payment_method_id);
                        return paymentMethod ? (
                          <p className="text-sm">
                            <span className="font-medium">Forma de pagamento:</span> {paymentMethod.name}
                            {paymentMethod.installments > 1 && (
                              <span className="ml-2 text-blue-600">({paymentMethod.installments}x)</span>
                            )}
                          </p>
                        ) : null;
                      })()}
                      <p className="text-sm">
                        <span className="font-medium">Valor total:</span> R$ {Number(selectedContract.final_price || selectedContract.package_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
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

                {/* Payment Summary */}
                {(() => {
                  const contractPayments = getContractPayments(selectedContract.id);
                  const totalPaid = contractPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
                  const totalPending = contractPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
                  const totalOverdue = contractPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
                  const totalValue = selectedContract.final_price || selectedContract.package_price || 0;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-blue-700">Total do Contrato</div>
                        <div className="text-lg font-semibold text-blue-900">
                          R$ {Number(totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-green-700">Pago</div>
                        <div className="text-lg font-semibold text-green-900">
                          R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-yellow-700">Pendente</div>
                        <div className="text-lg font-semibold text-yellow-900">
                          R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-red-700">Em Atraso</div>
                        <div className="text-lg font-semibold text-red-900">
                          R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="space-y-4">
                  {getContractPayments(selectedContract.id).map((payment) => (
                    <div key={payment.id} className={`border rounded-lg p-4 ${
                      payment.status === 'paid' ? 'border-green-200 bg-green-50' :
                      payment.status === 'overdue' ? 'border-red-200 bg-red-50' :
                      'border-gray-200 bg-white'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">{payment.description}</h4>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                {getStatusLabel(payment.status)}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <div className="space-y-1">
                              <p>
                                <span className="font-medium">Vencimento:</span> {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                                {new Date(payment.due_date) < new Date() && payment.status !== 'paid' && (
                                  <span className="ml-2 text-red-600 font-medium">(Vencido)</span>
                                )}
                              </p>
                              {payment.paid_date && (
                                <p>
                                  <span className="font-medium">Pago em:</span> {new Date(payment.paid_date).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {payment.status !== 'paid' && (
                                <button
                                  onClick={() => markPaymentAsPaid(payment.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
                                  title="Marcar como pago"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Marcar como Pago</span>
                                </button>
                              )}
                              {payment.status === 'paid' && (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1 text-green-600">
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm font-medium">Pago</span>
                                  </div>
                                  <button
                                    onClick={() => markPaymentAsUnpaid(payment.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1 transition-colors"
                                    title="Desmarcar como pago"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Desmarcar</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getContractPayments(selectedContract.id).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
                      <p className="text-gray-600 mb-4">
                        Este contrato ainda não possui parcelas de pagamento cadastradas.
                      </p>
                      <button
                        onClick={() => createPaymentsForContract(selectedContract)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Criar Parcelas Automaticamente</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {(() => {
                  const contractPayments = getContractPayments(selectedContract.id);
                  const totalPaid = contractPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
                  const totalValue = selectedContract.final_price || selectedContract.package_price || 0;
                  const progress = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
                  
                  return contractPayments.length > 0 ? (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progresso do Pagamento</span>
                        <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            progress === 100 ? 'bg-green-600' : 
                            progress > 0 ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pago</span>
                        <span>R$ {Number(totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} total</span>
                      </div>
                    </div>
                  ) : null;
                })()}
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