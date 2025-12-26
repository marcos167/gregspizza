-- ============================================
-- AI ASSISTANT - DATABASE INFRASTRUCTURE
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. SOFT DELETE SYSTEM
-- Adicionar coluna deleted_at nas tabelas principais

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE stock_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE stock_exits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ingredients_deleted ON ingredients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_recipes_deleted ON recipes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted_at);

-- ============================================
-- 2. ACTION LOGS TABLE
-- Registro de todas as ações do sistema
-- ============================================

CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action_type TEXT NOT NULL, -- create, update, delete, restore, import, export
  entity_type TEXT NOT NULL, -- recipe, ingredient, category, stock, sale
  entity_id UUID,
  entity_name TEXT,
  details JSONB, -- Dados completos da ação
  ai_generated BOOLEAN DEFAULT false,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_logs_user ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_entity ON action_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_logs_ai ON action_logs(ai_generated) WHERE ai_generated = true;

-- RLS para action_logs
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON action_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs" ON action_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "System can insert logs" ON action_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 3. CHAT HISTORY TABLE
-- Histórico de conversas com a IA
-- ============================================

CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_email TEXT,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  command JSONB, -- Comando estruturado extraído
  intent JSONB, -- Intent detectado pela IA
  executed BOOLEAN DEFAULT false,
  success BOOLEAN,
  execution_result JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_executed ON chat_history(executed) WHERE executed = true;

-- RLS para chat_history
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat history" ON chat_history
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================
-- 4. TRASH VIEW
-- View unificada de itens deletados
-- ============================================

CREATE OR REPLACE VIEW trash_items AS
SELECT 
  'ingredient' as type,
  i.id,
  i.name,
  i.deleted_at,
  i.category,
  json_build_object(
    'unit', i.unit,
    'current_stock', i.current_stock,
    'min_stock', i.min_stock
  ) as metadata,
  (SELECT COUNT(*) FROM recipe_ingredients WHERE ingredient_id = i.id) as dependencies
FROM ingredients i
WHERE i.deleted_at IS NOT NULL

UNION ALL

SELECT 
  'recipe' as type,
  r.id,
  r.name,
  r.deleted_at,
  r.type as category,
  json_build_object(
    'serving_size', r.serving_size,
    'ingredients_count', (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id)
  ) as metadata,
  (SELECT COUNT(*) FROM stock_exits WHERE product_name = r.name) as dependencies
FROM recipes r
WHERE r.deleted_at IS NOT NULL

UNION ALL

SELECT 
  'category' as type,
  c.id,
  c.name,
  c.deleted_at,
  'category' as category,
  json_build_object(
    'icon', c.icon,
    'color', c.color
  ) as metadata,
  (SELECT COUNT(*) FROM ingredients WHERE category = c.name) as dependencies
FROM categories c
WHERE c.deleted_at IS NOT NULL

ORDER BY deleted_at DESC;

-- RLS para trash_items (será herdado das tabelas base)

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Função para soft delete genérico
CREATE OR REPLACE FUNCTION soft_delete(
  table_name TEXT,
  record_id UUID,
  user_id_param UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  query TEXT;
  entity_name TEXT;
  entity_type TEXT := table_name;
BEGIN
  -- Get entity name before deletion
  query := format('SELECT name FROM %I WHERE id = $1', table_name);
  EXECUTE query INTO entity_name USING record_id;
  
  -- Soft delete
  query := format('UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', table_name);
  EXECUTE query USING record_id;
  
  -- Log action
  INSERT INTO action_logs (user_id, action_type, entity_type, entity_id, entity_name)
  VALUES (user_id_param, 'delete', entity_type, record_id, entity_name);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para restore genérico
CREATE OR REPLACE FUNCTION restore_item(
  table_name TEXT,
  record_id UUID,
  user_id_param UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
  query TEXT;
  entity_name TEXT;
  entity_type TEXT := table_name;
BEGIN
  -- Get entity name
  query := format('SELECT name FROM %I WHERE id = $1', table_name);
  EXECUTE query INTO entity_name USING record_id;
  
  -- Restore
  query := format('UPDATE %I SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL', table_name);
  EXECUTE query USING record_id;
  
  -- Log action
  INSERT INTO action_logs (user_id, action_type, entity_type, entity_id, entity_name)
  VALUES (user_id_param, 'restore', entity_type, record_id, entity_name);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ATUALIZAR QUERIES EXISTENTES
-- Adicionar WHERE deleted_at IS NULL nas views existentes
-- ============================================

-- Atualizar view de ingredientes com alertas
CREATE OR REPLACE VIEW low_stock_ingredients AS
SELECT 
  i.id,
  i.name,
  i.current_stock,
  i.min_stock,
  i.unit,
  i.category,
  i.cost_per_unit,
  ROUND(((i.current_stock / NULLIF(i.min_stock, 0)) * 100)::numeric, 2) as stock_percentage,
  CASE
    WHEN i.current_stock <= 0 THEN 'critical'
    WHEN i.current_stock <= i.min_stock * 0.5 THEN 'danger'
    WHEN i.current_stock <= i.min_stock THEN 'warning'
    ELSE 'ok'
  END as status,
  (SELECT COUNT(*) FROM recipe_ingredients ri WHERE ri.ingredient_id = i.id) as used_in_recipes_count
FROM ingredients i
WHERE i.deleted_at IS NULL  -- Apenas ingredientes ativos
ORDER BY 
  CASE
    WHEN i.current_stock <= 0 THEN 1
    WHEN i.current_stock <= i.min_stock * 0.5 THEN 2
    WHEN i.current_stock <= i.min_stock THEN 3
    ELSE 4
  END,
  i.current_stock / NULLIF(i.min_stock, 1) ASC;

-- ============================================
-- 7. TRIGGERS PARA AUTO-LOGGING
-- ============================================

-- Trigger para logar criações automaticamente
CREATE OR REPLACE FUNCTION log_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO action_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    details
  ) VALUES (
    auth.uid(),
    'create',
    TG_TABLE_NAME,
    NEW.id,
    NEW.name,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas principais
DROP TRIGGER IF EXISTS log_ingredient_creation ON ingredients;
CREATE TRIGGER log_ingredient_creation
  AFTER INSERT ON ingredients
  FOR EACH ROW EXECUTE FUNCTION log_creation();

DROP TRIGGER IF EXISTS log_recipe_creation ON recipes;
CREATE TRIGGER log_recipe_creation
  AFTER INSERT ON recipes
  FOR EACH ROW EXECUTE FUNCTION log_creation();

DROP TRIGGER IF EXISTS log_category_creation ON categories;
CREATE TRIGGER log_category_creation
  AFTER INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION log_creation();

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se tudo foi criado
SELECT 
  'Soft delete columns added' as check,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name IN ('ingredients', 'recipes', 'categories')
  AND column_name = 'deleted_at';

SELECT 
  'Tables created' as check,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_name IN ('action_logs', 'chat_history');

SELECT 
  'View created' as check,
  COUNT(*) as count
FROM information_schema.views
WHERE table_name = 'trash_items';

SELECT 
  'Functions created' as check,
  COUNT(*) as count
FROM pg_proc
WHERE proname IN ('soft_delete', 'restore_item', 'log_creation');

-- ============================================
-- PRONTO!
-- ============================================
-- Infraestrutura do AI Assistant configurada com sucesso!
-- Próximo passo: Implementar serviços backend
