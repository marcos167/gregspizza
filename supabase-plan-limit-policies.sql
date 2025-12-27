/**
 * EstokMax - Plan Limit Enforcement RLS Policies
 * 
 * @author Marco Antonio de Souza - https://marcosouza.dev
 * @copyright © 2025 Marco Antonio de Souza. All rights reserved.
 * @license Proprietary - Unauthorized copying or distribution is prohibited.
 * 
 * This code is the intellectual property of Marco Antonio de Souza.
 * Any attempt to copy, modify, or distribute without explicit permission
 * from the author is strictly forbidden and will be prosecuted.
 * 
 * These policies enforce plan limits at the database level to prevent
 * bypassing frontend validation via direct SQL access or API manipulation.
 */

-- ============================================================================
-- ENFORCE USER LIMIT POLICY
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code
-- This policy prevents creating more users than allowed by the tenant's plan

CREATE POLICY "enforce_user_limit_on_insert" ON user_profiles
FOR INSERT
WITH CHECK (
    -- Get current user count for this tenant
    (SELECT COUNT(*) 
     FROM user_profiles 
     WHERE tenant_id = NEW.tenant_id
    ) 
    < 
    -- Get max users allowed for tenant's plan
    (SELECT p.max_users 
     FROM plans p 
     JOIN tenants t ON t.plan = p.name 
     WHERE t.id = NEW.tenant_id
    )
);

COMMENT ON POLICY "enforce_user_limit_on_insert" ON user_profiles IS 
'© Marco Antonio de Souza - Enforces max_users limit from plan. Prevents adding users beyond plan capacity.';


-- ============================================================================
-- ENFORCE RECIPE LIMIT POLICY
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code
-- This policy prevents creating more recipes than allowed by the tenant's plan

CREATE POLICY "enforce_recipe_limit_on_insert" ON recipes
FOR INSERT
WITH CHECK (
    -- Get current recipe count for this tenant
    (SELECT COUNT(*) 
     FROM recipes 
     WHERE tenant_id = NEW.tenant_id 
       AND deleted_at IS NULL  -- Only count active recipes
    ) 
    < 
    -- Get max recipes allowed for tenant's plan
    (SELECT p.max_recipes 
     FROM plans p 
     JOIN tenants t ON t.plan = p.name 
     WHERE t.id = NEW.tenant_id
    )
);

COMMENT ON POLICY "enforce_recipe_limit_on_insert" ON recipes IS 
'© Marco Antonio de Souza - Enforces max_recipes limit from plan. Prevents adding recipes beyond plan capacity.';


-- ============================================================================
-- HELPER FUNCTION: Check if tenant can add user
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code

CREATE OR REPLACE FUNCTION can_add_user(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count INTEGER;
    v_max_users INTEGER;
BEGIN
    -- Copyright © 2025 Marco Antonio de Souza - All Rights Reserved
    
    -- Get current user count
    SELECT COUNT(*) INTO v_current_count
    FROM user_profiles
    WHERE tenant_id = p_tenant_id;
    
    -- Get plan limit
    SELECT p.max_users INTO v_max_users
    FROM plans p
    JOIN tenants t ON t.plan = p.name
    WHERE t.id = p_tenant_id;
    
    -- Return true if under limit
    RETURN v_current_count < v_max_users;
END;
$$;

COMMENT ON FUNCTION can_add_user IS 
'© Marco Antonio de Souza - Checks if tenant can add another user based on plan limits';


-- ============================================================================
-- HELPER FUNCTION: Check if tenant can add recipe
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code

CREATE OR REPLACE FUNCTION can_add_recipe(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_count INTEGER;
    v_max_recipes INTEGER;
BEGIN
    -- Copyright © 2025 Marco Antonio de Souza - All Rights Reserved
    
    -- Get current recipe count (excluding deleted)
    SELECT COUNT(*) INTO v_current_count
    FROM recipes
    WHERE tenant_id = p_tenant_id
      AND deleted_at IS NULL;
    
    -- Get plan limit
    SELECT p.max_recipes INTO v_max_recipes
    FROM plans p
    JOIN tenants t ON t.plan = p.name
    WHERE t.id = p_tenant_id;
    
    -- Return true if under limit
    RETURN v_current_count < v_max_recipes;
END;
$$;

COMMENT ON FUNCTION can_add_recipe IS 
'© Marco Antonio de Souza - Checks if tenant can add another recipe based on plan limits';


-- ============================================================================
-- HELPER FUNCTION: Get current usage stats
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code

CREATE OR REPLACE FUNCTION get_usage_stats(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Copyright © 2025 Marco Antonio de Souza - All Rights Reserved
    
    SELECT json_build_object(
        'users', (SELECT COUNT(*) FROM user_profiles WHERE tenant_id = p_tenant_id),
        'recipes', (SELECT COUNT(*) FROM recipes WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
        'max_users', p.max_users,
        'max_recipes', p.max_recipes,
        'can_add_user', can_add_user(p_tenant_id),
        'can_add_recipe', can_add_recipe(p_tenant_id),
        'plan', t.plan
    ) INTO v_result
    FROM tenants t
    JOIN plans p ON p.name = t.plan
    WHERE t.id = p_tenant_id;
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_usage_stats IS 
'© Marco Antonio de Souza - Returns comprehensive usage statistics for a tenant';


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to test the policies (© Marco Antonio de Souza)

/*
-- Test 1: Check current policies
SELECT schemaname, tablename, policyname, qual 
FROM pg_policies 
WHERE policyname LIKE '%limit%';

-- Test 2: Check if a tenant can add user
SELECT can_add_user('YOUR_TENANT_ID_HERE');

-- Test 3: Check if a tenant can add recipe
SELECT can_add_recipe('YOUR_TENANT_ID_HERE');

-- Test 4: Get full usage stats
SELECT get_usage_stats('YOUR_TENANT_ID_HERE');

-- Test 5: Try to insert beyond limit (should fail)
-- This will fail if you're at max_users for your plan
INSERT INTO user_profiles (tenant_id, email, full_name, role)
VALUES ('YOUR_TENANT_ID_HERE', 'test@example.com', 'Test User', 'employee');
*/


-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION can_add_user TO authenticated;
GRANT EXECUTE ON FUNCTION can_add_recipe TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_stats TO authenticated;

-- Grant to service role for backend API
GRANT EXECUTE ON FUNCTION can_add_user TO service_role;
GRANT EXECUTE ON FUNCTION can_add_recipe TO service_role;
GRANT EXECUTE ON FUNCTION get_usage_stats TO service_role;


-- ============================================================================
-- AUDIT LOG
-- ============================================================================
-- © Marco Antonio de Souza - Proprietary Code

INSERT INTO audit_logs (action, table_name, details, performed_by)
VALUES (
    'RLS_POLICIES_CREATED',
    'user_profiles, recipes',
    'Plan limit enforcement policies created by Marco Antonio de Souza',
    (SELECT id FROM user_profiles WHERE email = 'admin@estokmax.com' LIMIT 1)
);


-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
-- © 2025 Marco Antonio de Souza - All Rights Reserved
-- Unauthorized copying, modification, or distribution is prohibited.
