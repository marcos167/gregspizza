-- Sprint 1 Week 2: Role-Based Access Control (RBAC)
-- User roles, status, and permission system

-- ============================================
-- PART 1: Create user_roles ENUM
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED');
    END IF;
END $$;

-- ============================================
-- PART 2: Create user_profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'STAFF',
    status user_status DEFAULT 'PENDING',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    suspended_by UUID REFERENCES auth.users(id),
    suspended_at TIMESTAMPTZ,
    suspension_reason TEXT,
    last_login TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- PART 3: Auto-create profile trigger
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        'STAFF',
        'PENDING'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- PART 4: Permission check functions
-- ============================================

CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM user_profiles
    WHERE id = auth.uid();
    
    RETURN user_role_value = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role('ADMIN') OR has_role('OWNER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_active()
RETURNS BOOLEAN AS $$
DECLARE
    user_status_value user_status;
BEGIN
    SELECT status INTO user_status_value
    FROM user_profiles
    WHERE id = auth.uid();
    
    RETURN user_status_value = 'ACTIVE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_active();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: User management functions
-- ============================================

-- Approve user
CREATE OR REPLACE FUNCTION approve_user(
    p_user_id UUID,
    p_role user_role DEFAULT 'STAFF'
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    -- Check if caller is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can approve users';
    END IF;
    
    -- Update user status
    UPDATE user_profiles
    SET 
        status = 'ACTIVE',
        role = p_role,
        approved_by = v_admin_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id
      AND status = 'PENDING';
    
    -- Log approval
    PERFORM log_timeline_event(
        v_admin_id,
        'update',
        'user',
        p_user_id,
        (SELECT email FROM user_profiles WHERE id = p_user_id),
        'Usuário aprovado e ativado',
        jsonb_build_object('role', p_role),
        NULL,
        'user'
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend user
CREATE OR REPLACE FUNCTION suspend_user(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Suspenso pelo administrador'
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    -- Check if caller is admin
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can suspend users';
    END IF;
    
    -- Cannot suspend yourself
    IF p_user_id = v_admin_id THEN
        RAISE EXCEPTION 'Cannot suspend yourself';
    END IF;
    
    -- Update user status
    UPDATE user_profiles
    SET 
        status = 'SUSPENDED',
        suspended_by = v_admin_id,
        suspended_at = NOW(),
        suspension_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_user_id
      AND status = 'ACTIVE';
    
    -- Log suspension
    PERFORM log_timeline_event(
        v_admin_id,
        'update',
        'user',
        p_user_id,
        (SELECT email FROM user_profiles WHERE id = p_user_id),
        format('Usuário suspenso: %s', p_reason),
        jsonb_build_object('reason', p_reason),
        NULL,
        'user'
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activate user
CREATE OR REPLACE FUNCTION activate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can activate users';
    END IF;
    
    UPDATE user_profiles
    SET 
        status = 'ACTIVE',
        suspended_by = NULL,
        suspended_at = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
    WHERE id = p_user_id
      AND status = 'SUSPENDED';
    
    -- Log activation
    PERFORM log_timeline_event(
        v_admin_id,
        'update',
        'user',
        p_user_id,
        (SELECT email FROM user_profiles WHERE id = p_user_id),
        'Usuário reativado',
        '{}'::jsonb,
        NULL,
        'user'
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Change user role
CREATE OR REPLACE FUNCTION change_user_role(
    p_user_id UUID,
    p_new_role user_role
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_old_role user_role;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can change roles';
    END IF;
    
    SELECT role INTO v_old_role
    FROM user_profiles
    WHERE id = p_user_id;
    
    UPDATE user_profiles
    SET 
        role = p_new_role,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log role change
    PERFORM log_timeline_event(
        v_admin_id,
        'update',
        'user',
        p_user_id,
        (SELECT email FROM user_profiles WHERE id = p_user_id),
        format('Role alterada de %s para %s', v_old_role, p_new_role),
        jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role),
        NULL,
        'user'
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Views
-- ============================================

-- Pending users view (admin only)
CREATE OR REPLACE VIEW pending_users AS
SELECT 
    id,
    email,
    full_name,
    created_at
FROM user_profiles
WHERE status = 'PENDING'
ORDER BY created_at ASC;

-- Active users view
CREATE OR REPLACE VIEW active_users AS
SELECT 
    id,
    email,
    full_name,
    role,
    last_login,
    created_at
FROM user_profiles
WHERE status = 'ACTIVE'
ORDER BY created_at DESC;

-- ============================================
-- PART 7: RLS Policies
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin());

-- Users can update own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        OLD.role = NEW.role AND  -- Cannot change own role
        OLD.status = NEW.status  -- Cannot change own status
    );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
    ON user_profiles FOR UPDATE
    USING (is_admin());

-- ============================================
-- PART 8: Grant permissions
-- ============================================

GRANT SELECT ON user_profiles TO authenticated;
GRANT UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON pending_users TO authenticated;
GRANT SELECT ON active_users TO authenticated;

GRANT EXECUTE ON FUNCTION approve_user TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_user TO authenticated;
GRANT EXECUTE ON FUNCTION activate_user TO authenticated;
GRANT EXECUTE ON FUNCTION change_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION has_role TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_active TO authenticated;
GRANT EXECUTE ON FUNCTION can_access TO authenticated;

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE user_profiles IS 'User profiles with roles and status';
COMMENT ON TYPE user_role IS 'User role: OWNER, ADMIN, MANAGER, STAFF';
COMMENT ON TYPE user_status IS 'User status: PENDING, ACTIVE, SUSPENDED, BLOCKED';
COMMENT ON FUNCTION approve_user IS 'Approve pending user (admin only)';
COMMENT ON FUNCTION suspend_user IS 'Suspend active user (admin only)';
COMMENT ON FUNCTION activate_user IS 'Activate suspended user (admin only)';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Sprint 1 Week 2: RBAC System installed successfully!';
    RAISE NOTICE 'Roles: OWNER, ADMIN, MANAGER, STAFF';
    RAISE NOTICE 'Status: PENDING → ACTIVE → SUSPENDED → BLOCKED';
END $$;
