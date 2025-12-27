-- ============================================
-- IMPERSONATION SYSTEM - Secure Tenant Access
-- ============================================

CREATE TABLE IF NOT EXISTS impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who is impersonating
    admin_id UUID NOT NULL REFERENCES user_profiles(id),
    admin_email TEXT NOT NULL,
    
    -- Target
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    tenant_name TEXT NOT NULL,
    target_user_id UUID REFERENCES user_profiles(id),
    
    -- Session control
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL, -- 2 hours from start
    ended_at TIMESTAMPTZ,
    
    -- Audit
    reason TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_tenant ON impersonation_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON impersonation_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_impersonation_expires ON impersonation_sessions(expires_at) WHERE is_active = TRUE;

-- RLS
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_read_impersonation" ON impersonation_sessions;
CREATE POLICY "super_admin_read_impersonation" ON impersonation_sessions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'SUPER_ADMIN'
    )
);

-- Function to start impersonation
CREATE OR REPLACE FUNCTION start_impersonation(
    p_tenant_id UUID,
    p_reason TEXT
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_admin_profile RECORD;
    v_tenant_record RECORD;
BEGIN
    -- Verify SUPER_ADMIN
    SELECT id, email, role INTO v_admin_profile
    FROM user_profiles
    WHERE id = auth.uid();
    
    IF v_admin_profile.role != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Only SUPER_ADMIN can impersonate';
    END IF;
    
    -- Verify tenant exists and is active
    SELECT id, name, status INTO v_tenant_record
    FROM tenants
    WHERE id = p_tenant_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant not found';
    END IF;
    
    IF v_tenant_record.status = 'suspended' THEN
        RAISE EXCEPTION 'Cannot impersonate suspended tenant';
    END IF;
    
    -- Verify reason is provided
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Reason is required for impersonation';
    END IF;
    
    -- End any existing active sessions for this admin
    UPDATE impersonation_sessions
    SET 
        ended_at = NOW(),
        is_active = FALSE
    WHERE admin_id = v_admin_profile.id
    AND is_active = TRUE;
    
    -- Create new session
    INSERT INTO impersonation_sessions (
        admin_id,
        admin_email,
        tenant_id,
        tenant_name,
        expires_at,
        reason
    ) VALUES (
        v_admin_profile.id,
        v_admin_profile.email,
        p_tenant_id,
        v_tenant_record.name,
        NOW() + INTERVAL '2 hours',
        p_reason
    ) RETURNING id INTO v_session_id;
    
    -- Log action
    PERFORM log_admin_action(
        'START_IMPERSONATION',
        'tenant',
        p_tenant_id,
        jsonb_build_object(
            'session_id', v_session_id,
            'reason', p_reason,
            'tenant_name', v_tenant_record.name,
            'expires_at', (NOW() + INTERVAL '2 hours')
        )
    );
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end impersonation
CREATE OR REPLACE FUNCTION end_impersonation(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Get session
    SELECT * INTO v_session
    FROM impersonation_sessions
    WHERE id = p_session_id
    AND admin_id = auth.uid()
    AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired session';
    END IF;
    
    -- End session
    UPDATE impersonation_sessions
    SET 
        ended_at = NOW(),
        is_active = FALSE
    WHERE id = p_session_id;
    
    -- Log action
    PERFORM log_admin_action(
        'END_IMPERSONATION',
        'impersonation_session',
        p_session_id,
        jsonb_build_object(
            'duration_minutes', EXTRACT(EPOCH FROM (NOW() - v_session.started_at)) / 60,
            'tenant_id', v_session.tenant_id,
            'tenant_name', v_session.tenant_name
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active impersonation
CREATE OR REPLACE FUNCTION get_active_impersonation()
RETURNS TABLE (
    session_id UUID,
    tenant_id UUID,
    tenant_name TEXT,
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.tenant_id,
        i.tenant_name,
        i.started_at,
        i.expires_at,
        i.reason
    FROM impersonation_sessions i
    WHERE i.admin_id = auth.uid()
    AND i.is_active = TRUE
    AND i.expires_at > NOW()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_impersonations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE impersonation_sessions
    SET 
        ended_at = NOW(),
        is_active = FALSE
    WHERE is_active = TRUE
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE impersonation_sessions IS 'Tracks platform admin impersonation sessions';
COMMENT ON FUNCTION start_impersonation IS 'Starts secure impersonation session (2h limit)';
COMMENT ON FUNCTION end_impersonation IS 'Ends active impersonation session';
COMMENT ON FUNCTION get_active_impersonation IS 'Gets current active impersonation if any';
COMMENT ON FUNCTION cleanup_expired_impersonations IS 'Cleans up expired sessions (cron job)';

-- Grants
GRANT SELECT ON impersonation_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION start_impersonation TO authenticated;
GRANT EXECUTE ON FUNCTION end_impersonation TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_impersonation TO authenticated;
