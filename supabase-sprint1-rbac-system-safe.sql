-- Sprint 1 Week 2: RBAC System (SAFE MIGRATION)
-- Idempotent script that handles existing schemas

-- ============================================
-- PART 1: Create ENUMs safely
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF');
        RAISE NOTICE 'Created user_role enum';
    ELSE
        RAISE NOTICE 'user_role enum already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BLOCKED');
        RAISE NOTICE 'Created user_status enum';
    ELSE
        RAISE NOTICE 'user_status enum already exists';
    END IF;
END $$;

-- ============================================
-- PART 2: Create or update user_profiles table
-- ============================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns safely (one by one)
DO $$ 
BEGIN
    -- full_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE user_profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'role') THEN
        ALTER TABLE user_profiles ADD COLUMN role user_role DEFAULT 'STAFF';
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
        ALTER TABLE user_profiles ADD COLUMN status user_status DEFAULT 'PENDING';
    END IF;
    
    -- approved_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'approved_by') THEN
        ALTER TABLE user_profiles ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- approved_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'approved_at') THEN
        ALTER TABLE user_profiles ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
    
    -- suspended_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'suspended_by') THEN
        ALTER TABLE user_profiles ADD COLUMN suspended_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- suspended_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'suspended_at') THEN
        ALTER TABLE user_profiles ADD COLUMN suspended_at TIMESTAMPTZ;
    END IF;
    
    -- suspension_reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'suspension_reason') THEN
        ALTER TABLE user_profiles ADD COLUMN suspension_reason TEXT;
    END IF;
    
    -- last_login
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'last_login') THEN
        ALTER TABLE user_profiles ADD COLUMN last_login TIMESTAMPTZ;
    END IF;
    
    -- metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'metadata') THEN
        ALTER TABLE user_profiles ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    RAISE NOTICE 'All user_profiles columns ensured';
END $$;

-- Create indexes safely
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
    VALUES (NEW.id, NEW.email, 'STAFF', 'PENDING')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ============================================
-- PART 4: Permission functions
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
    RETURN has_role('ADMIN'::user_role) OR has_role('OWNER'::user_role);
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
    
    RETURN user_status_value = 'ACTIVE'::user_status;
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

CREATE OR REPLACE FUNCTION approve_user(
    p_user_id UUID,
    p_role user_role DEFAULT 'STAFF'
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_email TEXT;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can approve users';
    END IF;
    
    UPDATE user_profiles
    SET 
        status = 'ACTIVE'::user_status,
        role = p_role,
        approved_by = v_admin_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id
      AND status = 'PENDING'::user_status
    RETURNING email INTO v_email;
    
    IF FOUND THEN
        PERFORM log_timeline_event(
            v_admin_id,
            'update',
            'user',
            p_user_id,
            v_email,
            'Usuário aprovado e ativado',
            jsonb_build_object('role', p_role::text),
            NULL,
            'user'
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION suspend_user(
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Suspenso pelo administrador'
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_email TEXT;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can suspend users';
    END IF;
    
    IF p_user_id = v_admin_id THEN
        RAISE EXCEPTION 'Cannot suspend yourself';
    END IF;
    
    UPDATE user_profiles
    SET 
        status = 'SUSPENDED'::user_status,
        suspended_by = v_admin_id,
        suspended_at = NOW(),
        suspension_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_user_id
      AND status = 'ACTIVE'::user_status
    RETURNING email INTO v_email;
    
    IF FOUND THEN
        PERFORM log_timeline_event(
            v_admin_id,
            'update',
            'user',
            p_user_id,
            v_email,
            format('Usuário suspenso: %s', p_reason),
            jsonb_build_object('reason', p_reason),
            NULL,
            'user'
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_email TEXT;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can activate users';
    END IF;
    
    UPDATE user_profiles
    SET 
        status = 'ACTIVE'::user_status,
        suspended_by = NULL,
        suspended_at = NULL,
        suspension_reason = NULL,
        updated_at = NOW()
    WHERE id = p_user_id
      AND status = 'SUSPENDED'::user_status
    RETURNING email INTO v_email;
    
    IF FOUND THEN
        PERFORM log_timeline_event(
            v_admin_id,
            'update',
            'user',
            p_user_id,
            v_email,
            'Usuário reativado',
            '{}'::jsonb,
            NULL,
            'user'
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION change_user_role(
    p_user_id UUID,
    p_new_role user_role
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_old_role user_role;
    v_email TEXT;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Only admins can change roles';
    END IF;
    
    SELECT role, email INTO v_old_role, v_email
    FROM user_profiles
    WHERE id = p_user_id;
    
    UPDATE user_profiles
    SET 
        role = p_new_role,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF FOUND THEN
        PERFORM log_timeline_event(
            v_admin_id,
            'update',
            'user',
            p_user_id,
            v_email,
            format('Role alterada de %s para %s', v_old_role::text, p_new_role::text),
            jsonb_build_object('old_role', v_old_role::text, 'new_role', p_new_role::text),
            NULL,
            'user'
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Views
-- ============================================

CREATE OR REPLACE VIEW pending_users AS
SELECT 
    id,
    email,
    full_name,
    created_at
FROM user_profiles
WHERE status = 'PENDING'::user_status
ORDER BY created_at ASC;

CREATE OR REPLACE VIEW active_users AS
SELECT 
    id,
    email,
    full_name,
    role,
    last_login,
    created_at
FROM user_profiles
WHERE status = 'ACTIVE'::user_status
ORDER BY created_at DESC;

-- ============================================
-- PART 7: RLS Policies
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;

-- Recreate policies
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin());

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON user_profiles FOR UPDATE
    USING (is_admin());

-- ============================================
-- PART 8: Grants
-- ============================================

GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON pending_users TO authenticated;
GRANT SELECT ON active_users TO authenticated;

-- Success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RBAC System migration completed successfully!';
    RAISE NOTICE 'Roles: OWNER, ADMIN, MANAGER, STAFF';
    RAISE NOTICE 'Status: PENDING → ACTIVE → SUSPENDED → BLOCKED';
    RAISE NOTICE 'Run: SELECT * FROM user_profiles; to verify';
END $$;
