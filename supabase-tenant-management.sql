-- ============================================
-- TENANT MANAGEMENT FUNCTIONS
-- ============================================
-- Functions for suspending, activating, and managing tenants

-- Function to suspend tenant
CREATE OR REPLACE FUNCTION suspend_tenant(
    p_tenant_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_record RECORD;
BEGIN
    -- Verify SUPER_ADMIN
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
        AND tenant_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can suspend tenants';
    END IF;

    -- Get tenant info
    SELECT id, name, status INTO v_tenant_record
    FROM tenants
    WHERE id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found';
    END IF;

    IF v_tenant_record.status = 'suspended' THEN
        RAISE EXCEPTION 'Tenant is already suspended';
    END IF;

    -- Update tenant status
    UPDATE tenants
    SET 
        status = 'suspended',
        updated_at = NOW()
    WHERE id = p_tenant_id;

    -- Log action
    PERFORM log_admin_action(
        'SUSPEND_TENANT',
        'tenant',
        p_tenant_id,
        jsonb_build_object(
            'tenant_name', v_tenant_record.name,
            'old_status', v_tenant_record.status,
            'new_status', 'suspended',
            'reason', p_reason
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate/reactivate tenant
CREATE OR REPLACE FUNCTION activate_tenant(
    p_tenant_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_tenant_record RECORD;
BEGIN
    -- Verify SUPER_ADMIN
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
        AND tenant_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can activate tenants';
    END IF;

    -- Get tenant info
    SELECT id, name, status INTO v_tenant_record
    FROM tenants
    WHERE id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found';
    END IF;

    IF v_tenant_record.status = 'active' THEN
        RAISE EXCEPTION 'Tenant is already active';
    END IF;

    -- Update tenant status
    UPDATE tenants
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE id = p_tenant_id;

    -- Log action
    PERFORM log_admin_action(
        'ACTIVATE_TENANT',
        'tenant',
        p_tenant_id,
        jsonb_build_object(
            'tenant_name', v_tenant_record.name,
            'old_status', v_tenant_record.status,
            'new_status', 'active'
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'SUPER_ADMIN'
        AND tenant_id IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION suspend_tenant IS 'Suspends a tenant with audit logging';
COMMENT ON FUNCTION activate_tenant IS 'Activates/reactivates a tenant with audit logging';
COMMENT ON FUNCTION is_super_admin IS 'Helper to check if current user is SUPER_ADMIN';

-- Grants
GRANT EXECUTE ON FUNCTION suspend_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION activate_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin TO authenticated;
