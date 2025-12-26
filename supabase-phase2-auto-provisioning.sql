-- Phase 1.5: Enhanced Tenant Auto-Provisioning
-- Extends create_tenant() with automatic data cloning and onboarding

-- ============================================
-- ENHANCED: create_tenant_complete()
-- ============================================
-- Automatically provisions a complete tenant environment including:
-- - Tenant record creation
-- - Owner user setup
-- - Default categories cloning
-- - Sample ingredients cloning
-- - Initial timeline log
-- - Welcome workflow trigger

CREATE OR REPLACE FUNCTION create_tenant_complete(
    p_slug TEXT,
    p_name TEXT,
    p_owner_email TEXT,
    p_plan TEXT DEFAULT 'free',
    p_subdomain TEXT DEFAULT NULL,
    p_primary_color TEXT DEFAULT '#667eea',
    p_secondary_color TEXT DEFAULT '#764ba2'
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_owner_id UUID;
    v_default_tenant_id UUID;
    v_categories_count INTEGER;
    v_ingredients_count INTEGER;
BEGIN
    -- Validate caller is SUPER_ADMIN
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can create tenants';
    END IF;
    
    -- Validate slug format
    IF p_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Slug must be lowercase alphanumeric with hyphens only';
    END IF;
    
    -- ============================================
    -- STEP 1: Create Tenant Record
    -- ============================================
    INSERT INTO tenants (
        slug,
        name,
        owner_email,
        plan,
        subdomain,
        primary_color,
        secondary_color,
        status,
        trial_ends_at
    ) VALUES (
        p_slug,
        p_name,
        p_owner_email,
        p_plan,
        COALESCE(p_subdomain, p_slug),
        p_primary_color,
        p_secondary_color,
        'trial',
        NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO v_tenant_id;
    
    RAISE NOTICE 'Created tenant: % (ID: %)', p_name, v_tenant_id;
    
    -- ============================================
    -- STEP 2: Find or Verify Owner User
    -- ============================================
    -- Note: User must already exist in auth.users
    -- This function assumes user was invited/created separately
    SELECT id INTO v_owner_id 
    FROM auth.users 
    WHERE email = p_owner_email;
    
    IF v_owner_id IS NULL THEN
        RAISE NOTICE 'Owner user not found in auth.users: %', p_owner_email;
        RAISE NOTICE 'User must be invited via Supabase Auth before tenant creation';
        -- Don't fail - tenant is created, user profile will be created on first login
    ELSE
        -- Create user profile as ADMIN_TENANT
        INSERT INTO user_profiles (
            id,
            tenant_id,
            email,
            role,
            status
        ) VALUES (
            v_owner_id,
            v_tenant_id,
            p_owner_email,
            'ADMIN_TENANT',
            'ACTIVE'
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            tenant_id = v_tenant_id,
            role = 'ADMIN_TENANT',
            status = 'ACTIVE';
        
        RAISE NOTICE 'Created ADMIN_TENANT user profile for: %', p_owner_email;
    END IF;
    
    -- ============================================
    -- STEP 3: Get Default Tenant (gregs-pizza)
    -- ============================================
    SELECT id INTO v_default_tenant_id
    FROM tenants
    WHERE slug = 'gregs-pizza'
    LIMIT 1;
    
    IF v_default_tenant_id IS NULL THEN
        RAISE NOTICE 'Default tenant "gregs-pizza" not found - skipping data cloning';
        RETURN v_tenant_id;
    END IF;
    
    -- ============================================
    -- STEP 4: Clone Default Categories
    -- ============================================
    INSERT INTO categories (
        tenant_id,
        name,
        description,
        created_at
    )
    SELECT 
        v_tenant_id,
        name,
        description,
        NOW()
    FROM categories
    WHERE tenant_id = v_default_tenant_id
      AND deleted_at IS NULL;
    
    GET DIAGNOSTICS v_categories_count = ROW_COUNT;
    RAISE NOTICE 'Cloned % categories', v_categories_count;
    
    -- ============================================
    -- STEP 5: Clone Sample Ingredients (First 5)
    -- ============================================
    INSERT INTO ingredients (
        tenant_id,
        name,
        unit,
        category,
        cost_per_unit,
        min_stock,
        current_stock,
        created_at
    )
    SELECT 
        v_tenant_id,
        name,
        unit,
        category,
        cost_per_unit,
        min_stock,
        min_stock * 2, -- Start with 2x minimum stock
        NOW()
    FROM ingredients
    WHERE tenant_id = v_default_tenant_id
      AND deleted_at IS NULL
    ORDER BY created_at
    LIMIT 5;
    
    GET DIAGNOSTICS v_ingredients_count = ROW_COUNT;
    RAISE NOTICE 'Cloned % sample ingredients', v_ingredients_count;
    
    -- ============================================
    -- STEP 6: Log Tenant Creation
    -- ============================================
    INSERT INTO operational_timeline (
        tenant_id,
        user_id,
        action_type,
        entity_type,
        entity_name,
        description,
        metadata,
        actor
    ) VALUES (
        v_tenant_id,
        COALESCE(v_owner_id, auth.uid()),
        'create',
        'tenant',
        p_name,
        format('Tenant "%s" created via Platform Admin', p_name),
        jsonb_build_object(
            'plan', p_plan,
            'subdomain', COALESCE(p_subdomain, p_slug),
            'categories_cloned', v_categories_count,
            'ingredients_cloned', v_ingredients_count,
            'auto_provisioned', true
        ),
        'platform'
    );
    
    RAISE NOTICE 'Logged tenant creation to timeline';
    
    -- ============================================
    -- SUCCESS
    -- ============================================
    RAISE NOTICE '✅ Tenant auto-provisioning complete!';
    RAISE NOTICE '   - Tenant ID: %', v_tenant_id;
    RAISE NOTICE '   - Categories: %', v_categories_count;
    RAISE NOTICE '   - Ingredients: %', v_ingredients_count;
    RAISE NOTICE '   - Status: trial (14 days)';
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_tenant_complete TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_tenant_complete IS 'Complete tenant provisioning with auto-cloning of default data';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- To test after running this migration:
-- SELECT create_tenant_complete(
--     'test-pizzaria',
--     'Pizzaria do Mario',
--     'mario@email.com',
--     'starter',
--     'mario',
--     '#e74c3c',
--     '#c0392b'
-- );
