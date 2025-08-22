import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, Save, X, ArrowLeft, Package as PackageIcon, Calendar, FileText, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventType, Package, ContractTemplate, PaymentMethod, PackagePaymentMethod } from '../types';

interface SystemSettingsProps {
  onBack: () => void;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [packagePaymentMethods, setPackagePaymentMethods] = useState<PackagePaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'packages' | 'templates' | 'payments'>('events');
  
  // Event Type Form
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [newEventType, setNewEventType] = useState({ name: '' });
  const [showEventTypeForm, setShowEventTypeForm] = useState(false);
  
  // Package Form
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [newPackage, setNewPackage] = useState({
    event_type_id: '',
    name: '',
    description: '',
    price: '',
    features: ['']
  });
  const [showPackageForm, setShowPackageForm] = useState(false);
  
  // Template Form
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    event_type_id: '',
    name: '',
    content: ''
  });
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Payment Method Form
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: '',
    description: '',
    discount_percentage: '0',
    installments: '1',
    payment_schedule: [{ percentage: 0, description: '' }]
  });
  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventTypesResponse, packagesResponse, templatesResponse, paymentMethodsResponse, packagePaymentMethodsResponse] = await Promise.all([
        supabase.from('event_types').select('*').order('name'),
        supabase.from('packages').select('*').order('name'),
        supabase.from('contract_templates').select('*').order('name'),
        supabase.from('payment_methods').select('*').order('name'),
        supabase.from('package_payment_methods').select(`
          *,
          package:packages(name),
          payment_method:payment_methods(name)
        `).order('created_at')
      ]);

      if (eventTypesResponse.error) throw eventTypesResponse.error;
      if (packagesResponse.error) throw packagesResponse.error;
      if (templatesResponse.error) throw templatesResponse.error;
      if (paymentMethodsResponse.error) throw paymentMethodsResponse.error;
      if (packagePaymentMethodsResponse.error) throw packagePaymentMethodsResponse.error;

      setEventTypes(eventTypesResponse.data || []);
      setPackages(packagesResponse.data || []);
      setTemplates(templatesResponse.data || []);
      setPaymentMethods(paymentMethodsResponse.data || []);
      setPackagePaymentMethods(packagePaymentMethodsResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEventType = async () => {
    try {
      if (editingEventType) {
        const { error } = await supabase
          .from('event_types')
          .update({ name: newEventType.name })
          .eq('id', editingEventType.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('event_types')
          .insert([{ name: newEventType.name }]);
        
        if (error) throw error;
      }

      await fetchData();
      setShowEventTypeForm(false);
      setEditingEventType(null);
      setNewEventType({ name: '' });
    } catch (error) {
      console.error('Erro ao salvar tipo de evento:', error);
    }
  };

  const handleDeleteEventType = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de evento? Todos os pacotes relacionados também serão excluídos.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('event_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir tipo de evento:', error);
    }
  };

  const handleSavePackage = async () => {
    try {
      const packageData = {
        event_type_id: newPackage.event_type_id,
        name: newPackage.name,
        description: newPackage.description,
        price: parseFloat(newPackage.price),
        features: newPackage.features.filter(f => f.trim() !== '')
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id);
        
        if (error) throw error;
        
        // Atualizar associações de pagamento para este pacote
        await createPackagePaymentMethods(editingPackage.id, parseFloat(newPackage.price));
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert([packageData])
          .select()
          .single();
        
        if (error) throw error;
        
        // Criar associações de pagamento para o novo pacote
        if (data) {
          await createPackagePaymentMethods(data.id, parseFloat(newPackage.price));
        }
      }

      await fetchData();
      setShowPackageForm(false);
      setEditingPackage(null);
      setNewPackage({
        event_type_id: '',
        name: '',
        description: '',
        price: '',
        features: ['']
      });
    } catch (error) {
      console.error('Erro ao salvar pacote:', error);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir pacote:', error);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        event_type_id: newTemplate.event_type_id,
        name: newTemplate.name,
        content: newTemplate.content
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('contract_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contract_templates')
          .insert([templateData]);
        
        if (error) throw error;
      }

      await fetchData();
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setNewTemplate({
        event_type_id: '',
        name: '',
        content: ''
      });
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo de contrato?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
    }
  };

  const handleSavePaymentMethod = async () => {
    try {
      const paymentMethodData = {
        name: newPaymentMethod.name,
        description: newPaymentMethod.description,
        discount_percentage: parseFloat(newPaymentMethod.discount_percentage),
        installments: parseInt(newPaymentMethod.installments),
        payment_schedule: newPaymentMethod.payment_schedule.filter(s => s.description.trim() !== '')
      };

      if (editingPaymentMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(paymentMethodData)
          .eq('id', editingPaymentMethod.id);
        
        if (error) throw error;
        
        // Atualizar associações existentes para todos os pacotes
        await updateAllPackagePaymentMethods();
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([paymentMethodData]);
        
        if (error) throw error;
        
        // Criar associações para todos os pacotes existentes
        await createPaymentMethodForAllPackages();
      }

      await fetchData();
      setShowPaymentMethodForm(false);
      setEditingPaymentMethod(null);
      setNewPaymentMethod({
        name: '',
        description: '',
        discount_percentage: '0',
        installments: '1',
        payment_schedule: [{ percentage: 0, description: '' }]
      });
    } catch (error) {
      console.error('Erro ao salvar forma de pagamento:', error);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir forma de pagamento:', error);
    }
  };
  const startEditEventType = (eventType: EventType) => {
    setEditingEventType(eventType);
    setNewEventType({ name: eventType.name });
    setShowEventTypeForm(true);
  };

  const startEditPackage = (pkg: PackageType) => {
    setEditingPackage(pkg);
    setNewPackage({
      event_type_id: pkg.event_type_id,
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      features: pkg.features.length > 0 ? pkg.features : ['']
    });
    setShowPackageForm(true);
  };

  const startEditTemplate = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      event_type_id: template.event_type_id,
      name: template.name,
      content: template.content
    });
    setShowTemplateForm(true);
  };

  const startEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setNewPaymentMethod({
      name: paymentMethod.name,
      description: paymentMethod.description || '',
      discount_percentage: paymentMethod.discount_percentage.toString(),
      installments: paymentMethod.installments.toString(),
      payment_schedule: paymentMethod.payment_schedule.length > 0 
        ? paymentMethod.payment_schedule 
        : [{ percentage: 0, description: '' }]
    });
    setShowPaymentMethodForm(true);
  };
  const addFeature = () => {
    setNewPackage(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addScheduleItem = () => {
    setNewPaymentMethod(prev => ({
      ...prev,
      payment_schedule: [...prev.payment_schedule, { percentage: 0, description: '' }]
    }));
  };

  const updateScheduleItem = (index: number, field: 'percentage' | 'description', value: string | number) => {
    setNewPaymentMethod(prev => ({
      ...prev,
      payment_schedule: prev.payment_schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeScheduleItem = (index: number) => {
    setNewPaymentMethod(prev => ({
      ...prev,
      payment_schedule: prev.payment_schedule.filter((_, i) => i !== index)
    }));
  };
  const getEventTypeName = (eventTypeId: string) => {
    const eventType = eventTypes.find(et => et.id === eventTypeId);
    return eventType?.name || 'Tipo não encontrado';
  };

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

        const { error: insertError } = await supabase
          .from('package_payment_methods')
          .insert(associations);

        if (insertError) throw insertError;
      }

    } catch (error) {
      console.error('Erro ao criar associações de pagamento:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                  <p className="text-gray-600">Gerencie tipos de eventos e pacotes</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Tipos de Eventos</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'packages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <PackageIcon className="h-4 w-4" />
                  <span>Pacotes</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Modelos de Contrato</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Formas de Pagamento</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'events' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Tipos de Eventos</h2>
                  <button
                    onClick={() => setShowEventTypeForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Tipo</span>
                  </button>
                </div>

                {showEventTypeForm && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {editingEventType ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'}
                    </h3>
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={newEventType.name}
                        onChange={(e) => setNewEventType({ name: e.target.value })}
                        placeholder="Nome do tipo de evento"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSaveEventType}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Salvar</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowEventTypeForm(false);
                          setEditingEventType(null);
                          setNewEventType({ name: '' });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {eventTypes.map((eventType) => (
                    <div key={eventType.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{eventType.name}</h3>
                        <p className="text-sm text-gray-500">
                          {packages.filter(p => p.event_type_id === eventType.id).length} pacotes
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditEventType(eventType)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEventType(eventType.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Pacotes</h2>
                  <button
                    onClick={() => setShowPackageForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Pacote</span>
                  </button>
                </div>

                {showPackageForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
                        <select
                          value={newPackage.event_type_id}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, event_type_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione um tipo</option>
                          {eventTypes.map((eventType) => (
                            <option key={eventType.id} value={eventType.id}>
                              {eventType.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Pacote</label>
                        <input
                          type="text"
                          value={newPackage.name}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nome do pacote"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <input
                          type="text"
                          value={newPackage.description}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Descrição do pacote"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newPackage.price}
                          onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Características do Pacote</label>
                      {newPackage.features.map((feature, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Característica do pacote"
                          />
                          {newPackage.features.length > 1 && (
                            <button
                              onClick={() => removeFeature(index)}
                              className="text-red-600 hover:text-red-900 p-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addFeature}
                        className="text-blue-600 hover:text-blue-900 text-sm flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar característica</span>
                      </button>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSavePackage}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Salvar</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPackageForm(false);
                          setEditingPackage(null);
                          setNewPackage({
                            event_type_id: '',
                            name: '',
                            description: '',
                            price: '',
                            features: ['']
                          });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {getEventTypeName(pkg.event_type_id)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                          <p className="text-lg font-semibold text-green-600">
                            R$ {pkg.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {pkg.features.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Inclui:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {pkg.features.map((feature, index) => (
                                  <li key={index} className="flex items-center space-x-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => startEditPackage(pkg)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Modelos de Contrato</h2>
                  <button
                    onClick={() => setShowTemplateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Novo Modelo</span>
                  </button>
                </div>

                {showTemplateForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {editingTemplate ? 'Editar Modelo de Contrato' : 'Novo Modelo de Contrato'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
                        <select
                          value={newTemplate.event_type_id}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, event_type_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione um tipo</option>
                          {eventTypes.map((eventType) => (
                            <option key={eventType.id} value={eventType.id}>
                              {eventType.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Modelo</label>
                        <input
                          type="text"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nome do modelo"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo do Contrato</label>
                      <div className="mb-2 text-xs text-gray-500">
                        <p>Use as seguintes variáveis no texto:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                          <code>{'{{nome_completo}}'}</code>
                          <code>{'{{cpf}}'}</code>
                          <code>{'{{email}}'}</code>
                          <code>{'{{whatsapp}}'}</code>
                          <code>{'{{endereco}}'}</code>
                          <code>{'{{cidade}}'}</code>
                          <code>{'{{data_nascimento}}'}</code>
                          <code>{'{{tipo_evento}}'}</code>
                          <code>{'{{data_evento}}'}</code>
                          <code>{'{{horario_evento}}'}</code>
                          <code>{'{{package_name}}'}</code>
                          <code>{'{{package_price}}'}</code>
                          <code>{'{{nome_noivos}}'}</code>
                          <code>{'{{nome_aniversariante}}'}</code>
                          <code>{'{{local_festa}}'}</code>
                          <code>{'{{local_pre_wedding}}'}</code>
                          <code>{'{{local_making_of}}'}</code>
                          <code>{'{{local_cerimonia}}'}</code>
                        </div>
                      </div>
                      <textarea
                        value={newTemplate.content}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                        rows={15}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="Digite o conteúdo do contrato aqui..."
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleSaveTemplate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Salvar</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowTemplateForm(false);
                          setEditingTemplate(null);
                          setNewTemplate({
                            event_type_id: '',
                            name: '',
                            content: ''
                          });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {getEventTypeName(template.event_type_id)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-2 max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-xs">{template.content.substring(0, 300)}...</pre>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => startEditTemplate(template)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Formas de Pagamento</h2>
                  <button
                    onClick={() => setShowPaymentMethodForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nova Forma</span>
                  </button>
                </div>

                {showPaymentMethodForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                        <input
                          type="text"
                          value={newPaymentMethod.name}
                          onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: À vista, Parcelado, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Número de Parcelas</label>
                        <input
                          type="number"
                          min="1"
                          value={newPaymentMethod.installments}
                          onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, installments: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <input
                          type="text"
                          value={newPaymentMethod.description}
                          onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Descrição da forma de pagamento"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Desconto/Acréscimo (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newPaymentMethod.discount_percentage}
                          onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, discount_percentage: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0 (negativo para desconto, positivo para acréscimo)"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cronograma de Pagamento</label>
                      <p className="text-xs text-gray-500 mb-3">
                        Configure as porcentagens e descrições para cada parcela. Se não definir porcentagens, será dividido igualmente.
                      </p>
                      {newPaymentMethod.payment_schedule.map((schedule, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={schedule.percentage}
                            onChange={(e) => updateScheduleItem(index, 'percentage', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <span className="flex items-center text-sm text-gray-500">%</span>
                          <input
                            type="text"
                            value={schedule.description}
                            onChange={(e) => updateScheduleItem(index, 'description', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Entrada, Saldo final, etc."
                          />
                          {newPaymentMethod.payment_schedule.length > 1 && (
                            <button
                              onClick={() => removeScheduleItem(index)}
                              className="text-red-600 hover:text-red-900 p-2"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addScheduleItem}
                        className="text-blue-600 hover:text-blue-900 text-sm flex items-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Adicionar parcela</span>
                      </button>
                    <div className="flex space-x-4">
                      <button
                        onClick={handleSavePaymentMethod}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Salvar</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowPaymentMethodForm(false);
                          setEditingPaymentMethod(null);
                          setNewPaymentMethod({
                            name: '',
                            description: '',
                            discount_percentage: '0',
                            installments: '1',
                            payment_schedule: [{ percentage: 0, description: '' }]
                          });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                )}
                    </div>
                <div className="grid gap-4">
                  {paymentMethods.map((paymentMethod) => (
                    <div key={paymentMethod.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{paymentMethod.name}</h3>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {paymentMethod.installments}x
                            </span>
                            {paymentMethod.discount_percentage !== 0 && (
                              <span className={`text-sm px-2 py-1 rounded ${
                                paymentMethod.discount_percentage > 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {paymentMethod.discount_percentage > 0 ? '+' : ''}{paymentMethod.discount_percentage}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{paymentMethod.description}</p>
                          {paymentMethod.payment_schedule.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Cronograma:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {paymentMethod.payment_schedule.map((schedule, index) => (
                                  <li key={index} className="flex items-center space-x-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
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
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => startEditPaymentMethod(paymentMethod)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}