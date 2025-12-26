-- Data Migration: Single-Tenant → Multi-Tenant
-- Migrates existing data to default tenant safely

-- ============================================
-- PART 1: Create default tenant
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID;
    v_admin_user_id UUID;
BEGIN
    -- Check if default tenant exists
    SELECT id INTO v_default_tenant_id 
    FROM tenants 
    WHERE slug = 'gregs-pizza';
    
    -- Create if doesn't exist
    IF v_default_tenant_id IS NULL THEN
        INSERT INTO tenants (
            slug,
            name,
            owner_email,
            plan,
            status,
            max_users,
            max_recipes,
            max_storage_mb,
            max_ai_actions_daily,
            onboarding_completed
        ) VALUES (
            'gregs-pizza',
            'Greg''s Pizza',
            'admin@gregspizza.com',  -- Change this!
            'enterprise',            -- Full access for existing system
            'active',
            999,
            999,
            99999,
            9999,
            true
        )
        RETURNING id INTO v_default_tenant_id;
        
        RAISE NOTICE '✅ Default tenant created: %', v_default_tenant_id;
    ELSE
        RAISE NOTICE '⚠️ Default tenant already exists: %', v_default_tenant_id;
    END IF;
    
    -- Store for next steps
    PERFORM set_config('app.default_tenant_id', v_default_tenant_id::text, false);
END $$;

-- ============================================
-- PART 2: Create first SUPER_ADMIN
-- ============================================

DO $$ 
DECLARE
    v_admin_user_id UUID;
    v_admin_email TEXT := 'admin@gregspizza.com';  -- CHANGE THIS!
BEGIN
    -- Find existing admin user
    SELECT id INTO v_admin_user_id
    FROM user_profiles
    WHERE email = v_admin_email;
    
    IF v_admin_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Admin user not found. Create user first, then run this again.';
    ELSE
        -- Promote to SUPER_ADMIN
        UPDATE user_profiles
        SET 
            role = 'SUPER_ADMIN',
            status = 'ACTIVE',
            tenant_id = NULL,  -- Super admins have no tenant
            updated_at = NOW()
        WHERE id = v_admin_user_id;
        
        RAISE NOTICE '✅ User % promoted to SUPER_ADMIN', v_admin_email;
    END IF;
END $$;

-- ============================================
-- PART 3: Migrate user_profiles to default tenant
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    -- Update all users (except SUPER_ADMIN) to belong to default tenant
    UPDATE user_profiles
    SET 
        tenant_id = v_default_tenant_id,
        updated_at = NOW()
    WHERE tenant_id IS NULL
      AND role != 'SUPER_ADMIN';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % users to default tenant', v_updated_count;
    
    -- Update roles to new enum values
    UPDATE user_profiles
    SET role = 'ADMIN_TENANT'
    WHERE role = 'ADMIN'
      AND tenant_id IS NOT NULL;
      
    RAISE NOTICE '✅ Updated ADMIN → ADMIN_TENANT';
END $$;

-- ============================================
-- PART 4: Migrate recipes to default tenant
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    UPDATE recipes
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % recipes to default tenant', v_updated_count;
END $$;

-- ============================================
-- PART 5: Migrate ingredients to default tenant
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    UPDATE ingredients
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % ingredients to default tenant', v_updated_count;
END $$;

-- ============================================
-- PART 6: Migrate categories to default tenant
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    UPDATE categories
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % categories to default tenant', v_updated_count;
END $$;

-- ============================================
-- PART 7: Migrate recipe_ingredients
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    UPDATE recipe_ingredients
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % recipe_ingredients to default tenant', v_updated_count;
END $$;

-- ============================================
-- PART 8: Migrate operational_timeline
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    UPDATE operational_timeline
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % timeline events to default tenant', v_updated_count;
END $$;

-- ============================================
-- PART 9: Migrate pending_actions
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    UPDATE pending_actions
    SET tenant_id = v_default_tenant_id
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Migrated % pending actions to default tenant', v_updated_count;
END $$;

-- ============================================
-- PART 10: Migrate user_action_stats (if exists)
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_action_stats') THEN
        UPDATE user_action_stats
        SET tenant_id = v_default_tenant_id
        WHERE tenant_id IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Migrated % user action stats to default tenant', v_updated_count;
    END IF;
END $$;

-- ============================================
-- PART 11: Migrate sales (if exists)
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
        UPDATE sales
        SET tenant_id = v_default_tenant_id
        WHERE tenant_id IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Migrated % sales to default tenant', v_updated_count;
    END IF;
END $$;

-- ============================================
-- PART 12: Migrate stock_movements (if exists)
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_updated_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        UPDATE stock_movements
        SET tenant_id = v_default_tenant_id
        WHERE tenant_id IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
        
        RAISE NOTICE '✅ Migrated % stock movements to default tenant', v_updated_count;
    END IF;
END $$;

-- ============================================
-- PART 13: Validation
-- ============================================

DO $$ 
DECLARE
    v_default_tenant_id UUID := current_setting('app.default_tenant_id')::UUID;
    v_null_tenant_count INTEGER;
BEGIN
    -- Check for any remaining NULL tenant_ids in user_profiles
    SELECT COUNT(*) INTO v_null_tenant_count
    FROM user_profiles
    WHERE tenant_id IS NULL
      AND role != 'SUPER_ADMIN';
    
    IF v_null_tenant_count > 0 THEN
        RAISE WARNING '⚠️ % users still have NULL tenant_id', v_null_tenant_count;
    ELSE
        RAISE NOTICE '✅ All users assigned to tenants';
    END IF;
    
    -- Check recipes
    SELECT COUNT(*) INTO v_null_tenant_count
    FROM recipes
    WHERE tenant_id IS NULL;
    
    IF v_null_tenant_count > 0 THEN
        RAISE WARNING '⚠️ % recipes still have NULL tenant_id', v_null_tenant_count;
    ELSE
        RAISE NOTICE '✅ All recipes assigned to tenant';
    END IF;
    
    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ MIGRATION COMPLETE!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'Default tenant: %', v_default_tenant_id;
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = v_default_tenant_id);
    RAISE NOTICE 'Recipes: %', (SELECT COUNT(*) FROM recipes WHERE tenant_id = v_default_tenant_id);
    RAISE NOTICE 'Ingredients: %', (SELECT COUNT(*) FROM ingredients WHERE tenant_id = v_default_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '1. Verify data in application';
    RAISE NOTICE '2. Update frontend to handle tenants';
    RAISE NOTICE '3. Create Platform Admin UI';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
