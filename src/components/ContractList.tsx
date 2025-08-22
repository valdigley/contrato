import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Trash2, Link, Calendar, MapPin, User, Phone, Mail, FileText, Copy, Check, Settings, Download, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contract {
  id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  data_nascimento: string;
  tipo_evento: string;
  event_type_id?: string;
  package_id?: string;
  package_price?: number;
  local_festa: string;
  nome_noivos?: string;
  nome_aniversariante?: string;
  local_pre_wedding?: string;
  local_making_of?: string;
  local_cerimonia?: string;
  created_at: string;
}

interface ContractListProps {
  onNewContract: () => void;
  onBackToDashboard?: () => void;
}

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [generatedContract, setGeneratedContract] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get photographer profile for current user
      const { data: photographerData, error: photographerError } = await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (photographerError) {
        setContracts([]);
        setLoading(false);
        return;
      }

      // Fetch contracts for this photographer
      const contractsResponse = await supabase
        .from('contratos')
        .select('*')
        .eq('photographer_id', photographerData.id)
        .order('created_at', { ascending: false });
      
      if (contractsResponse.error) {
        console.error('Erro ao buscar contratos:', contractsResponse.error);
      }

      setContracts(contractsResponse.data || []);
      
      // Carregar templates e packages separadamente para não bloquear a listagem
      const [templatesResponse, packagesResponse] = await Promise.all([
        supabase.from('contract_templates').select('*').eq('is_active', true),
        supabase.from('packages').select('*').eq('is_active', true)
      ]);
      
      if (!templatesResponse.error) setTemplates(templatesResponse.data || []);
      if (!packagesResponse.error) setPackages(packagesResponse.data || []);
      
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) {
      return;
    }

    try {
      console.log('Excluindo contrato ID:', id);
      
      const { data, error } = await supabase
        .from('contratos')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Erro ao excluir do Supabase:', error);
        alert(`Erro ao excluir contrato: ${error.message}`);
        return;
      }
      
      console.log('Dados excluídos:', data);
      
      if (data && data.length > 0) {
        // Atualizar a lista local removendo o contrato excluído
        setContracts(prevContracts => prevContracts.filter(c => c.id !== id));
        alert('Contrato excluído com sucesso!');
        console.log('Contrato removido da lista local');
      } else {
        alert('Contrato não encontrado ou já foi excluído');
      }
      
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert(`Erro inesperado: ${(error as Error).message}`);
    }
  };

  const copyClientLink = () => {
    const clientLink = `${window.location.origin}?client=true`;
    navigator.clipboard.writeText(clientLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const generateContract = async (contract: Contract) => {
    try {
      // Buscar o template para o tipo de evento
      const template = templates.find(t => t.event_type_id === contract.event_type_id);
      
      if (!template) {
        alert('Modelo de contrato não encontrado para este tipo de evento');
        return;
      }

      // Buscar dados do pacote se existir
      const packageData = contract.package_id 
        ? packages.find(p => p.id === contract.package_id)
        : null;

      // Substituir variáveis no template
      let contractContent = template.content;
      
      // Dados pessoais
      contractContent = contractContent.replace(/\{\{nome_completo\}\}/g, contract.nome_completo);
      contractContent = contractContent.replace(/\{\{cpf\}\}/g, formatCPF(contract.cpf));
      contractContent = contractContent.replace(/\{\{email\}\}/g, contract.email);
      contractContent = contractContent.replace(/\{\{whatsapp\}\}/g, formatWhatsApp(contract.whatsapp));
      contractContent = contractContent.replace(/\{\{endereco\}\}/g, contract.endereco);
      contractContent = contractContent.replace(/\{\{cidade\}\}/g, contract.cidade);
      contractContent = contractContent.replace(/\{\{data_nascimento\}\}/g, formatDate(contract.data_nascimento));
      
      // Dados do evento
      contractContent = contractContent.replace(/\{\{tipo_evento\}\}/g, contract.tipo_evento);
      contractContent = contractContent.replace(/\{\{data_evento\}\}/g, contract.data_evento ? formatDate(contract.data_evento) : '');
      contractContent = contractContent.replace(/\{\{horario_evento\}\}/g, contract.horario_evento || '');
      contractContent = contractContent.replace(/\{\{local_festa\}\}/g, contract.local_festa);
      
      // Dados opcionais
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
      
      // Dados do pacote
      if (packageData) {
        contractContent = contractContent.replace(/\{\{package_name\}\}/g, packageData.name);
        contractContent = contractContent.replace(/\{\{package_price\}\}/g, 
          `R$ ${(contract.package_price || packageData.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        // Features do pacote
        if (packageData.features && packageData.features.length > 0) {
          const featuresList = packageData.features.map((f: string) => `• ${f}`).join('\n');
          contractContent = contractContent.replace(/\{\{package_features\}\}/g, featuresList);
        }
      }
      
      // Remover variáveis não substituídas (campos vazios)
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
      // Método mais simples - usar a API de impressão direta
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
            <div class="content">${generatedContract.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Aguardar carregamento e imprimir
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
  
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return '';
    const clean = whatsapp.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'Casamento': 'bg-pink-100 text-pink-800',
      'Aniversário': 'bg-yellow-100 text-yellow-800',
      'Ensaio Fotográfico': 'bg-purple-100 text-purple-800',
      'Formatura': 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Filter contracts based on search term and filter type
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cpf.includes(searchTerm) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.whatsapp.includes(searchTerm) ||
      contract.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.nome_noivos && contract.nome_noivos.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contract.nome_aniversariante && contract.nome_aniversariante.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === '' || contract.tipo_evento === filterType;
    
    return matchesSearch && matchesType;
  });

  // Debug da busca
  console.log('Termo de busca:', searchTerm);
  console.log('Filtro de tipo:', filterType);
  console.log('Total de contratos:', contracts.length);
  console.log('Contratos filtrados:', filteredContracts.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h1>
              <p className="text-gray-600 mt-1">Gerencie todos os seus contratos de eventos</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF, email, WhatsApp, cidade, noivos ou aniversariante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os tipos</option>
                <option value="Casamento">Casamento</option>
                <option value="Aniversário">Aniversário</option>
                <option value="Ensaio Fotográfico">Ensaio Fotográfico</option>
                <option value="Formatura">Formatura</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Nenhum resultado encontrado'}
              </h3>
              <p className="text-gray-600">
                {contracts.length === 0 
                  ? 'Comece criando seu primeiro contrato'
                  : 'Tente ajustar os filtros de busca'
                }
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
                      Tipo de Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contract.nome_completo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCPF(contract.cpf)} • {contract.cidade}
                          </div>
                          <div className="text-sm text-gray-500">
                            📧 {contract.email} • 📱 {contract.whatsapp ? formatWhatsApp(contract.whatsapp) : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(contract.tipo_evento)}`}>
                          {contract.tipo_evento}
                        </span>
                        {contract.data_evento && (
                          <div className="text-xs text-gray-500 mt-1">
                            📅 {formatDate(contract.data_evento)}
                            {contract.horario_evento && (
                              <span className="ml-2">🕐 {contract.horario_evento}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(contract.created_at)}
                        <div className="text-xs text-gray-400">Cadastrado em</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateContract(contract)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Gerar contrato"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteContract(contract.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
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
                        <p className="text-sm text-gray-900">{formatCPF(selectedContract.cpf)}</p>
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
                        <p className="text-sm text-gray-900">{formatWhatsApp(selectedContract.whatsapp)}</p>
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(selectedContract.tipo_evento)}`}>
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
  );
}