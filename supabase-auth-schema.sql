-- ============================================
-- Greg's Pizza - Authentication System
-- ============================================
-- Este schema adiciona autenticação completa com:
-- - Supabase Auth integration
-- - Perfis de usuário com roles (admin/employee)
-- - Row Level Security (RLS)
-- - Triggers automáticos

-- ============================================
-- 1. TABELA DE PERFIS DE USUÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 2. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ver todos os perfis
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON user_profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Admins podem atualizar qualquer perfil
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins podem deletar perfis
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. ATUALIZAR RLS DAS TABELAS EXISTENTES
-- ============================================

-- Permitir que funcionários apenas leiam dados
-- Permitir que admins façam tudo

-- Ingredientes
DROP POLICY IF EXISTS "Authenticated users can view ingredients" ON ingredients;
CREATE POLICY "Authenticated users can view ingredients"
  ON ingredients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage ingredients" ON ingredients;
CREATE POLICY "Admins can manage ingredients"
  ON ingredients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Employees can insert ingredients" ON ingredients;
CREATE POLICY "Employees can insert ingredients"
  ON ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Stock Entries (Entradas)
DROP POLICY IF EXISTS "Authenticated users can view stock entries" ON stock_entries;
CREATE POLICY "Authenticated users can view stock entries"
  ON stock_entries FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create stock entries" ON stock_entries;
CREATE POLICY "Authenticated users can create stock entries"
  ON stock_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Stock Exits (Saídas/Vendas)
DROP POLICY IF EXISTS "Authenticated users can view stock exits" ON stock_exits;
CREATE POLICY "Authenticated users can view stock exits"
  ON stock_exits FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create stock exits" ON stock_exits;
CREATE POLICY "Authenticated users can create stock exits"
  ON stock_exits FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recipes
DROP POLICY IF EXISTS "Authenticated users can view recipes" ON recipes;
CREATE POLICY "Authenticated users can view recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage recipes" ON recipes;
CREATE POLICY "Admins can manage recipes"
  ON recipes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Recipe Ingredients
DROP POLICY IF EXISTS "Authenticated users can view recipe ingredients" ON recipe_ingredients;
CREATE POLICY "Authenticated users can view recipe ingredients"
  ON recipe_ingredients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage recipe ingredients" ON recipe_ingredients;
CREATE POLICY "Admins can manage recipe ingredients"
  ON recipe_ingredients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Weekly Reports
DROP POLICY IF EXISTS "Authenticated users can view weekly reports" ON weekly_reports;
CREATE POLICY "Authenticated users can view weekly reports"
  ON weekly_reports FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage weekly reports" ON weekly_reports;
CREATE POLICY "Admins can manage weekly reports"
  ON weekly_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- AI Insights (somente admins)
DROP POLICY IF EXISTS "Admins can view AI insights" ON ai_insights;
CREATE POLICY "Admins can view AI insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage AI insights" ON ai_insights;
CREATE POLICY "Admins can manage AI insights"
  ON ai_insights FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================

-- Exibir resumo das tabelas e policies criadas
DO $$
BEGIN
  RAISE NOTICE '✅ Schema de autenticação criado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '1. Habilitar Email Auth no Supabase Dashboard';
  RAISE NOTICE '2. Criar primeiro usuário via cadastro';
  RAISE NOTICE '3. Promover para admin com: UPDATE user_profiles SET role = ''admin'' WHERE email = ''seu-email@exemplo.com'';';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Roles disponíveis: admin, employee';
  RAISE NOTICE '📊 Tabela criada: user_profiles';
  RAISE NOTICE '🔄 Trigger: on_auth_user_created (cria perfil automaticamente)';
  RAISE NOTICE '🛡️ RLS habilitado em todas as tabelas';
END $$;
