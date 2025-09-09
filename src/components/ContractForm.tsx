import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Clock, Heart, Gift, Camera, DollarSign, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventType, Package, PaymentMethod, PackagePaymentMethod, ContractData } from '../types';

interface ContractFormProps {
  onBackToList: () => void;
}

export default function ContractForm({ onBackToList }: ContractFormProps) {
  // Form state
  const [formData, setFormData] = useState<ContractData>({
    nome_completo: '',
    cpf: '',
    email: '',
    whatsapp: '',
    endereco: '',
    cidade: '',
    data_nascimento: '',
    tipo_evento: '',
    local_festa: '',
    event_type_id: '',
    package_id: '',
    package_price: 0,
    payment_method_id: '',
    final_price: 0,
    preferred_payment_day: 5,
    data_evento: '',
    horario_evento: '',
    local_pre_wedding: '',
    local_making_of: '',
    local_cerimonia: '',
    nome_noivos: '',
    nome_aniversariante: '',
    adjusted_price: 0,
    discount_percentage: 0,
    custom_notes: ''
  });

  // System data
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [packagePaymentMethods, setPackagePaymentMethods] = useState<PackagePaymentMethod[]>([]);
  const [filteredPaymentMethods, setFilteredPaymentMethods] = useState<PackagePaymentMethod[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSystemData();
  }, []);

  useEffect(() => {
    if (formData.package_id) {
      filterPaymentMethodsForPackage(formData.package_id);
    } else {
      setFilteredPaymentMethods([]);
    }
  }, [formData.package_id, packagePaymentMethods]);

  useEffect(() => {
    if (formData.package_id && formData.payment_method_id) {
      calculateFinalPrice();
    }
  }, [formData.package_id, formData.payment_method_id, formData.discount_percentage]);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      
      const [eventTypesRes, packagesRes, paymentMethodsRes, packagePaymentRes] = await Promise.all([
        supabase.from('event_types').select('*').eq('is_active', true).order('name'),
        supabase.from('packages').select('*').eq('is_active', true).order('name'),
        supabase.from('payment_methods').select('*').eq('is_active', true).order('name'),
        supabase.from('package_payment_methods').select(`
          *,
          payment_method:payment_methods(*)
        `).order('created_at')
      ]);

      if (eventTypesRes.error) throw eventTypesRes.error;
      if (packagesRes.error) throw packagesRes.error;
      if (paymentMethodsRes.error) throw paymentMethodsRes.error;
      if (packagePaymentRes.error) throw packagePaymentRes.error;

      setEventTypes(eventTypesRes.data || []);
      setPackages(packagesRes.data || []);
      setPaymentMethods(paymentMethodsRes.data || []);
      setPackagePaymentMethods(packagePaymentRes.data || []);

    } catch (error) {
      console.error('Erro ao carregar dados do sistema:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const filterPaymentMethodsForPackage = (packageId: string) => {
    const filtered = packagePaymentMethods.filter(ppm => ppm.package_id === packageId);
    setFilteredPaymentMethods(filtered);
    console.log('Formas de pagamento filtradas para o pacote:', filtered);
    
    // Reset payment method if current selection is not available for this package
    if (formData.payment_method_id && !filtered.some(ppm => ppm.payment_method_id === formData.payment_method_id)) {
      setFormData(prev => ({ ...prev, payment_method_id: '', final_price: 0 }));
    }
  };

  const calculateFinalPrice = () => {
    const selectedPackage = packages.find(p => p.id === formData.package_id);
    const selectedPaymentMethod = filteredPaymentMethods.find(ppm => ppm.payment_method_id === formData.payment_method_id);
    
    if (selectedPackage && selectedPaymentMethod) {
      let basePrice = selectedPaymentMethod.final_price;
      
      // Apply discount if any
      if (formData.discount_percentage && formData.discount_percentage > 0) {
        const discountAmount = (basePrice * formData.discount_percentage) / 100;
        basePrice = basePrice - discountAmount;
      }
      
      setFormData(prev => ({
        ...prev,
        package_price: selectedPackage.price,
        final_price: basePrice,
        adjusted_price: basePrice
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.nome_completo.trim()) newErrors.nome_completo = 'Nome completo é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp é obrigatório';
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!formData.cidade.trim()) newErrors.cidade = 'Cidade é obrigatória';
    if (!formData.data_nascimento) newErrors.data_nascimento = 'Data de nascimento é obrigatória';
    if (!formData.tipo_evento.trim()) newErrors.tipo_evento = 'Tipo de evento é obrigatório';
    if (!formData.local_festa.trim()) newErrors.local_festa = 'Local é obrigatório';

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    // CPF validation (basic)
    if (formData.cpf && formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    // WhatsApp validation (basic)
    if (formData.whatsapp && formData.whatsapp.replace(/\D/g, '').length < 10) {
      newErrors.whatsapp = 'WhatsApp inválido';
    }

    // Event-specific validations
    if (formData.tipo_evento === 'Casamento' && !formData.nome_noivos?.trim()) {
      newErrors.nome_noivos = 'Nome dos noivos é obrigatório para casamentos';
    }

    if (formData.tipo_evento === 'Aniversário' && !formData.nome_aniversariante?.trim()) {
      newErrors.nome_aniversariante = 'Nome do aniversariante é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContractData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Reset save status
    setSaveStatus('idle');

    // Handle event type change
    if (field === 'event_type_id') {
      const selectedEventType = eventTypes.find(et => et.id === value);
      if (selectedEventType) {
        setFormData(prev => ({ 
          ...prev, 
          event_type_id: value,
          tipo_evento: selectedEventType.name,
          package_id: '', // Reset package selection
          payment_method_id: '', // Reset payment method
          final_price: 0
        }));
      }
    }

    // Handle package change
    if (field === 'package_id') {
      const selectedPackage = packages.find(p => p.id === value);
      if (selectedPackage) {
        setFormData(prev => ({ 
          ...prev, 
          package_id: value,
          package_price: selectedPackage.price,
          payment_method_id: '', // Reset payment method
          final_price: 0
        }));
      }
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSaveStatus('error');
      return;
    }

    setSaving(true);
    setSaveStatus('idle');

    try {
      // Prepare contract data
      const contractData = {
        nome_completo: formData.nome_completo.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        email: formData.email.trim().toLowerCase(),
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        endereco: formData.endereco.trim(),
        cidade: formData.cidade.trim(),
        data_nascimento: formData.data_nascimento,
        tipo_evento: formData.tipo_evento,
        event_type_id: formData.event_type_id || null,
        package_id: formData.package_id || null,
        package_price: formData.package_price || 0,
        payment_method_id: formData.payment_method_id || null,
        final_price: formData.final_price || 0,
        preferred_payment_day: formData.preferred_payment_day || 5,
        data_evento: formData.data_evento || null,
        horario_evento: formData.horario_evento || null,
        local_pre_wedding: formData.local_pre_wedding?.trim() || null,
        local_making_of: formData.local_making_of?.trim() || null,
        local_cerimonia: formData.local_cerimonia?.trim() || null,
        local_festa: formData.local_festa.trim(),
        nome_noivos: formData.nome_noivos?.trim() || null,
        nome_aniversariante: formData.nome_aniversariante?.trim() || null,
        adjusted_price: formData.adjusted_price || formData.final_price || 0,
        discount_percentage: formData.discount_percentage || 0,
        custom_notes: formData.custom_notes?.trim() || null,
        status: 'draft'
      };

      console.log('Salvando contrato:', contractData);

      const { data, error } = await supabase
        .from('contratos')
        .insert([contractData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar contrato:', error);
        throw error;
      }

      console.log('Contrato salvo com sucesso:', data);
      setSaveStatus('success');
      
      // Reset form after successful save
      setTimeout(() => {
        setFormData({
          nome_completo: '',
          cpf: '',
          email: '',
          whatsapp: '',
          endereco: '',
          cidade: '',
          data_nascimento: '',
          tipo_evento: '',
          local_festa: '',
          event_type_id: '',
          package_id: '',
          package_price: 0,
          payment_method_id: '',
          final_price: 0,
          preferred_payment_day: 5,
          data_evento: '',
          horario_evento: '',
          local_pre_wedding: '',
          local_making_of: '',
          local_cerimonia: '',
          nome_noivos: '',
          nome_aniversariante: '',
          adjusted_price: 0,
          discount_percentage: 0,
          custom_notes: ''
        });
        setSaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Contrato</h1>
              <p className="text-gray-600 mt-1">Preencha os dados para criar um novo contrato</p>
            </div>
            <button
              onClick={onBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {saveStatus === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-green-700">Contrato salvo com sucesso!</span>
          </div>
        )}

        {saveStatus === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700">Erro ao salvar contrato. Verifique os dados e tente novamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Dados Pessoais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nome_completo ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome completo"
                />
                {errors.nome_completo && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome_completo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formatCPF(formData.cpf)}
                  onChange={(e) => handleInputChange('cpf', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cpf ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {errors.cpf && (
                  <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="email@exemplo.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formatWhatsApp(formData.whatsapp)}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value.replace(/\D/g, ''))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.whatsapp ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>
                {errors.whatsapp && (
                  <p className="mt-1 text-sm text-red-600">{errors.whatsapp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.data_nascimento ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.data_nascimento && (
                  <p className="mt-1 text-sm text-red-600">{errors.data_nascimento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cidade ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Digite a cidade"
                  />
                </div>
                {errors.cidade && (
                  <p className="mt-1 text-sm text-red-600">{errors.cidade}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endereco ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Rua, número, bairro, CEP"
                />
                {errors.endereco && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados do Evento */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Dados do Evento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evento *
                </label>
                <select
                  value={formData.event_type_id}
                  onChange={(e) => handleInputChange('event_type_id', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.tipo_evento ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione o tipo de evento</option>
                  {eventTypes.map(eventType => (
                    <option key={eventType.id} value={eventType.id}>
                      {eventType.name}
                    </option>
                  ))}
                </select>
                {errors.tipo_evento && (
                  <p className="mt-1 text-sm text-red-600">{errors.tipo_evento}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Evento
                </label>
                <input
                  type="date"
                  value={formData.data_evento}
                  onChange={(e) => handleInputChange('data_evento', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário do Evento
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="time"
                    value={formData.horario_evento}
                    onChange={(e) => handleInputChange('horario_evento', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.tipo_evento === 'Ensaio Fotográfico' ? 'Local do Ensaio *' : 'Local da Festa *'}
                </label>
                <input
                  type="text"
                  value={formData.local_festa}
                  onChange={(e) => handleInputChange('local_festa', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.local_festa ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={formData.tipo_evento === 'Ensaio Fotográfico' ? 'Local do ensaio' : 'Local da festa'}
                />
                {errors.local_festa && (
                  <p className="mt-1 text-sm text-red-600">{errors.local_festa}</p>
                )}
              </div>

              {/* Campos específicos para casamento */}
              {formData.tipo_evento === 'Casamento' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Heart className="inline h-4 w-4 mr-1" />
                      Nome dos Noivos *
                    </label>
                    <input
                      type="text"
                      value={formData.nome_noivos}
                      onChange={(e) => handleInputChange('nome_noivos', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.nome_noivos ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome do noivo e da noiva"
                    />
                    {errors.nome_noivos && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome_noivos}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local do Pré-Wedding
                    </label>
                    <input
                      type="text"
                      value={formData.local_pre_wedding}
                      onChange={(e) => handleInputChange('local_pre_wedding', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Local do pré-wedding (opcional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local do Making Of
                    </label>
                    <input
                      type="text"
                      value={formData.local_making_of}
                      onChange={(e) => handleInputChange('local_making_of', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Local do making of (opcional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local da Cerimônia
                    </label>
                    <input
                      type="text"
                      value={formData.local_cerimonia}
                      onChange={(e) => handleInputChange('local_cerimonia', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Local da cerimônia (opcional)"
                    />
                  </div>
                </>
              )}

              {/* Campo específico para aniversário */}
              {formData.tipo_evento === 'Aniversário' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Gift className="inline h-4 w-4 mr-1" />
                    Nome do(a) Aniversariante *
                  </label>
                  <input
                    type="text"
                    value={formData.nome_aniversariante}
                    onChange={(e) => handleInputChange('nome_aniversariante', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.nome_aniversariante ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nome do aniversariante"
                  />
                  {errors.nome_aniversariante && (
                    <p className="mt-1 text-sm text-red-600">{errors.nome_aniversariante}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pacotes e Pagamento */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pacotes e Pagamento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pacote
                </label>
                <select
                  value={formData.package_id}
                  onChange={(e) => handleInputChange('package_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.event_type_id}
                >
                  <option value="">Selecione um pacote</option>
                  {packages
                    .filter(pkg => !formData.event_type_id || pkg.event_type_id === formData.event_type_id)
                    .map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - R$ {pkg.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={(e) => handleInputChange('payment_method_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.package_id}
                >
                  <option value="">Selecione a forma de pagamento</option>
                  {filteredPaymentMethods.map(ppm => (
                    <option key={ppm.id} value={ppm.payment_method_id}>
                      {ppm.payment_method?.name} - R$ {ppm.final_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia Preferido para Pagamento
                </label>
                <select
                  value={formData.preferred_payment_day}
                  onChange={(e) => handleInputChange('preferred_payment_day', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      Dia {day}
                    </option>
                  ))}
                </select>
              </div>

              {formData.final_price > 0 && (
                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Preço do Pacote:</span>
                    <span className="text-sm text-gray-600">
                      R$ {(formData.package_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {formData.discount_percentage > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Desconto ({formData.discount_percentage}%):</span>
                      <span className="text-sm text-red-600">
                        -R$ {(((formData.final_price / (1 - formData.discount_percentage / 100)) - formData.final_price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">Valor Final:</span>
                    <span className="text-lg font-bold text-blue-600">
                      R$ {formData.final_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Observações
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações Personalizadas
              </label>
              <textarea
                value={formData.custom_notes}
                onChange={(e) => handleInputChange('custom_notes', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Observações adicionais que aparecerão no contrato..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Salvar Contrato</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}