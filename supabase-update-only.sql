-- ============================================
-- GREG'S PIZZA - ATUALIZAÇÃO DO SCHEMA
-- Execute APENAS isto se o schema já existe
-- ============================================

-- 1. Atualizar função de dedução de estoque
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  recipe_record RECORD;
  ingredient_record RECORD;
  required_quantity DECIMAL;
  available_stock DECIMAL;
BEGIN
  -- Find the recipe for this product
  SELECT id INTO recipe_record
  FROM recipes
  WHERE name = NEW.product_name AND type = NEW.product_type;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Receita não encontrada para: % (%)', NEW.product_name, NEW.product_type;
  END IF;

  -- Check if recipe has ingredients
  IF NOT EXISTS (
    SELECT 1 FROM recipe_ingredients WHERE recipe_id = recipe_record.id
  ) THEN
    RAISE EXCEPTION 'Receita % não possui ingredientes cadastrados', NEW.product_name;
  END IF;

  -- Deduct each ingredient
  FOR ingredient_record IN
    SELECT ri.ingredient_id, ri.quantity_needed, i.current_stock, i.name, i.unit
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.recipe_id = recipe_record.id
  LOOP
    required_quantity := ingredient_record.quantity_needed * NEW.quantity;
    available_stock := COALESCE(ingredient_record.current_stock, 0);

    -- Check if there's enough stock
    IF available_stock < required_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente de % (disponível: % %, necessário: % %)',
        ingredient_record.name, 
        available_stock, 
        ingredient_record.unit,
        required_quantity,
        ingredient_record.unit;
    END IF;

    -- Deduct the stock
    UPDATE ingredients
    SET current_stock = current_stock - required_quantity
    WHERE id = ingredient_record.ingredient_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar função de cálculo de capacidade
CREATE OR REPLACE FUNCTION calculate_recipe_capacity(recipe_id_param UUID)
RETURNS TABLE(
  capacity INTEGER,
  limiting_ingredient_id UUID,
  limiting_ingredient_name TEXT
) AS $$
DECLARE
  min_capacity INTEGER := 999999;
  limiting_ing_id UUID;
  limiting_ing_name TEXT;
  ingredient_count INTEGER;
BEGIN
  -- Count ingredients for this recipe
  SELECT COUNT(*) INTO ingredient_count
  FROM recipe_ingredients
  WHERE recipe_id = recipe_id_param;

  -- If no ingredients, return 0
  IF ingredient_count = 0 THEN
    RETURN QUERY SELECT 0, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Calculate minimum capacity
  SELECT 
    COALESCE(MIN(FLOOR(i.current_stock / NULLIF(ri.quantity_needed, 0)))::INTEGER, 0),
    (SELECT i2.id FROM recipe_ingredients ri2
     JOIN ingredients i2 ON ri2.ingredient_id = i2.id
     WHERE ri2.recipe_id = recipe_id_param
     ORDER BY FLOOR(i2.current_stock / NULLIF(ri2.quantity_needed, 0)) ASC
     LIMIT 1),
    (SELECT i2.name FROM recipe_ingredients ri2
     JOIN ingredients i2 ON ri2.ingredient_id = i2.id
     WHERE ri2.recipe_id = recipe_id_param
     ORDER BY FLOOR(i2.current_stock / NULLIF(ri2.quantity_needed, 0)) ASC
     LIMIT 1)
  INTO min_capacity, limiting_ing_id, limiting_ing_name
  FROM recipe_ingredients ri
  JOIN ingredients i ON ri.ingredient_id = i.id
  WHERE ri.recipe_id = recipe_id_param;

  IF min_capacity IS NULL THEN
    min_capacity := 0;
  END IF;

  RETURN QUERY SELECT min_capacity, limiting_ing_id, limiting_ing_name;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar view de ingredientes com alertas
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
ORDER BY 
  CASE
    WHEN i.current_stock <= 0 THEN 1
    WHEN i.current_stock <= i.min_stock * 0.5 THEN 2
    WHEN i.current_stock <= i.min_stock THEN 3
    ELSE 4
  END,
  i.current_stock / NULLIF(i.min_stock, 1) ASC;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Testar se as funções foram criadas
SELECT 'Funções criadas:' as status;
SELECT proname as function_name 
FROM pg_proc 
WHERE proname IN ('deduct_stock_on_sale', 'calculate_recipe_capacity');

-- Testar se a view foi criada
SELECT 'View criada:' as status;
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'low_stock_ingredients';

-- ============================================
-- PRONTO!
-- ============================================
-- Se você viu 2 funções e 1 view acima, está tudo OK!
-- Agora teste o app em: https://gregspizza.vercel.app
