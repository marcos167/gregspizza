-- ============================================
-- PLATFORM ADMIN RLS POLICIES
-- ============================================
-- Allow SUPER_ADMIN users to manage tenants table
-- This replaces the need for service_role key in browser
-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: SUPER_ADMINs can SELECT all tenants
CREATE POLICY "super_admin_select_tenants" ON tenants FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'SUPER_ADMIN'
                AND user_profiles.tenant_id IS NULL
        )
    );

-- Policy: SUPER_ADMINs can INSERT new tenants
CREATE POLICY "super_admin_insert_tenants" ON tenants FOR INSERT TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'SUPER_ADMIN'
                AND user_profiles.tenant_id IS NULL
        )
    );

-- Policy: SUPER_ADMINs can UPDATE tenants
CREATE POLICY "super_admin_update_tenants" ON tenants FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT
            1
        FROM
            user_profiles
        WHERE
            user_profiles.id = auth.uid ()
            AND user_profiles.role = 'SUPER_ADMIN'
            AND user_profiles.tenant_id IS NULL
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT
                1
            FROM
                user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'SUPER_ADMIN'
                AND user_profiles.tenant_id IS NULL
        )
    );

-- Policy: SUPER_ADMINs can view user_profiles across all tenants
-- (for tenant statistics)
CREATE POLICY "super_admin_select_all_user_profiles" ON user_profiles FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                user_profiles up
            WHERE
                up.id = auth.uid ()
                AND up.role = 'SUPER_ADMIN'
                AND up.tenant_id IS NULL
        )
    );

-- Policy: SUPER_ADMINs can view recipes across all tenants
-- (for tenant statistics)
CREATE POLICY "super_admin_select_all_recipes" ON recipes FOR
SELECT
    TO authenticated USING (
        EXISTS (
            SELECT
                1
            FROM
                user_profiles
            WHERE
                user_profiles.id = auth.uid ()
                AND user_profiles.role = 'SUPER_ADMIN'
                AND user_profiles.tenant_id IS NULL
        )
    );