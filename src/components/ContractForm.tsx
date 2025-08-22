import React, { useState } from 'react';
import { User, FileText, MapPin, Calendar, Camera, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventType, Package, PaymentMethod, PackagePaymentMethod } from '../types';

interface ContractFormProps {
  onBackToList?: () => void;
}

interface ContractData {
  nome_completo: string;
  cpf: string;
  email: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  data_nascimento: string;
  tipo_evento: string;
  local_pre_wedding: string;
  local_making_of: string;
  local_cerimonia: string;
  local_festa: string;
  nome_noivos: string;
  nome_aniversariante: string;
  event_type_id: string;
  package_id: string;
  package_price: number;
  payment_method_id: string;
  final_price: number;
  preferred_payment_day: string;
}

export default function ContractForm({ onBackToList }: ContractFormProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [packagePaymentMethods, setPackagePaymentMethods] = useState<PackagePaymentMethod[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PackagePaymentMethod[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<ContractData>({
    nome_completo: '',
    cpf: '',
    email: '',
    whatsapp: '',
    endereco: '',
    cidade: '',
    data_nascimento: '',
    tipo_evento: '',
    data_evento: '',
    horario_evento: '',
    local_pre_wedding: '',
    local_making_of: '',
    local_cerimonia: '',
    local_festa: '',
    nome_noivos: '',
    nome_aniversariante: '',
    event_type_id: '',
    package_id: '',
    package_price: 0,
    payment_method_id: '',
    final_price: 0,
    preferred_payment_day: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContractData>>({});

  // Check if we're in client mode or editing mode
  const urlParams = new URLSearchParams(window.location.search);
  const isClientMode = urlParams.get('client') === 'true';
  const editId = urlParams.get('edit');

  React.useEffect(() => {
    fetchEventTypesAndPackages();
  }, []);

  const fetchEventTypesAndPackages = async () => {
    try {
      const [eventTypesResponse, packagesResponse, paymentMethodsResponse, packagePaymentMethodsResponse] = await Promise.all([
        supabase.from('event_types').select('*').eq('is_active', true).order('name'),
        supabase.from('packages').select('*').eq('is_active', true).order('name'),
        supabase.from('payment_methods').select('*').eq('is_active', true).order('name'),
        supabase.from('package_payment_methods').select(`
          *,
          payment_method:payment_methods(*)
        `).order('created_at')
      ]);

      if (eventTypesResponse.error) throw eventTypesResponse.error;
      if (packagesResponse.error) throw packagesResponse.error;
      if (paymentMethodsResponse.error) throw paymentMethodsResponse.error;
      if (packagePaymentMethodsResponse.error) throw packagePaymentMethodsResponse.error;

      setEventTypes(eventTypesResponse.data || []);
      setPackages(packagesResponse.data || []);
      setPaymentMethods(paymentMethodsResponse.data || []);
      setPackagePaymentMethods(packagePaymentMethodsResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de eventos e pacotes:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Update available packages when event type changes
  React.useEffect(() => {
    if (formData.event_type_id) {
      const filtered = packages.filter(pkg => pkg.event_type_id === formData.event_type_id);
      setAvailablePackages(filtered);
      // Reset package selection when event type changes
      setFormData(prev => ({ ...prev, package_id: '', package_price: 0, payment_method_id: '', final_price: 0 }));
    } else {
      setAvailablePackages([]);
      setAvailablePaymentMethods([]);
    }
  }, [formData.event_type_id, packages]);

  // Update available payment methods when package changes
  React.useEffect(() => {
    if (formData.package_id) {
      const selectedPackage = packages.find(pkg => pkg.id === formData.package_id);
      if (selectedPackage) {
        setFormData(prev => ({ ...prev, package_price: selectedPackage.price }));
        
        // Filter payment methods for this package
        
        const filtered = packagePaymentMethods.filter(ppm => {
          return ppm.package_id === formData.package_id;
        });
        
        // Se não há formas de pagamento para este pacote, criar automaticamente
        if (filtered.length === 0) {
          createPackagePaymentMethods(formData.package_id, selectedPackage.price);
        } else {
          setAvailablePaymentMethods(filtered);
        }
        
        // Reset payment method selection
        setFormData(prev => ({ ...prev, payment_method_id: '', final_price: 0 }));
      }
    } else {
      setAvailablePaymentMethods([]);
    }
  }, [formData.package_id, packages, packagePaymentMethods]);

  // Update final price when payment method changes
  React.useEffect(() => {
    if (formData.payment_method_id && formData.package_id) {
      const selectedPaymentMethod = availablePaymentMethods.find(ppm => ppm.payment_method_id === formData.payment_method_id);
      if (selectedPaymentMethod) {
        setFormData(prev => ({ ...prev, final_price: selectedPaymentMethod.final_price }));
      }
    } else {
      setFormData(prev => ({ ...prev, final_price: 0 }));
    }
  }, [formData.payment_method_id, availablePaymentMethods]);

  const createPackagePaymentMethods = async (packageId: string, packagePrice: number) => {
    try {
      // First, delete existing associations for this package
      await supabase
        .from('package_payment_methods')
        .delete()
        .eq('package_id', packageId);

      // Get all active payment methods
      const { data: activePaymentMethods, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true);

      if (paymentMethodsError) throw paymentMethodsError;

      if (activePaymentMethods && activePaymentMethods.length > 0) {
        // Create new associations with calculated prices
        const associations = activePaymentMethods.map(method => {
          const discountMultiplier = 1 + (method.discount_percentage / 100);
          const finalPrice = packagePrice * discountMultiplier;
          
          return {
            package_id: packageId,
            payment_method_id: method.id,
            final_price: finalPrice
          };
        });

        const { data: insertedData, error: insertError } = await supabase
          .from('package_payment_methods')
          .insert(associations)
          .select(`
            *,
            payment_method:payment_methods(*)
          `);

        if (insertError) throw insertError;
        
        // Update local state with new associations
        if (insertedData) {
          setPackagePaymentMethods(prev => [...prev, ...insertedData]);
          setAvailablePaymentMethods(insertedData);
        }
      }
    } catch (error) {
      console.error('Erro ao criar associações de pagamento:', error);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const formatWhatsApp = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateWhatsApp = (whatsapp: string): boolean => {
    const cleanWhatsApp = whatsapp.replace(/\D/g, '');
    return cleanWhatsApp.length === 11;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContractData> = {};

    if (!formData.nome_completo.trim()) {
      newErrors.nome_completo = 'Nome completo é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'E-mail deve ter um formato válido';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório';
    } else if (!validateWhatsApp(formData.whatsapp)) {
      newErrors.whatsapp = 'WhatsApp deve ter 11 dígitos (DDD + número)';
    }

    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }

    if (!formData.cidade.trim()) {
      newErrors.cidade = 'Cidade é obrigatória';
    }

    if (!formData.data_nascimento) {
      newErrors.data_nascimento = 'Data de nascimento é obrigatória';
    }

    if (!formData.tipo_evento) {
      newErrors.tipo_evento = 'Tipo de evento é obrigatório';
    }

    if (!formData.event_type_id) {
      newErrors.event_type_id = 'Tipo de evento é obrigatório';
    }

    if (!formData.package_id) {
      newErrors.package_id = 'Pacote é obrigatório';
    }

    if (!formData.data_evento) {
      newErrors.data_evento = 'Data do evento é obrigatória';
    }

    if (!formData.horario_evento) {
      newErrors.horario_evento = 'Horário do evento é obrigatório';
    }

    if (formData.payment_method_id && !formData.preferred_payment_day) {
      newErrors.preferred_payment_day = 'Dia do pagamento é obrigatório quando uma forma de pagamento é selecionada';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'whatsapp') {
      formattedValue = formatWhatsApp(value);
    } else if (name === 'event_type_id') {
      // When event type changes, also update the tipo_evento field for backward compatibility
      const selectedEventType = eventTypes.find(et => et.id === value);
      if (selectedEventType) {
        setFormData(prev => ({
          ...prev,
          [name]: formattedValue,
          tipo_evento: selectedEventType.name
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ContractData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { data, error } = await supabase
        .from('contratos')
        .insert([{
          nome_completo: formData.nome_completo,
          cpf: formData.cpf.replace(/\D/g, ''),
          email: formData.email,
          whatsapp: formData.whatsapp.replace(/\D/g, ''),
          endereco: formData.endereco,
          cidade: formData.cidade,
          data_nascimento: formData.data_nascimento,
          tipo_evento: formData.tipo_evento || eventTypes.find(et => et.id === formData.event_type_id)?.name || '',
          event_type_id: formData.event_type_id,
          package_id: formData.package_id,
          package_price: formData.package_price,
          payment_method_id: formData.payment_method_id || null,
          final_price: formData.final_price || formData.package_price,
          preferred_payment_day: formData.preferred_payment_day ? parseInt(formData.preferred_payment_day) : null,
          data_evento: formData.data_evento,
          horario_evento: formData.horario_evento,
          local_pre_wedding: formData.local_pre_wedding || null,
          local_making_of: formData.local_making_of || null,
          local_cerimonia: formData.local_cerimonia || null,
          local_festa: formData.local_festa,
          nome_noivos: formData.nome_noivos || null,
          nome_aniversariante: formData.nome_aniversariante || null,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setSubmitStatus('success');
      
      console.log('Contrato salvo com sucesso:', data);
      
      // If not in client mode, go back to list after 2 seconds
      if (!isClientMode && onBackToList) {
        setTimeout(() => {
          onBackToList();
        }, 2000);
      } else if (isClientMode) {
        // Em modo cliente, mostrar mensagem de sucesso por mais tempo
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 5000);
      }
      
      setFormData({
        nome_completo: '',
        cpf: '',
        email: '',
        whatsapp: '',
        endereco: '',
        cidade: '',
        data_nascimento: '',
        tipo_evento: '',
        data_evento: '',
        horario_evento: '',
        local_pre_wedding: '',
        local_making_of: '',
        local_cerimonia: '',
        local_festa: '',
        nome_noivos: '',
        nome_aniversariante: '',
        event_type_id: '',
        package_id: '',
        package_price: 0,
        payment_method_id: '',
        final_price: 0,
        preferred_payment_day: '',
      });
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventType = eventTypes.find(et => et.id === formData.event_type_id);
  const selectedPackage = packages.find(pkg => pkg.id === formData.package_id);
  
  const isCasamento = selectedEventType?.name === 'Casamento';
  const isAniversario = selectedEventType?.name?.includes('Aniversário');
  const isEnsaio = selectedEventType?.name === 'Ensaio Fotográfico';

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Navigation Header */}
        {!isClientMode && onBackToList && (
          <div className="mb-6">
            <button
              onClick={onBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para Gestão</span>
            </button>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dados para Contrato</h1>
          <p className="text-gray-600">Preencha as informações necessárias para o seu evento</p>
        </div>

        {submitStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-green-700">Dados salvos com sucesso!</span>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700">Erro ao salvar dados. Tente novamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Dados Pessoais</h2>
            </div>

            <div>
              <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.nome_completo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu nome completo"
              />
              {errors.nome_completo && (
                <p className="mt-1 text-sm text-red-600">{errors.nome_completo}</p>
              )}
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                CPF *
              </label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                maxLength={14}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.cpf ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="000.000.000-00"
              />
              {errors.cpf && (
                <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite seu e-mail"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp *
              </label>
              <input
                type="text"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                maxLength={15}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.whatsapp ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="(11) 99999-9999"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-red-600">{errors.whatsapp}</p>
              )}
            </div>

            <div>
              <label htmlFor="data_nascimento" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento *
              </label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.data_nascimento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.data_nascimento && (
                <p className="mt-1 text-sm text-red-600">{errors.data_nascimento}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Endereço</h2>
            </div>

            <div>
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Completo *
              </label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.endereco ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Rua, número, bairro, CEP"
              />
              {errors.endereco && (
                <p className="mt-1 text-sm text-red-600">{errors.endereco}</p>
              )}
            </div>

            <div>
              <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.cidade ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Digite sua cidade"
              />
              {errors.cidade && (
                <p className="mt-1 text-sm text-red-600">{errors.cidade}</p>
              )}
            </div>
          </div>

          {/* Tipo de Evento */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Evento</h2>
            </div>

            <div>
              <label htmlFor="event_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Evento *
              </label>
              <select
                id="event_type_id"
                name="event_type_id"
                value={formData.event_type_id}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.event_type_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o tipo de evento</option>
                {eventTypes.map((eventType) => (
                  <option key={eventType.id} value={eventType.id}>
                    {eventType.name}
                  </option>
                ))}
              </select>
              {errors.event_type_id && (
                <p className="mt-1 text-sm text-red-600">{errors.event_type_id}</p>
              )}
            </div>

            {/* Seleção de Pacote */}
            {formData.event_type_id && (
              <div>
                <label htmlFor="package_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Pacote *
                </label>
                <select
                  id="package_id"
                  name="package_id"
                  value={formData.package_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.package_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um pacote</option>
                  {availablePackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - R$ {pkg.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                {errors.package_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.package_id}</p>
                )}
                
                {/* Detalhes do Pacote Selecionado */}
                {selectedPackage && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">{selectedPackage.name}</h4>
                    <p className="text-sm text-blue-800 mb-2">{selectedPackage.description}</p>
                    <p className="text-lg font-semibold text-blue-900 mb-2">
                      R$ {selectedPackage.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {selectedPackage.features.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Inclui:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {selectedPackage.features.map((feature, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Seleção de Forma de Pagamento */}
            {formData.package_id && availablePaymentMethods.length > 0 && (
              <div>
                <label htmlFor="payment_method_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  id="payment_method_id"
                  name="payment_method_id"
                  value={formData.payment_method_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione a forma de pagamento</option>
                  {availablePaymentMethods.map((ppm) => (
                    <option key={ppm.id} value={ppm.payment_method_id}>
                      {ppm.payment_method?.name} - R$ {ppm.final_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
                
                {/* Detalhes da Forma de Pagamento Selecionada */}
                {formData.payment_method_id && (
                  (() => {
                    const selectedPaymentMethod = availablePaymentMethods.find(ppm => ppm.payment_method_id === formData.payment_method_id);
                    const paymentMethodDetails = selectedPaymentMethod?.payment_method;
                    
                    if (!paymentMethodDetails) return null;
                    
                    return (
                      <div className="mt-3 p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">{paymentMethodDetails.name}</h4>
                        <p className="text-sm text-green-800 mb-2">{paymentMethodDetails.description}</p>
                        
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-green-800">Preço original:</span>
                          <span className="text-sm text-green-800">R$ {formData.package_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        {paymentMethodDetails.discount_percentage !== 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-green-800">
                              {paymentMethodDetails.discount_percentage > 0 ? 'Acréscimo' : 'Desconto'}:
                            </span>
                            <span className="text-sm font-medium text-green-800">
                              {paymentMethodDetails.discount_percentage > 0 ? '+' : ''}{paymentMethodDetails.discount_percentage}%
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mb-3 pt-2 border-t border-green-200">
                          <span className="text-lg font-semibold text-green-900">Preço final:</span>
                          <span className="text-lg font-semibold text-green-900">
                            R$ {formData.final_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        {paymentMethodDetails.payment_schedule.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-900 mb-2">Cronograma de pagamento:</p>
                            <ul className="text-sm text-green-800 space-y-1">
                              {paymentMethodDetails.payment_schedule.map((schedule, index) => (
                                <li key={index} className="flex items-center space-x-2">
                                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                                  <span>
                                    {schedule.percentage > 0 
                                      ? `${schedule.percentage}% - ${schedule.description}`
                                      : schedule.description
                                    }
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
                
                {/* Seleção do Dia de Pagamento */}
                {formData.payment_method_id && (
                  <div>
                    <label htmlFor="preferred_payment_day" className="block text-sm font-medium text-gray-700 mb-2">
                      Dia do Mês para Pagamento *
                    </label>
                    <select
                      id="preferred_payment_day"
                      name="preferred_payment_day"
                      value={formData.preferred_payment_day}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Selecione o dia do mês</option>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          Dia {day}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      Escolha o dia do mês em que você prefere fazer os pagamentos (limitado até o dia 28 para garantir que existe em todos os meses)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Data e Horário do Evento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="data_evento" className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Evento *
                </label>
                <input
                  type="date"
                  id="data_evento"
                  name="data_evento"
                  value={formData.data_evento}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.data_evento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.data_evento && (
                  <p className="mt-1 text-sm text-red-600">{errors.data_evento}</p>
                )}
              </div>

              <div>
                <label htmlFor="horario_evento" className="block text-sm font-medium text-gray-700 mb-2">
                  Horário do Evento *
                </label>
                <input
                  type="time"
                  id="horario_evento"
                  name="horario_evento"
                  value={formData.horario_evento}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.horario_evento ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.horario_evento && (
                  <p className="mt-1 text-sm text-red-600">{errors.horario_evento}</p>
                )}
              </div>
            </div>

            {/* Debug: Mostrar informações para verificar */}
          </div>

          {/* Detalhes do Evento */}
          {formData.event_type_id && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Detalhes do Evento</h2>
              </div>

              {/* Nome dos Noivos - apenas para casamentos */}
              {isCasamento && (
                <div>
                  <label htmlFor="nome_noivos" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome dos Noivos
                  </label>
                  <input
                    type="text"
                    id="nome_noivos"
                    name="nome_noivos"
                    value={formData.nome_noivos}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ex: João Silva & Maria Santos"
                  />
                </div>
              )}

              {/* Nome do Aniversariante - apenas para aniversários */}
              {isAniversario && (
                <div>
                  <label htmlFor="nome_aniversariante" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do(a) Aniversariante
                  </label>
                  <input
                    type="text"
                    id="nome_aniversariante"
                    name="nome_aniversariante"
                    value={formData.nome_aniversariante}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Digite o nome do(a) aniversariante"
                  />
                </div>
              )}

              {/* Campos de Local - específicos para casamento */}
              {isCasamento && (
                <>
                  <div>
                    <label htmlFor="local_pre_wedding" className="block text-sm font-medium text-gray-700 mb-2">
                      Local do Pré-Wedding
                    </label>
                    <input
                      type="text"
                      id="local_pre_wedding"
                      name="local_pre_wedding"
                      value={formData.local_pre_wedding}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Local onde será realizado o pré-wedding"
                    />
                  </div>

                  <div>
                    <label htmlFor="local_making_of" className="block text-sm font-medium text-gray-700 mb-2">
                      Local do Making Of
                    </label>
                    <input
                      type="text"
                      id="local_making_of"
                      name="local_making_of"
                      value={formData.local_making_of}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Local dos preparativos (making of)"
                    />
                  </div>

                  <div>
                    <label htmlFor="local_cerimonia" className="block text-sm font-medium text-gray-700 mb-2">
                      Local da Cerimônia
                    </label>
                    <input
                      type="text"
                      id="local_cerimonia"
                      name="local_cerimonia"
                      value={formData.local_cerimonia}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Igreja, cartório ou local da cerimônia"
                    />
                  </div>
                </>
              )}

              {/* Local da Festa - obrigatório para todos */}
              <div>
                <label htmlFor="local_festa" className="block text-sm font-medium text-gray-700 mb-2">
                  {isEnsaio ? 'Local do Ensaio' : 'Local da Festa'}
                </label>
                <input
                  type="text"
                  id="local_festa"
                  name="local_festa"
                  value={formData.local_festa}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={
                    isCasamento 
                      ? "Local da recepção/festa de casamento"
                      : isAniversario 
                      ? "Local da festa de aniversário"
                      : isEnsaio
                      ? "Local onde será realizado o ensaio fotográfico"
                      : "Local onde será realizado o evento"
                  }
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Salvar Dados do Contrato</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}