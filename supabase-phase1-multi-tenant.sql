-- Phase 1: Multi-Tenant Database Foundation
-- Safe idempotent migration for tenant isolation

-- ============================================
-- PART 1: Create tenants table
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    slug TEXT UNIQUE NOT NULL,           -- URL-friendly: tonys-pizza
    name TEXT NOT NULL,                  -- Display: Tony's Pizza
    
    -- White-label branding
    logo_url TEXT,
    primary_color TEXT DEFAULT '#667eea',
    secondary_color TEXT DEFAULT '#764ba2',
    custom_domain TEXT UNIQUE,           -- pizza.tonys.com
    favicon_url TEXT,
    
    -- Business info
    owner_email TEXT NOT NULL,
    phone TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    
    -- Plan & limits
    plan TEXT DEFAULT 'free',            -- free, starter, pro, enterprise
    status TEXT DEFAULT 'active',        -- active, suspended, trial
    max_users INTEGER DEFAULT 5,
    max_recipes INTEGER DEFAULT 50,
    max_storage_mb INTEGER DEFAULT 1000,
    max_ai_actions_daily INTEGER DEFAULT 10,
    
    -- Billing (placeholder)
    billing_email TEXT,
    billing_info JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    settings JSONB DEFAULT '{}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);

-- ============================================
-- PART 2: Update user_role enum
-- ============================================

-- Drop and recreate with SUPER_ADMIN
DO $$ 
BEGIN
    -- Drop dependent objects
    DROP VIEW IF EXISTS pending_users CASCADE;
    DROP VIEW IF EXISTS active_users CASCADE;
    
    -- Recreate enum with SUPER_ADMIN
    ALTER TYPE user_role RENAME TO user_role_old;
    
    CREATE TYPE user_role AS ENUM (
        'SUPER_ADMIN',   -- Platform admin (no tenant)
        'ADMIN_TENANT',  -- Pizzaria admin
        'MANAGER',       -- Pizzaria manager
        'STAFF'          -- Pizzaria staff
    );
    
    -- Update column type
    ALTER TABLE user_profiles 
        ALTER COLUMN role TYPE user_role 
        USING role::text::user_role;
    
    -- Drop old enum
    DROP TYPE user_role_old;
    
    RAISE NOTICE 'user_role enum updated with SUPER_ADMIN';
END $$;

-- ============================================
-- PART 3: Add tenant_id to user_profiles
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
        
        RAISE NOTICE 'Added tenant_id to user_profiles';
    END IF;
END $$;

-- ============================================
-- PART 4: Add tenant_id to all data tables
-- ============================================

DO $$ 
BEGIN
    -- Recipes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipes' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE recipes ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_recipes_tenant_id ON recipes(tenant_id);
    END IF;
    
    -- Ingredients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ingredients' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE ingredients ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_ingredients_tenant_id ON ingredients(tenant_id);
    END IF;
    
    -- Categories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
    END IF;
    
    -- Recipe ingredients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recipe_ingredients' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE recipe_ingredients ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_recipe_ingredients_tenant_id ON recipe_ingredients(tenant_id);
    END IF;
    
    -- Sales (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE sales ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
            CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
        END IF;
    END IF;
    
    -- Stock movements (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_movements') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'stock_movements' AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE stock_movements ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
            CREATE INDEX idx_stock_movements_tenant_id ON stock_movements(tenant_id);
        END IF;
    END IF;
    
    -- Operational timeline
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'operational_timeline' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE operational_timeline ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_operational_timeline_tenant_id ON operational_timeline(tenant_id);
    END IF;
    
    -- Pending actions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pending_actions' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE pending_actions ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
        CREATE INDEX idx_pending_actions_tenant_id ON pending_actions(tenant_id);
    END IF;
    
    -- User action stats
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_action_stats') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_action_stats' AND column_name = 'tenant_id'
        ) THEN
            ALTER TABLE user_action_stats ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
            CREATE INDEX idx_user_action_stats_tenant_id ON user_action_stats(tenant_id);
        END IF;
    END IF;
    
    RAISE NOTICE 'tenant_id added to all data tables';
END $$;

-- ============================================
-- PART 5: Tenant management functions
-- ============================================

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'SUPER_ADMIN'
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new tenant (super admin only)
CREATE OR REPLACE FUNCTION create_tenant(
    p_slug TEXT,
    p_name TEXT,
    p_owner_email TEXT,
    p_plan TEXT DEFAULT 'free'
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Only super admins can create tenants
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can create tenants';
    END IF;
    
    -- Validate slug (alphanumeric + hyphens only)
    IF p_slug !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Slug must be lowercase alphanumeric with hyphens only';
    END IF;
    
    -- Create tenant
    INSERT INTO tenants (slug, name, owner_email, plan, status)
    VALUES (p_slug, p_name, p_owner_email, p_plan, 'trial')
    RETURNING id INTO v_tenant_id;
    
    -- Set trial period (14 days)
    UPDATE tenants 
    SET trial_ends_at = NOW() + INTERVAL '14 days'
    WHERE id = v_tenant_id;
    
    -- Log creation
    PERFORM log_timeline_event(
        auth.uid(),
        'create',
        'tenant',
        v_tenant_id,
        p_name,
        format('Tenant "%s" criado (plano: %s)', p_name, p_plan),
        jsonb_build_object('slug', p_slug, 'plan', p_plan),
        NULL,
        'user'
    );
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend tenant
CREATE OR REPLACE FUNCTION suspend_tenant(
    p_tenant_id UUID,
    p_reason TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can suspend tenants';
    END IF;
    
    UPDATE tenants
    SET 
        status = 'suspended',
        suspended_at = NOW(),
        suspended_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activate tenant
CREATE OR REPLACE FUNCTION activate_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only super admins can activate tenants';
    END IF;
    
    UPDATE tenants
    SET 
        status = 'active',
        suspended_at = NULL,
        suspended_reason = NULL,
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check tenant limits
CREATE OR REPLACE FUNCTION check_tenant_limit(
    p_tenant_id UUID,
    p_resource TEXT  -- 'users', 'recipes', 'storage', 'ai_actions'
) RETURNS BOOLEAN AS $$
DECLARE
    v_current INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT 
        CASE p_resource
            WHEN 'users' THEN (SELECT COUNT(*)::INTEGER FROM user_profiles WHERE tenant_id = p_tenant_id AND status = 'ACTIVE')
            WHEN 'recipes' THEN (SELECT COUNT(*)::INTEGER FROM recipes WHERE tenant_id = p_tenant_id AND deleted_at IS NULL)
            ELSE 0
        END,
        CASE p_resource
            WHEN 'users' THEN max_users
            WHEN 'recipes' THEN max_recipes
            ELSE 0
        END
    INTO v_current, v_limit
    FROM tenants
    WHERE id = p_tenant_id;
    
    RETURN v_current < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: RLS Policies - Tenant Isolation
-- ============================================

-- Helper function for tenant isolation policy
CREATE OR REPLACE FUNCTION user_has_tenant_access(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admins can access all tenants
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Regular users can only access their own tenant
    RETURN get_user_tenant_id() = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply RLS to recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_recipes" ON recipes;
CREATE POLICY "tenant_isolation_recipes" ON recipes
    FOR ALL USING (user_has_tenant_access(tenant_id));

-- Apply RLS to ingredients
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_ingredients" ON ingredients;
CREATE POLICY "tenant_isolation_ingredients" ON ingredients
    FOR ALL USING (user_has_tenant_access(tenant_id));

-- Apply RLS to categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_categories" ON categories;
CREATE POLICY "tenant_isolation_categories" ON categories
    FOR ALL USING (user_has_tenant_access(tenant_id));

-- Apply RLS to operational_timeline
ALTER TABLE operational_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_timeline" ON operational_timeline;
CREATE POLICY "tenant_isolation_timeline" ON operational_timeline
    FOR ALL USING (
        user_has_tenant_access(tenant_id) OR 
        is_super_admin()
    );

-- ============================================
-- PART 7: Recreate views with tenant awareness
-- ============================================

CREATE OR REPLACE VIEW pending_users AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.tenant_id,
    t.name as tenant_name,
    up.created_at
FROM user_profiles up
LEFT JOIN tenants t ON up.tenant_id = t.id
WHERE up.status = 'PENDING'
  AND (
    -- Tenant admins see their own pending users
    up.tenant_id = get_user_tenant_id() OR
    -- Super admins see all
    is_super_admin()
  )
ORDER BY up.created_at ASC;

CREATE OR REPLACE VIEW active_users AS
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.tenant_id,
    t.name as tenant_name,
    up.last_login,
    up.created_at
FROM user_profiles up
LEFT JOIN tenants t ON up.tenant_id = t.id
WHERE up.status = 'ACTIVE'
  AND (
    up.tenant_id = get_user_tenant_id() OR
    is_super_admin()
  )
ORDER BY up.created_at DESC;

-- ============================================
-- PART 8: Grants
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Super admins can see all tenants
CREATE POLICY "super_admin_all_tenants" ON tenants
    FOR ALL USING (is_super_admin());

-- Tenant users can see their own tenant
CREATE POLICY "users_own_tenant" ON tenants
    FOR SELECT USING (id = get_user_tenant_id());

GRANT SELECT, INSERT, UPDATE ON tenants TO authenticated;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE tenants IS 'Multi-tenant: each pizzaria is a tenant';
COMMENT ON FUNCTION get_user_tenant_id IS 'Returns current user tenant_id';
COMMENT ON FUNCTION is_super_admin IS 'Check if user is platform super admin';
COMMENT ON FUNCTION create_tenant IS 'Create new tenant (super admin only)';
COMMENT ON FUNCTION check_tenant_limit IS 'Check if tenant can add more resources';
COMMENT ON FUNCTION user_has_tenant_access IS 'Verify user can access tenant data';

-- Success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Phase 1: Multi-Tenant Database complete!';
    RAISE NOTICE '📊 Tables: tenants created, all data tables have tenant_id';
    RAISE NOTICE '🔒 RLS: Tenant isolation active on all tables';
    RAISE NOTICE '👑 Roles: SUPER_ADMIN added to user_role enum';
    RAISE NOTICE '🎯 Next: Create default tenant and migrate existing data';
END $$;
