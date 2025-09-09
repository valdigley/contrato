import React, { useState, useEffect } from 'react';
import { User, Building2, Phone, Mail, Save, ArrowLeft, CheckCircle, AlertCircle, Settings, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface UserProfileProps {
  onBack: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface PhotographerData {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  settings: any;
  created_at: string;
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [photographerData, setPhotographerData] = useState<PhotographerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário
      const { data: userResponse, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) {
        if (userError.code === 'PGRST205') {
          console.warn('Tabela users não encontrada');
          setUserData(null);
        } else {
          throw userError;
        }
      } else {
        setUserData(userResponse);
      }

      // Buscar dados do fotógrafo
      const { data: photographerResponse, error: photographerError } = await supabase
        .from('photographers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (photographerError && photographerError.code !== 'PGRST116' && photographerError.code !== 'PGRST205') {
        console.error('Erro ao buscar dados do fotógrafo:', photographerError);
      } else if (photographerError && photographerError.code === 'PGRST205') {
        console.warn('Tabela photographers não encontrada');
        setPhotographerData(null);
      } else {
        setPhotographerData(photographerResponse || null);
      }


      // Preencher formulário
      setFormData({
        name: userResponse?.name || user?.user_metadata?.name || '',
        business_name: photographerResponse?.business_name || '',
        phone: photographerResponse?.phone || '',
        email: userResponse?.email || user?.email || ''
      });

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
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
      // Atualizar dados do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Atualizar ou criar dados do fotógrafo
      if (photographerData) {
        // Atualizar
        const { error: photographerError } = await supabase
          .from('photographers')
          .update({
            business_name: formData.business_name,
            phone: formData.phone
          })
          .eq('user_id', user.id);

        if (photographerError) throw photographerError;
      } else {
        // Criar
        const { error: photographerError } = await supabase
          .from('photographers')
          .insert([{
            user_id: user.id,
            business_name: formData.business_name,
            phone: formData.phone,
            settings: {}
          }]);

        if (photographerError) throw photographerError;
      }

      setSaveStatus('success');
      await fetchUserData(); // Recarregar dados

    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
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
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-600">Gerencie suas informações pessoais e profissionais</p>
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
              <span className="text-green-700">Perfil atualizado com sucesso!</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">Erro ao salvar perfil. Tente novamente.</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Dados Pessoais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Dados Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                </div>

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
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      placeholder="E-mail não pode ser alterado"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    O e-mail não pode ser alterado após o cadastro
                  </p>
                </div>
              </div>
            </div>

            {/* Dados Profissionais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-green-600" />
                Dados Profissionais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Negócio/Empresa
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: João Silva Fotografia"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone/WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Informações da Conta */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Informações da Conta
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">ID da Conta:</span>
                  <span className="text-sm text-gray-600 font-mono">{userData?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Tipo de Conta:</span>
                  <span className="text-sm text-gray-600 capitalize">{userData?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Membro desde:</span>
                  <span className="text-sm text-gray-600">
                    {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            </div>

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