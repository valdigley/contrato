/*
  # Atualizar políticas RLS para tabela users

  1. Políticas de Segurança
    - Permite que usuários vejam e atualizem seus próprios dados
    - Permite inserção de novos usuários durante o cadastro
    - Mantém segurança dos dados pessoais

  2. Funcionalidades
    - Suporte ao sistema de autenticação
    - Gerenciamento de perfis de usuário
    - Integração com auth.users do Supabase
*/

-- Habilitar RLS na tabela users se não estiver habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can manage own profile" ON users;

-- Política para permitir que usuários vejam seus próprios dados
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seus próprios dados
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para permitir inserção de novos usuários (durante cadastro)
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para permitir que o sistema crie perfis durante o signup
CREATE POLICY "Allow user creation during signup"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);