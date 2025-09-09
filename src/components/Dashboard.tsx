import React, { useState, useEffect } from 'react';
import { 
  Plus,
  Settings,
  User,
  LogOut,
  FileText,
  Camera,
  Sun,
  Moon,
  Edit2,
  Save,
  X,
  Search,
  Eye,
  Trash2,
  MessageCircle,
  Download,
  Calendar,
  DollarSign,
  Link,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
}

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
  // Enhanced helper function to safely query tables with better error handling
  const safeQuery = async (tableName: string, query: any) => {
    try {
      const result = await query;
      if (result.error) {
        // Handle specific error codes silently
        if (result.error.code === 'PGRST205' || result.error.code === 'PGRST116') {
          console.info(`Sistema funcionando sem tabela ${tableName} - dados vazios carregados`);
        } else {
          console.info(`Sistema funcionando com dados limitados de ${tableName}:`, result.error.message);
        }
        return { data: tableName === 'contratos' ? [] : null, error: null };
      }
      return result;
    } catch (error: any) {
      // Catch any network or parsing errors
      if (error?.message?.includes('PGRST205') || error?.message?.includes('table')) {
        console.info(`Sistema funcionando sem tabela ${tableName} - dados vazios carregados`);
      } else {
        console.info(`Sistema funcionando com dados limitados de ${tableName}:`, error);
      }
      return { data: tableName === 'contratos' ? [] : null, error: null };
    }
  };

  local_pre_wedding?: string;
  local_making_of?: string;
  local_cerimonia?: string;
  data_evento?: string;
  horario_evento?: string;
  final_price?: number;
  preferred_payment_day?: number;
  created_at: string;
  status?: 'draft' | 'sent' | 'signed';
  discount_percentage?: number;
  adjusted_price?: number;
  custom_notes?: string;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountContract, setDiscountContract] = useState<any>(null);
  const [discountData, setDiscountData] = useState({
    discountType: 'percentage', // 'percentage' ou 'fixed'
    discountPercentage: 0,
    discountAmount: 0,
    adjustedPrice: 0,
    customNotes: ''
  });
  const [profileData, setProfileData] = useState({
    name: '',
    business_name: '',
    phone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [generatedContract, setGeneratedContract] = useState('');
  const [showContractModal, setShowContractModal] = useState(false);
  const [discountError, setDiscountError] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [photographerInfo, setPhotographerInfo] = useState<any>(null);

  const openDiscountModal = (contract: Contract) => {
    setDiscountContract(contract);
    setShowDiscountModal(true);
    
    // Initialize values
    const originalPrice = contract.final_price || contract.package_price || 0;
    const currentAdjustedPrice = contract.adjusted_price || originalPrice;
    const currentDiscountPercentage = contract.discount_percentage || 0;
    
    setDiscountData({
      discountType: 'percentage',
      discountPercentage: currentDiscountPercentage,
      discountAmount: 0,
      adjustedPrice: currentAdjustedPrice,
      customNotes: contract.custom_notes || ''
    });
    
    // Calculate discount value if there's a percentage
    if (currentDiscountPercentage > 0) {
      const discountAmount = originalPrice * (currentDiscountPercentage / 100);
      setDiscountData(prev => ({ ...prev, discountAmount }));
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchUserProfile();
    loadSystemData();
  }, [user]);

      const contractsResult = await safeQuery('contratos', 
        supabase
          .from('contratos')
          .select('*')
          .order('created_at', { ascending: false })
      );
      // Buscar dados do usuário
      setContracts(contractsResult.data || []);

      // Buscar dados do fotógrafo
      const photographerResult = await safeQuery('photographers',
        supabase
          .from('photographers')
          .select('business_name, phone')
          .eq('user_id', user.id)
          .single()
      );

      setProfileData({
        name: userData?.name || '',
        business_name: photographerData?.business_name || '',
        phone: photographerData?.phone || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      // Atualizar dados do usuário
      await supabase
        .from('users')
        .update({ name: profileData.name })
        .eq('id', user.id);

      // Atualizar ou criar dados do fotógrafo
      const { data: existingPhotographer } = await supabase
        .from('photographers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingPhotographer) {
        await supabase
          .from('photographers')
          .update({
            business_name: profileData.business_name,
            phone: profileData.phone
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('photographers')
          .insert([{
            user_id: user.id,
            business_name: profileData.business_name,
            phone: profileData.phone,
            settings: {}
          }]);
      }

      setShowProfileModal(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const loadSystemData = async () => {
    try {
      const [templatesRes, packagesRes] = await Promise.all([
        supabase.from('contract_templates').select('*').order('name'),
        supabase.from('packages').select('*').order('name')
      ]);

      if (!templatesRes.error) setTemplates(templatesRes.data || []);
      if (!packagesRes.error) setPackages(packagesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do sistema:', error);
    }
  };

  const handleDiscountChange = (field: string, value: string | number) => {
    const newData = { ...discountData, [field]: value };
    const originalPrice = discountContract?.final_price || discountContract?.package_price || 0;
    
    if (field === 'discountType') {
      // Reset values when changing type
      newData.discountPercentage = 0;
      newData.discountAmount = 0;
      newData.adjustedPrice = originalPrice;
    } else if (field === 'discountPercentage' && newData.discountType === 'percentage') {
      const percentage = Number(value);
      
      if (percentage === 0) {
        newData.adjustedPrice = originalPrice;
        newData.discountAmount = 0;
      } else {
        const newPrice = originalPrice * (1 - percentage / 100);
        newData.adjustedPrice = newPrice;
        newData.discountAmount = originalPrice - newPrice;
      }
    } else if (field === 'discountAmount' && newData.discountType === 'fixed') {
      const amount = Number(value);
      
      if (amount === 0) {
        newData.adjustedPrice = originalPrice;
        newData.discountPercentage = 0;
      } else {
        const newPrice = originalPrice - amount;
        newData.adjustedPrice = Math.max(0, newPrice); // Não pode ser negativo
        newData.discountPercentage = (amount / originalPrice) * 100;
      }
    } else if (field === 'adjustedPrice') {
      const newPrice = Number(value);
      
      if (newPrice === originalPrice) {
        newData.discountPercentage = 0;
        newData.discountAmount = 0;
      } else {
        const discountAmount = originalPrice - newPrice;
        newData.discountAmount = discountAmount;
        newData.discountPercentage = (discountAmount / originalPrice) * 100;
      }
    }
    
    setDiscountData(newData);
  };

  const applyDiscount = async () => {
    if (!discountContract) return;

    const originalPrice = discountContract.final_price || discountContract.package_price || 0;

    try {
      const { error } = await supabase
        .from('contratos')
        .update({
          discount_percentage: (discountData.discountPercentage === 0 || discountData.adjustedPrice === originalPrice) ? null : discountData.discountPercentage,
          adjusted_price: discountData.adjustedPrice === originalPrice ? null : discountData.adjustedPrice,
          custom_notes: discountData.customNotes || null
        })
        .eq('id', discountContract.id);

      if (error) throw error;

      // Update local state
      setContracts(prev => prev.map(contract =>
        contract.id === discountContract.id 
          ? { 
              ...contract, 
              discount_percentage: discountData.discountPercentage === 0 ? null : discountData.discountPercentage,
              adjusted_price: discountData.adjustedPrice === originalPrice ? null : discountData.adjustedPrice,
              custom_notes: discountData.customNotes || null
            } 
          : contract
      ));

      setShowDiscountModal(false);
      setDiscountContract(null);
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      alert('Erro ao aplicar desconto');
    }
  };

  const generateContract = async (contract: Contract) => {
    try {
      // Buscar o template para o tipo de evento
      const template = templates.find((t: any) => t.event_type_id === contract.event_type_id);
      
      if (!template) {
        alert('Modelo de contrato não encontrado para este tipo de evento');
        return;
      }

      // Buscar dados do pacote se existir
      const packageData = contract.package_id 
        ? packages.find((p: any) => p.id === contract.package_id)
        : null;

      // Substituir variáveis no template
      let contractContent = (template as any).content;
      
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
        contractContent = contractContent.replace(/\{\{package_name\}\}/g, (packageData as any).name);
        contractContent = contractContent.replace(/\{\{package_price\}\}/g, 
          `R$ ${(contract.package_price || (packageData as any).price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        
        // Features do pacote
        if ((packageData as any).features && (packageData as any).features.length > 0) {
          const featuresList = (packageData as any).features.map((f: string) => `• ${f}`).join('\n');
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

  const fetchContracts = async () => {
    try {
      setLoading(true);
      
      // Safe query helper to handle missing tables
      const safeQuery = async (tableName: string, query: any) => {
        try {
          const result = await query;
          if (result.error) {
            if (result.error.code === 'PGRST205') {
              console.info(`Tabela ${tableName} não encontrada - sistema funcionando sem dados`);
              return { data: [], error: null };
            }
            throw result.error;
          }
          return result;
        } catch (error: any) {
          if (error.code === 'PGRST205') {
            console.info(`Tabela ${tableName} não encontrada - sistema funcionando sem dados`);
            return { data: [], error: null };
          }
          throw error;
        }
      };

      const contractsResult = await safeQuery('contratos',
      if (photographerResult.data) {
        setPhotographerInfo(photographerResult.data);
        setProfileData({
          business_name: photographerResult.data?.business_name || '',
          phone: photographerResult.data?.phone || ''
        });
      // If it's a network error, show a more helpful message
      if (error instanceof Error && error.message.includes('fetch')) {
        console.error('Erro de conexão:', error);
      console.info('Sistema funcionando com dados limitados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotographerInfo = async () => {
    if (!user) return;
    
    try {
      // Safe query helper to handle missing tables
      const safeQuery = async (tableName: string, query: any) => {
        try {
          const result = await query;
          if (result.error) {
            if (result.error.code === 'PGRST205') {
              console.info(`Tabela ${tableName} não encontrada - sistema funcionando sem dados`);
              return { data: null, error: null };
            }
            if (result.error.code === 'PGRST116') {
              console.info(`Nenhum registro encontrado em ${tableName}`);
              return { data: null, error: null };
            }
            throw result.error;
          }
          return result;
        } catch (error: any) {
          if (error.code === 'PGRST205') {
            console.info(`Tabela ${tableName} não encontrada - sistema funcionando sem dados`);
            return { data: null, error: null };
          }
          throw error;
        }
      };

      const photographerResult = await safeQuery('photographers',
        supabase.from('photographers').select('business_name, phone').eq('user_id', user.id).single()
      );
      
      setPhotographerInfo(photographerResult.data);
    } catch (error) {
      console.info('Sistema funcionando sem dados do fotógrafo:', error);
    }
  };

  useEffect(() => {
    fetchContracts();
    if (user) {
      fetchPhotographerInfo();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
      
      setContracts(prevContracts => prevContracts.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      alert('Erro ao excluir contrato');
    }
  };

  const updateContractStatus = async (contractId: string, status: 'draft' | 'sent' | 'signed') => {
    try {
      const { error } = await supabase
        .from('contratos')
        .update({ status })
        .eq('id', contractId);

      if (error) throw error;

      setContracts(prev => prev.map(contract =>
        contract.id === contractId ? { ...contract, status } : contract
      ));
    } catch (error) {
      console.error('Erro ao atualizar status do contrato:', error);
      alert('Erro ao atualizar status do contrato');
    }
  };

  const sendWhatsAppContract = (contract: Contract) => {
    const phone = contract.whatsapp.replace(/\D/g, '');
    const message = `Olá ${contract.nome_completo}! Segue o contrato para seu ${contract.tipo_evento}.`;
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openEditModal = (contract: Contract) => {
    setEditingContract(contract);
    setShowEditModal(true);
  };

  const saveEditedContract = async () => {
    if (!editingContract) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('contratos')
        .update({
          adjusted_price: editingContract.adjusted_price,
          discount_percentage: editingContract.discount_percentage,
          custom_notes: editingContract.custom_notes || null
        })
        .eq('id', editingContract.id);

      if (error) throw error;

      // Update local state
      setContracts(prev => prev.map(contract =>
        contract.id === editingContract.id ? editingContract : contract
      ));

      setShowEditModal(false);
      setEditingContract(null);
    } catch (error) {
      console.error('Erro ao salvar edições:', error);
      alert('Erro ao salvar edições do contrato');
    } finally {
      setSavingEdit(false);
    }
  };

  const copyClientLink = () => {
    const clientLink = `${window.location.origin}?client=true`;
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

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (!whatsapp) return '';
    const clean = whatsapp.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const getStatusColor = (status?: string) => {
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

  const getStatusText = (status?: string) => {
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

  const getEventTypeColor = (type: string) => {
    const colors = {
      'Casamento': 'bg-pink-100 text-pink-800 border border-pink-200',
      'Aniversário': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'Ensaio Fotográfico': 'bg-purple-100 text-purple-800 border border-purple-200',
      'Formatura': 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Filter contracts based on search term and filter type
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchTerm === '' || 
      contract.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cpf.includes(searchTerm) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === '' || contract.tipo_evento === filterType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Sistema de Controle Fotográfico
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bem-vindo, {profileData.name || user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>

              {/* Profile Button */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:block">Perfil</span>
              </button>

              {/* Settings Button */}
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:block">Configurações</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:block">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Action Button */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('form')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Novo Contrato</span>
            </button>
            
            <button
              onClick={copyClientLink}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              {linkCopied ? (
                <>
                  <Check className="h-5 w-5" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Link className="h-5 w-5" />
                  <span>Link para Cliente</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Todos os Contratos</h3>
          </div>
          
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {contracts.length === 0 ? 'Nenhum contrato encontrado' : 'Nenhum resultado encontrado'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {contracts.length === 0 
                  ? 'Comece criando seu primeiro contrato'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data do Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map((contract) => (
                    <tr 
                      key={contract.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowModal(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {contract.tipo_evento}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {contract.nome_completo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {contract.data_evento ? formatDate(contract.data_evento) : 'Não definida'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {contract.cidade}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {contract.adjusted_price 
                            ? formatCurrency(contract.adjusted_price)
                            : formatCurrency(contract.final_price || contract.package_price || 0)
                          }
                        </div>
                        {contract.discount_percentage && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {contract.discount_percentage}% desconto
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Editar Perfil
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Negócio
                </label>
                <input
                  type="text"
                  value={profileData.business_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {savingProfile ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Detalhes do Contrato
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Dados Pessoais</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Nome:</span> {selectedContract.nome_completo}</p>
                  <p><span className="font-medium">CPF:</span> {formatCPF(selectedContract.cpf)}</p>
                  <p><span className="font-medium">Email:</span> {selectedContract.email}</p>
                  <p><span className="font-medium">WhatsApp:</span> {formatWhatsApp(selectedContract.whatsapp)}</p>
                  <p><span className="font-medium">Endereço:</span> {selectedContract.endereco}</p>
                  <p><span className="font-medium">Cidade:</span> {selectedContract.cidade}</p>
                  <p><span className="font-medium">Data de Nascimento:</span> {formatDate(selectedContract.data_nascimento)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Dados do Evento</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Tipo:</span> {selectedContract.tipo_evento}</p>
                  <p><span className="font-medium">Data:</span> {selectedContract.data_evento ? formatDate(selectedContract.data_evento) : 'Não definida'}</p>
                  <p><span className="font-medium">Horário:</span> {selectedContract.horario_evento || 'Não definido'}</p>
                  <p><span className="font-medium">Local da Festa:</span> {selectedContract.local_festa}</p>
                  {selectedContract.nome_noivos && (
                    <p><span className="font-medium">Noivos:</span> {selectedContract.nome_noivos}</p>
                  )}
                  {selectedContract.nome_aniversariante && (
                    <p><span className="font-medium">Aniversariante:</span> {selectedContract.nome_aniversariante}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Valores</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor Original</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedContract.final_price || selectedContract.package_price || 0)}
                  </p>
                </div>
                {selectedContract.discount_percentage && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Desconto</p>
                    <p className="text-lg font-semibold text-green-600">
                      {selectedContract.discount_percentage}%
                    </p>
                  </div>
                )}
                {selectedContract.adjusted_price && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Final</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(selectedContract.adjusted_price)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => generateContract(selectedContract)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Gerar Contrato</span>
              </button>
              
              <button
                onClick={() => sendWhatsAppContract(selectedContract)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => openDiscountModal(selectedContract)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Aplicar Desconto</span>
              </button>
              
              <button
                onClick={() => deleteContract(selectedContract.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && discountContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Aplicar Desconto
              </h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Original
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(discountContract.final_price || discountContract.package_price || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Desconto
                </label>
                <select
                  value={discountData.discountType}
                  onChange={(e) => handleDiscountChange('discountType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>

              {discountData.discountType === 'percentage' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Percentual de Desconto (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={discountData.discountPercentage}
                    onChange={(e) => handleDiscountChange('discountPercentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor do Desconto (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountData.discountAmount}
                    onChange={(e) => handleDiscountChange('discountAmount', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Final
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountData.adjustedPrice}
                  onChange={(e) => handleDiscountChange('adjustedPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observações Personalizadas
                </label>
                <textarea
                  value={discountData.customNotes}
                  onChange={(e) => handleDiscountChange('customNotes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações que aparecerão no contrato..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={applyDiscount}
                disabled={applyingDiscount}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {applyingDiscount ? 'Aplicando...' : 'Aplicar Desconto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Contract Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contrato Gerado
              </h3>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                {generatedContract}
              </pre>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={downloadContract}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Baixar</span>
              </button>
              <button
                onClick={printContract}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}