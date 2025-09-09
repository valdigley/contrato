import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, Save, ArrowLeft, CheckCircle, AlertCircle, Settings, Camera, MapPin, Instagram } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface UserProfileProps {
  onBack: () => void;
}

interface BusinessData {
  id: string;
  nome_estudio: string;
  address?: string;
  whatsapp?: string;
  email: string;
  city?: string;
  state?: string;
  instagram?: string;
  document?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useAuth();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    nome_estudio: '',
    address: '',
    whatsapp: '',
    email: '',
    city: '',
    state: '',
    instagram: '',
    document: '',
    zip_code: ''
  });

  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      
      // Fetch business data
      const { data: businessResponse, error: businessError } = await supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (businessError) {
        console.error('Error fetching business data:', businessError);
        setBusinessData(null);
      } else {
        setBusinessData(businessResponse);
      }

      // Fill form with business data
      setFormData({
        nome_estudio: businessResponse?.nome_estudio || '',
        address: businessResponse?.address || '',
        whatsapp: businessResponse?.whatsapp || '',
        email: businessResponse?.email || '',
        city: businessResponse?.city || '',
        state: businessResponse?.state || '',
        instagram: businessResponse?.instagram || '',
        document: businessResponse?.document || '',
        zip_code: businessResponse?.zip_code || ''
      });

    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveStatus('idle');
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      if (businessData) {
        // Update existing business info
        const { error: updateError } = await supabase
          .from('business_info')
          .update({
            nome_estudio: formData.nome_estudio,
            address: formData.address,
            whatsapp: formData.whatsapp,
            email: formData.email,
            city: formData.city,
            state: formData.state,
            instagram: formData.instagram,
            document: formData.document,
            zip_code: formData.zip_code
          })
          .eq('id', businessData.id);

        if (updateError) throw updateError;
      } else {
        // Create new business info
        const { error: insertError } = await supabase
          .from('business_info')
          .insert({
            nome_estudio: formData.nome_estudio,
            address: formData.address,
            whatsapp: formData.whatsapp,
            email: formData.email,
            city: formData.city,
            state: formData.state,
            instagram: formData.instagram,
            document: formData.document,
            zip_code: formData.zip_code
          });

        if (insertError) throw insertError;
      }

      setSaveStatus('success');
      await fetchBusinessData(); // Reload data

    } catch (error) {
      console.error('Error saving profile:', error);
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
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Informações do Negócio</h1>
                <p className="text-gray-600">Gerencie as informações da sua empresa</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {saveStatus === 'success' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <span className="text-green-700">Informações atualizadas com sucesso!</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">Erro ao salvar informações. Tente novamente.</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Dados da Empresa */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Dados da Empresa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome_estudio" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Estúdio
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="nome_estudio"
                      value={formData.nome_estudio}
                      onChange={(e) => handleInputChange('nome_estudio', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Digite o nome do estúdio"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ/CPF
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="document"
                      value={formData.document}
                      onChange={(e) => handleInputChange('document', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dados de Contato */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-green-600" />
                Dados de Contato
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="contato@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="@suaempresa"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Endereço
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="00000-000"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Sua cidade"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="SP"
                  />
                </div>
              </div>
            </div>

            {/* Informações do Sistema */}
            {businessData && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Informações do Sistema
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">ID do Registro:</span>
                    <span className="text-sm text-gray-600 font-mono">{businessData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Criado em:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(businessData.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Última atualização:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(businessData.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}