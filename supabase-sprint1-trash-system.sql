-- Sprint 1: Universal Trash System (Soft Delete)
-- Adds deleted_at to all critical tables and restore functionality

-- ============================================
-- PART 1: Add deleted_at to existing tables
-- ============================================

-- Recipes
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_deleted_at ON recipes(deleted_at);

-- Ingredients
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_ingredients_deleted_at ON ingredients(deleted_at);

-- Categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);

-- Sales (if exists)
ALTER TABLE IF EXISTS sales 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(deleted_at);

-- ============================================
-- PART 2: Create Trash Bin View
-- ============================================

-- Unified view of all deleted items
CREATE OR REPLACE VIEW trash_bin AS
SELECT 
    'recipe' as item_type,
    id,
    name as item_name,
    deleted_at,
    user_id,
    jsonb_build_object(
        'type', type,
        'serving_size', serving_size,
        'created_at', created_at
    ) as metadata
FROM recipes
WHERE deleted_at IS NOT NULL

UNION ALL

SELECT 
    'ingredient' as item_type,
    id,
    name as item_name,
    deleted_at,
    user_id,
    jsonb_build_object(
        'unit', unit,
        'current_stock', current_stock,
        'min_stock', min_stock,
        'category', category
    ) as metadata
FROM ingredients
WHERE deleted_at IS NOT NULL

UNION ALL

SELECT 
    'category' as item_type,
    id,
    name as item_name,
    deleted_at,
    user_id,
    jsonb_build_object(
        'description', description,
        'created_at', created_at
    ) as metadata
FROM categories
WHERE deleted_at IS NOT NULL

ORDER BY deleted_at DESC;

-- ============================================
-- PART 3: Soft Delete Function
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_query TEXT;
    v_record_name TEXT;
    v_affected INTEGER;
BEGIN
    -- Validate table name (security)
    IF p_table_name NOT IN ('recipes', 'ingredients', 'categories', 'sales') THEN
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;
    
    -- Get record name before deletion
    EXECUTE format('SELECT name FROM %I WHERE id = $1 AND user_id = $2', p_table_name)
    INTO v_record_name
    USING p_record_id, p_user_id;
    
    IF v_record_name IS NULL THEN
        RAISE EXCEPTION 'Record not found or access denied';
    END IF;
    
    -- Perform soft delete
    EXECUTE format(
        'UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        p_table_name
    ) USING p_record_id, p_user_id;
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    
    IF v_affected > 0 THEN
        -- Log to timeline
        PERFORM log_timeline_event(
            p_user_id,
            'delete',
            p_table_name,
            p_record_id,
            v_record_name,
            format('%s "%s" movido para lixeira', 
                CASE p_table_name
                    WHEN 'recipes' THEN 'Receita'
                    WHEN 'ingredients' THEN 'Ingrediente'
                    WHEN 'categories' THEN 'Categoria'
                    ELSE 'Item'
                END,
                v_record_name
            ),
            '{}'::jsonb,
            NULL,
            'user'
        );
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 4: Restore Function
-- ============================================

CREATE OR REPLACE FUNCTION restore_from_trash(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_query TEXT;
    v_record_name TEXT;
    v_affected INTEGER;
BEGIN
    -- Validate table name
    IF p_table_name NOT IN ('recipes', 'ingredients', 'categories', 'sales') THEN
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;
    
    -- Get record name
    EXECUTE format('SELECT name FROM %I WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL', p_table_name)
    INTO v_record_name
    USING p_record_id, p_user_id;
    
    IF v_record_name IS NULL THEN
        RAISE EXCEPTION 'Record not found in trash or access denied';
    END IF;
    
    -- Restore (set deleted_at to NULL)
    EXECUTE format(
        'UPDATE %I SET deleted_at = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL',
        p_table_name
    ) USING p_record_id, p_user_id;
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    
    IF v_affected > 0 THEN
        -- Log restoration
        PERFORM log_timeline_event(
            p_user_id,
            'restore',
            p_table_name,
            p_record_id,
            v_record_name,
            format('%s "%s" restaurado da lixeira', 
                CASE p_table_name
                    WHEN 'recipes' THEN 'Receita'
                    WHEN 'ingredients' THEN 'Ingrediente'
                    WHEN 'categories' THEN 'Categoria'
                    ELSE 'Item'
                END,
                v_record_name
            ),
            '{}'::jsonb,
            NULL,
            'user'
        );
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Permanent Delete Function (Admin only)
-- ============================================

CREATE OR REPLACE FUNCTION permanent_delete(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_affected INTEGER;
BEGIN
    -- Validate table name
    IF p_table_name NOT IN ('recipes', 'ingredients', 'categories', 'sales') THEN
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;
    
    -- Only delete items that are already in trash
    EXECUTE format(
        'DELETE FROM %I WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL',
        p_table_name
    ) USING p_record_id, p_user_id;
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    
    RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Auto-purge old trash (30 days)
-- ============================================

CREATE OR REPLACE FUNCTION auto_purge_trash()
RETURNS INTEGER AS $$
DECLARE
    v_total_deleted INTEGER := 0;
    v_deleted INTEGER;
BEGIN
    -- Purge recipes older than 30 days
    DELETE FROM recipes 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
    
    -- Purge ingredients
    DELETE FROM ingredients 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
    
    -- Purge categories
    DELETE FROM categories 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_total_deleted := v_total_deleted + v_deleted;
    
    RETURN v_total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 7: Update existing queries to exclude deleted
-- ============================================

-- Note: All application queries should add: WHERE deleted_at IS NULL
-- This will be handled in the frontend hooks

-- ============================================
-- PART 8: Grant permissions
-- ============================================

GRANT SELECT ON trash_bin TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete TO authenticated;
GRANT EXECUTE ON FUNCTION restore_from_trash TO authenticated;
GRANT EXECUTE ON FUNCTION permanent_delete TO authenticated;
GRANT EXECUTE ON FUNCTION auto_purge_trash TO authenticated;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION soft_delete IS 'Soft deletes a record by setting deleted_at timestamp';
COMMENT ON FUNCTION restore_from_trash IS 'Restores a soft-deleted record';
COMMENT ON FUNCTION permanent_delete IS 'Permanently deletes a record from trash (admin action)';
COMMENT ON FUNCTION auto_purge_trash IS 'Auto-purges trash items older than 30 days';
COMMENT ON VIEW trash_bin IS 'Unified view of all deleted items across tables';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Sprint 1: Universal Trash System installed successfully!';
    RAISE NOTICE 'All tables now support soft delete with deleted_at column.';
    RAISE NOTICE 'Functions: soft_delete(), restore_from_trash(), permanent_delete()';
END $$;
