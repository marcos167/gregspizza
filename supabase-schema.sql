-- Greg's Pizza - Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Ingredients Table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL, -- kg, litros, unidades, gramas
  min_stock DECIMAL NOT NULL DEFAULT 0,
  category TEXT, -- massa, queijo, carnes, vegetais, molhos, temperos
  cost_per_unit DECIMAL NOT NULL DEFAULT 0,
  current_stock DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Entries Table (Purchases/Additions)
CREATE TABLE IF NOT EXISTS stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL NOT NULL,
  cost DECIMAL,
  supplier TEXT,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Stock Exits Table (Sales)
CREATE TABLE IF NOT EXISTS stock_exits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL CHECK (product_type IN ('pizza', 'esfiha')),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  revenue DECIMAL
);

-- Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pizza', 'esfiha')),
  serving_size INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Ingredients (Proportions)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_needed DECIMAL NOT NULL, -- Amount needed per serving
  UNIQUE(recipe_id, ingredient_id)
);

-- Weekly Reports Table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_revenue DECIMAL DEFAULT 0,
  total_cost DECIMAL DEFAULT 0,
  profit DECIMAL DEFAULT 0,
  top_selling_product TEXT,
  total_waste DECIMAL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('suggestion', 'warning', 'optimization')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  related_ingredient_id UUID REFERENCES ingredients(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stock_entries_ingredient ON stock_entries(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_entries_date ON stock_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_stock_exits_date ON stock_exits(sale_date);
CREATE INDEX IF NOT EXISTS idx_stock_exits_product ON stock_exits(product_type, product_name);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_dismissed ON ai_insights(dismissed);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update ingredient stock after entry
CREATE OR REPLACE FUNCTION update_stock_on_entry()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredients
  SET current_stock = COALESCE(current_stock, 0) + NEW.quantity
  WHERE id = NEW.ingredient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to deduct stock after sale (simplified version)
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a simplified version
  -- In production, you'd calculate based on recipe_ingredients
  -- For now, we'll just log the sale
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update stock when entry is added
DROP TRIGGER IF EXISTS trigger_update_stock_on_entry ON stock_entries;
CREATE TRIGGER trigger_update_stock_on_entry
  AFTER INSERT ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_entry();

-- Trigger to deduct stock when sale is registered
DROP TRIGGER IF EXISTS trigger_deduct_stock_on_sale ON stock_exits;
CREATE TRIGGER trigger_deduct_stock_on_sale
  AFTER INSERT ON stock_exits
  FOR EACH ROW
  EXECUTE FUNCTION deduct_stock_on_sale();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (authenticated users only)
-- In production, you'd want more granular permissions

CREATE POLICY "Allow all for authenticated users" ON ingredients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON stock_entries
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON stock_exits
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON recipes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON recipe_ingredients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON weekly_reports
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON ai_insights
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Sample ingredients
INSERT INTO ingredients (name, unit, min_stock, category, cost_per_unit, current_stock) VALUES
  ('Queijo Mussarela', 'kg', 5.0, 'queijo', 25.00, 15.5),
  ('Molho de Tomate', 'litros', 3.0, 'molhos', 8.50, 10.0),
  ('Massa de Pizza', 'kg', 10.0, 'massa', 6.00, 25.0),
  ('Calabresa', 'kg', 3.0, 'carnes', 18.00, 8.0),
  ('Frango Desfiado', 'kg', 3.0, 'carnes', 15.00, 6.5),
  ('Catupiry', 'kg', 2.0, 'queijo', 35.00, 4.0),
  ('Azeitonas', 'kg', 1.0, 'vegetais', 12.00, 2.5)
ON CONFLICT DO NOTHING;

-- Sample recipes
INSERT INTO recipes (name, type, serving_size) VALUES
  ('Pizza Margherita', 'pizza', 1),
  ('Pizza Calabresa', 'pizza', 1),
  ('Pizza Frango com Catupiry', 'pizza', 1),
  ('Esfiha de Carne', 'esfiha', 1)
ON CONFLICT DO NOTHING;

-- Sample AI insights
INSERT INTO ai_insights (insight_type, title, description, priority) VALUES
  ('suggestion', 'Aumente estoque de queijo', 'Baseado nas vendas dos últimos 7 dias, recomendo aumentar o estoque de queijo em 30%', 'high'),
  ('warning', 'Calabresa em baixa', 'Estoque de calabresa está abaixo do mínimo recomendado', 'medium'),
  ('optimization', 'Oportunidade de economia', 'Comprar molho de tomate em maior quantidade pode reduzir custo em 12%', 'low')
ON CONFLICT DO NOTHING;

-- Sample weekly report
INSERT INTO weekly_reports (week_start, week_end, total_revenue, total_cost, profit, top_selling_product) VALUES
  (CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, 3450.00, 1200.00, 2250.00, 'Pizza Calabresa')
ON CONFLICT DO NOTHING;
