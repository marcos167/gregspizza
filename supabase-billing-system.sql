-- ============================================
-- BILLING SYSTEM - SaaS Revenue Management
-- ============================================

-- Plan definitions table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL, -- 'free', 'pro', 'enterprise'
    display_name TEXT NOT NULL, -- 'Free', 'Pro', 'Enterprise'
    price_monthly INTEGER NOT NULL, -- em centavos (0, 9900, 49900)
    
    -- Limits
    max_users INTEGER NOT NULL,
    max_recipes INTEGER,
    max_storage_mb INTEGER,
    max_ai_actions_daily INTEGER,
    
    -- Features
    features JSONB DEFAULT '[]'::jsonb, -- ['custom_domain', 'api_access', 'priority_support']
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, display_name, price_monthly, max_users, max_recipes, max_storage_mb, max_ai_actions_daily, features, sort_order, description) VALUES
('free', 'Free', 0, 2, 50, 500, 10, '["basic_features"]'::jsonb, 1, 'Plano gratuito para começar'),
('pro', 'Pro', 9900, 10, 500, 5000, 100, '["custom_domain", "priority_support", "advanced_analytics"]'::jsonb, 2, 'Para empresas em crescimento'),
('enterprise', 'Enterprise', 49900, 999999, 999999, 50000, 1000, '["custom_domain", "api_access", "priority_support", "advanced_analytics", "dedicated_support", "sla"]'::jsonb, 3, 'Solução completa para grandes empresas')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_monthly = EXCLUDED.price_monthly,
    max_users = EXCLUDED.max_users,
    max_recipes = EXCLUDED.max_recipes,
    max_storage_mb = EXCLUDED.max_storage_mb,
    max_ai_actions_daily = EXCLUDED.max_ai_actions_daily,
    features = EXCLUDED.features,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Billing transactions
CREATE TABLE IF NOT EXISTS billing_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Transaction info
    amount INTEGER NOT NULL, -- em centavos
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL, -- 'pending', 'paid', 'failed', 'refunded'
    
    -- Payment gateway
    gateway TEXT, -- 'stripe', 'mercado_pago'
    gateway_transaction_id TEXT,
    gateway_response JSONB,
    
    -- Metadata
    description TEXT,
    period_start DATE,
    period_end DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_tenant ON billing_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_billing_created ON billing_transactions(created_at DESC);

-- Function to calculate MRR (Monthly Recurring Revenue)
CREATE OR REPLACE FUNCTION calculate_platform_mrr()
RETURNS INTEGER AS $$
DECLARE
    v_mrr INTEGER;
BEGIN
    SELECT COALESCE(SUM(p.price_monthly), 0)
    INTO v_mrr
    FROM tenants t
    JOIN plans p ON t.plan = p.name
    WHERE t.status = 'active'
    AND p.price_monthly > 0;
    
    RETURN v_mrr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get plan details
CREATE OR REPLACE FUNCTION get_plan_details(p_plan_name TEXT)
RETURNS TABLE (
    name TEXT,
    display_name TEXT,
    price_monthly INTEGER,
    max_users INTEGER,
    max_recipes INTEGER,
    max_storage_mb INTEGER,
    max_ai_actions_daily INTEGER,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name,
        p.display_name,
        p.price_monthly,
        p.max_users,
        p.max_recipes,
        p.max_storage_mb,
        p.max_ai_actions_daily,
        p.features
    FROM plans p
    WHERE p.name = p_plan_name
    AND p.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change tenant plan
CREATE OR REPLACE FUNCTION change_tenant_plan(
    p_tenant_id UUID,
    p_new_plan TEXT,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_old_plan TEXT;
    v_tenant_name TEXT;
BEGIN
    -- Verify SUPER_ADMIN
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can change plans';
    END IF;
    
    -- Get current plan
    SELECT plan, name INTO v_old_plan, v_tenant_name
    FROM tenants
    WHERE id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found';
    END IF;
    
    -- Verify new plan exists
    IF NOT EXISTS (SELECT 1 FROM plans WHERE name = p_new_plan AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Plan not found or inactive';
    END IF;
    
    -- Update tenant plan
    UPDATE tenants
    SET 
        plan = p_new_plan,
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    -- Log action
    PERFORM log_admin_action(
        'CHANGE_PLAN',
        'tenant',
        p_tenant_id,
        jsonb_build_object(
            'old_plan', v_old_plan,
            'new_plan', p_new_plan,
            'tenant_name', v_tenant_name,
            'reason', p_reason
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE plans IS 'SaaS plan definitions with limits and pricing';
COMMENT ON TABLE billing_transactions IS 'Payment transactions and billing history';
COMMENT ON FUNCTION calculate_platform_mrr IS 'Calculates total Monthly Recurring Revenue';
COMMENT ON FUNCTION change_tenant_plan IS 'Changes tenant plan with audit logging';

-- Grants
GRANT SELECT ON plans TO authenticated;
GRANT SELECT ON billing_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_platform_mrr TO authenticated;
GRANT EXECUTE ON FUNCTION get_plan_details TO authenticated;
GRANT EXECUTE ON FUNCTION change_tenant_plan TO authenticated;
