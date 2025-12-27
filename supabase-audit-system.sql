-- ============================================
-- AUDIT SYSTEM - Enterprise Logging
-- ============================================
-- Tracks ALL platform admin actions for compliance

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who performed the action
    actor_id UUID NOT NULL REFERENCES user_profiles(id),
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    
    -- What was done
    action TEXT NOT NULL, -- 'CREATE_TENANT', 'SUSPEND_TENANT', 'CHANGE_PLAN', etc.
    resource_type TEXT NOT NULL, -- 'tenant', 'user', 'plan'
    resource_id UUID,
    
    -- Details
    changes JSONB, -- { "before": {...}, "after": {...} }
    metadata JSONB DEFAULT '{}'::jsonb, -- IP, user agent, etc.
    
    -- When
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Context
    impersonating BOOLEAN DEFAULT FALSE,
    impersonated_tenant_id UUID REFERENCES tenants(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS: Only SUPER_ADMINs can read audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_read_audit_logs" ON audit_logs;
CREATE POLICY "super_admin_read_audit_logs" ON audit_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'SUPER_ADMIN'
        AND user_profiles.tenant_id IS NULL
    )
);

-- Function to log actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_actor_profile RECORD;
BEGIN
    -- Get actor info
    SELECT id, email, role INTO v_actor_profile
    FROM user_profiles
    WHERE id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Insert log
    INSERT INTO audit_logs (
        actor_id,
        actor_email,
        actor_role,
        action,
        resource_type,
        resource_id,
        changes,
        metadata
    ) VALUES (
        v_actor_profile.id,
        v_actor_profile.email,
        v_actor_profile.role,
        p_action,
        p_resource_type,
        p_resource_id,
        p_changes,
        COALESCE(p_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE audit_logs IS 'Enterprise audit trail - tracks all platform admin actions';
COMMENT ON FUNCTION log_admin_action IS 'Logs admin actions with full context';

-- Grant permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
