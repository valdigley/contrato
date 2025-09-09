import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ProjectChecker() {
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkProject();
  }, []);

  const checkProject = async () => {
    try {
      setLoading(true);
      
      // Verificar configurações atuais
      const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('URL do Supabase:', supabaseUrl);
      console.log('Chave configurada:', supabaseKey ? 'Sim' : 'Não');
      
      // Extrair nome do projeto da URL
      let projectName = 'Não identificado';
      if (supabaseUrl) {
        const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (match) {
          projectName = match[1];
        }
      }
      
      // Testar conexão
      const { data, error: testError } = await supabase
        .from('contratos')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        throw testError;
      }
      
      // Verificar tabelas existentes
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names');
      
      setProjectInfo({
        url: supabaseUrl,
        projectName,
        connected: true,
        contractsCount: data?.length || 0,
        tables: tables || []
      });
      
    } catch (err: any) {
      console.error('Erro ao verificar projeto:', err);
      setError(err.message);
      
      // Ainda assim mostrar informações básicas
      const supabaseUrl = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
      let projectName = 'Não identificado';
      if (supabaseUrl) {
        const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (match) {
          projectName = match[1];
        }
      }
      
      setProjectInfo({
        url: supabaseUrl,
        projectName,
        connected: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Verificando projeto Supabase...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Database className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Informações do Projeto Supabase</h2>
      </div>

      <div className="space-y-4">
        {/* Status da Conexão */}
        <div className="flex items-center space-x-3">
          {projectInfo?.connected ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span className={`font-medium ${projectInfo?.connected ? 'text-green-700' : 'text-red-700'}`}>
            {projectInfo?.connected ? 'Conectado' : 'Erro de Conexão'}
          </span>
        </div>

        {/* Nome do Projeto */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Nome do Projeto:</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">
            {projectInfo?.projectName}
          </p>
          {projectInfo?.projectName === 'armazenamento' && (
            <div className="mt-2 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">✓ Confirmado: Projeto "armazenamento"</span>
            </div>
          )}
        </div>

        {/* URL do Projeto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL do Projeto:</label>
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border font-mono">
            {projectInfo?.url || 'Não configurado'}
          </p>
        </div>

        {/* Estatísticas */}
        {projectInfo?.connected && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm font-medium text-green-700">Contratos</div>
              <div className="text-2xl font-bold text-green-800">
                {projectInfo.contractsCount}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="text-sm font-medium text-purple-700">Status</div>
              <div className="text-lg font-semibold text-purple-800">
                Ativo
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Erro:</span>
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Botão para Recarregar */}
        <div className="pt-4">
          <button
            onClick={checkProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Verificar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}