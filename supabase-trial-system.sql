-- ============================================
-- SPRINT 1: TRIAL SYSTEM & PAID-ONLY MIGRATION
-- ============================================
-- Migration to convert EstokMax from freemium to paid-only with trial system

-- Step 1: Add trial fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_converted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS next_billing_date DATE;

-- Step 2: Create trial_sessions table
CREATE TABLE IF NOT EXISTS trial_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Trial info
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    converted_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    
    -- Payment info
    card_added BOOLEAN DEFAULT FALSE,
    card_last4 TEXT,
    card_brand TEXT,
    stripe_payment_method_id TEXT,
    
    -- Conversion tracking
    converted_to_plan TEXT,
    conversion_reason TEXT,
    
    -- Metadata
    initial_plan TEXT DEFAULT 'starter', -- Trial gets STARTER features
    utm_source TEXT,
    utm_campaign TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trial_expires ON trial_sessions(expires_at) WHERE converted_at IS NULL AND canceled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trial_tenant ON trial_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trial_active ON trial_sessions(started_at) WHERE converted_at IS NULL;

-- Step 3: Update plans table - Remove FREE, Add STARTER and BUSINESS
DELETE FROM plans WHERE name = 'free';

-- Update PRO plan
UPDATE plans SET
    display_name = 'Pro',
    price_monthly = 9900, -- R$ 99
    max_users = 15,
    max_recipes = 1000,
    max_storage_mb = 10240, -- 10GB
    max_ai_actions_daily = 500,
    features = '["api_access", "priority_support", "advanced_analytics", "custom_domain", "multi_location"]'::jsonb,
    description = 'Para restaurantes estabelecidos e pequenas redes',
    sort_order = 2,
    updated_at = NOW()
WHERE name = 'pro';

-- Update ENTERPRISE plan
UPDATE plans SET
    display_name = 'Enterprise',
    price_monthly = 49900, -- R$ 499
    max_users = 999999,
    max_recipes = 999999,
    max_storage_mb = 204800, -- 200GB
    max_ai_actions_daily = 10000,
    features = '["api_access", "webhooks", "sso", "white_label", "priority_support", "advanced_analytics", "custom_domain", "multi_location", "dedicated_support", "sla"]'::jsonb,
    description = 'Solução completa para grandes redes e franquias',
    sort_order = 4,
    updated_at = NOW()
WHERE name = 'enterprise';

-- Insert STARTER plan
INSERT INTO plans (name, display_name, price_monthly, max_users, max_recipes, max_storage_mb, max_ai_actions_daily, features, sort_order, description) 
VALUES (
    'starter', 
    'Starter', 
    4900, -- R$ 49
    5, 
    200, 
    2048, -- 2GB
    100,
    '["basic_features", "email_support"]'::jsonb,
    1,
    'Perfeito para restaurantes pequenos começando'
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_monthly = EXCLUDED.price_monthly,
    max_users = EXCLUDED.max_users,
    max_recipes = EXCLUDED.max_recipes,
    max_storage_mb = EXCLUDED.max_storage_mb,
    max_ai_actions_daily = EXCLUDED.max_ai_actions_daily,
    features = EXCLUDED.features,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Insert BUSINESS plan
INSERT INTO plans (name, display_name, price_monthly, max_users, max_recipes, max_storage_mb, max_ai_actions_daily, features, sort_order, description) 
VALUES (
    'business', 
    'Business', 
    19900, -- R$ 199
    50, 
    5000, 
    51200, -- 50GB
    2000,
    '["api_access", "webhooks", "white_label", "priority_support", "advanced_analytics", "custom_domain", "multi_location", "unlimited_integrations"]'::jsonb,
    3,
    'Para empresas em crescimento acelerado'
)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    price_monthly = EXCLUDED.price_monthly,
    max_users = EXCLUDED.max_users,
    max_recipes = EXCLUDED.max_recipes,
    max_storage_mb = EXCLUDED.max_storage_mb,
    max_ai_actions_daily = EXCLUDED.max_ai_actions_daily,
    features = EXCLUDED.features,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Step 4: Trial management functions

-- Function to start a trial
CREATE OR REPLACE FUNCTION start_trial(
    p_tenant_id UUID,
    p_trial_days INTEGER DEFAULT 14,
    p_utm_source TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration
    v_expires_at := NOW() + (p_trial_days || ' days')::INTERVAL;
    
    -- Create trial session
    INSERT INTO trial_sessions (
        tenant_id, 
        started_at, 
        expires_at,
        utm_source,
        utm_campaign
    )
    VALUES (
        p_tenant_id,
        NOW(),
        v_expires_at,
        p_utm_source,
        p_utm_campaign
    )
    RETURNING id INTO v_session_id;
    
    -- Update tenant with trial info
    UPDATE tenants SET
        trial_started_at = NOW(),
        trial_ends_at = v_expires_at,
        trial_converted = FALSE,
        plan = 'starter', -- Trial gets STARTER features
        status = 'active',
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    -- Log action
    PERFORM log_admin_action(
        'TRIAL_STARTED',
        'tenant',
        p_tenant_id,
        jsonb_build_object(
            'trial_days', p_trial_days,
            'expires_at', v_expires_at,
            'session_id', v_session_id
        )
    );
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check trial status
CREATE OR REPLACE FUNCTION check_trial_status(p_tenant_id UUID)
RETURNS TABLE (
    is_trial BOOLEAN,
    days_remaining INTEGER,
    hours_remaining INTEGER,
    expires_at TIMESTAMPTZ,
    requires_payment BOOLEAN,
    card_added BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (t.trial_started_at IS NOT NULL AND t.trial_converted = FALSE) as is_trial,
        GREATEST(0, EXTRACT(DAY FROM t.trial_ends_at - NOW())::INTEGER) as days_remaining,
        GREATEST(0, EXTRACT(HOUR FROM t.trial_ends_at - NOW())::INTEGER) as hours_remaining,
        t.trial_ends_at,
        (t.payment_method_id IS NULL) as requires_payment,
        (ts.card_added = TRUE) as card_added
    FROM tenants t
    LEFT JOIN trial_sessions ts ON ts.tenant_id = t.id AND ts.converted_at IS NULL
    WHERE t.id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add payment method to trial
CREATE OR REPLACE FUNCTION add_trial_payment_method(
    p_tenant_id UUID,
    p_payment_method_id TEXT,
    p_card_last4 TEXT,
    p_card_brand TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update tenant
    UPDATE tenants SET
        payment_method_id = p_payment_method_id,
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    -- Update trial session
    UPDATE trial_sessions SET
        card_added = TRUE,
        card_last4 = p_card_last4,
        card_brand = p_card_brand,
        stripe_payment_method_id = p_payment_method_id,
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id
    AND converted_at IS NULL;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert trial to paid subscription
CREATE OR REPLACE FUNCTION convert_trial_to_paid(
    p_tenant_id UUID,
    p_plan_name TEXT,
    p_subscription_id TEXT,
    p_next_billing_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_name TEXT;
BEGIN
    -- Verify plan exists
    IF NOT EXISTS (SELECT 1 FROM plans WHERE name = p_plan_name AND is_active = TRUE) THEN
        RAISE EXCEPTION 'Plan % not found or inactive', p_plan_name;
    END IF;
    
    -- Get tenant name
    SELECT name INTO v_tenant_name FROM tenants WHERE id = p_tenant_id;
    
    -- Update tenant
    UPDATE tenants SET
        trial_converted = TRUE,
        plan = p_plan_name,
        stripe_subscription_id = p_subscription_id,
        next_billing_date = p_next_billing_date,
        status = 'active',
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    -- Update trial session
    UPDATE trial_sessions SET
        converted_at = NOW(),
        converted_to_plan = p_plan_name,
        conversion_reason = 'Trial successfully converted',
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id
    AND converted_at IS NULL;
    
    -- Log action
    PERFORM log_admin_action(
        'TRIAL_CONVERTED',
        'tenant',
        p_tenant_id,
        jsonb_build_object(
            'tenant_name', v_tenant_name,
            'converted_to_plan', p_plan_name,
            'subscription_id', p_subscription_id
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel trial
CREATE OR REPLACE FUNCTION cancel_trial(
    p_tenant_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update trial session
    UPDATE trial_sessions SET
        canceled_at = NOW(),
        conversion_reason = p_reason,
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id
    AND converted_at IS NULL
    AND canceled_at IS NULL;
    
    -- Suspend tenant
    UPDATE tenants SET
        status = 'suspended',
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    -- Log action
    PERFORM log_admin_action(
        'TRIAL_CANCELED',
        'tenant',
        p_tenant_id,
        jsonb_build_object('reason', p_reason)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire trials (run via cron)
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS TABLE (
    tenant_id UUID,
    tenant_name TEXT,
    email TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH expired AS (
        UPDATE tenants t
        SET 
            status = 'suspended',
            updated_at = NOW()
        FROM trial_sessions ts
        WHERE t.id = ts.tenant_id
        AND t.trial_converted = FALSE
        AND ts.expires_at < NOW()
        AND ts.converted_at IS NULL
        AND ts.canceled_at IS NULL
        AND t.status = 'active'
        RETURNING t.id, t.name, up.email
    )
    SELECT 
        e.id,
        e.name,
        COALESCE(
            (SELECT email FROM user_profiles WHERE tenant_id = e.id AND role = 'OWNER' LIMIT 1),
            ''
        ) as email
    FROM expired e;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for trial_sessions
ALTER TABLE trial_sessions ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN can see all trials
CREATE POLICY "super_admin_view_trials" ON trial_sessions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'SUPER_ADMIN'
        AND user_profiles.tenant_id IS NULL
    )
);

-- Tenants can see their own trial
CREATE POLICY "tenant_view_own_trial" ON trial_sessions
FOR SELECT TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE id = auth.uid()
    )
);

-- Comments
COMMENT ON TABLE trial_sessions IS '14-day trial tracking with payment collection';
COMMENT ON FUNCTION start_trial IS 'Initiates a new trial session for a tenant';
COMMENT ON FUNCTION check_trial_status IS 'Returns current trial status and remaining time';
COMMENT ON FUNCTION convert_trial_to_paid IS 'Converts a trial to a paid subscription';
COMMENT ON FUNCTION cancel_trial IS 'Cancels an active trial';
COMMENT ON FUNCTION expire_trials IS 'Batch expire trials past their end date (cron job)';

-- Grants
GRANT SELECT ON trial_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION start_trial TO authenticated;
GRANT EXECUTE ON FUNCTION check_trial_status TO authenticated;
GRANT EXECUTE ON FUNCTION add_trial_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION convert_trial_to_paid TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_trial TO authenticated;
GRANT EXECUTE ON FUNCTION expire_trials TO authenticated;
