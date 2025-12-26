/**
 * Tenant Validation Middleware
 * 
 * Ensures complete isolation between tenants and validates
 * that users can only access data from their assigned tenant.
 * 
 * CRITICAL SECURITY COMPONENT - DO NOT MODIFY WITHOUT REVIEW
 */

import { supabase } from '../lib/supabase';

export interface TenantValidationResult {
    valid: boolean;
    reason?: string;
    tenantId?: string;
}

/**
 * Validates that a user has access to a specific tenant
 * 
 * @param userId - The user's ID from auth
 * @param tenantId - The tenant ID being accessed
 * @returns Validation result with reason if invalid
 */
export const validateTenantAccess = async (
    userId: string,
    tenantId: string
): Promise<TenantValidationResult> => {
    try {
        // Get user profile with tenant info
        const { data, error } = await supabase
            .from('user_profiles')
            .select('tenant_id, status, role')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return {
                valid: false,
                reason: 'User profile not found'
            };
        }

        // SUPER_ADMIN can access all tenants (platform level)
        if (data.role === 'SUPER_ADMIN') {
            // But SUPER_ADMIN should never have a tenant_id
            if (data.tenant_id) {
                console.error('[SECURITY] SUPER_ADMIN has tenant_id:', {
                    userId,
                    tenant_id: data.tenant_id
                });
                return {
                    valid: false,
                    reason: 'SUPER_ADMIN should not have tenant context'
                };
            }
            return { valid: true };
        }

        // Validate user belongs to the requested tenant
        if (data.tenant_id !== tenantId) {
            console.error('[SECURITY] Tenant access violation:', {
                userId,
                userTenantId: data.tenant_id,
                requestedTenantId: tenantId
            });
            return {
                valid: false,
                reason: 'User does not belong to this tenant'
            };
        }

        // Validate user status is ACTIVE
        if (data.status !== 'ACTIVE') {
            return {
                valid: false,
                reason: `User status is ${data.status}`
            };
        }

        // Check if tenant is suspended
        const { data: tenantData } = await supabase
            .from('tenants')
            .select('status')
            .eq('id', tenantId)
            .single();

        if (tenantData?.status === 'suspended') {
            return {
                valid: false,
                reason: 'Tenant is suspended'
            };
        }

        return {
            valid: true,
            tenantId: data.tenant_id
        };
    } catch (error) {
        console.error('[SECURITY] Tenant validation error:', error);
        return {
            valid: false,
            reason: 'Validation failed'
        };
    }
};

/**
 * Get current user's tenant ID
 * Returns null for SUPER_ADMIN (platform level)
 */
export const getCurrentTenantId = async (): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (!data) return null;

        // SUPER_ADMIN operates at platform level (no tenant)
        if (data.role === 'SUPER_ADMIN') {
            return null;
        }

        return data.tenant_id;
    } catch (error) {
        console.error('[SECURITY] Error getting tenant ID:', error);
        return null;
    }
};

/**
 * Enforce tenant context for a query
 * Throws error if user tries to access wrong tenant's data
 */
export const enforceTenantContext = async (
    requestedTenantId: string
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    const validation = await validateTenantAccess(user.id, requestedTenantId);

    if (!validation.valid) {
        throw new Error(`Access denied: ${validation.reason}`);
    }
};

/**
 * Middleware hook to validate tenant access on component mount
 */
export const useTenantValidation = (requiredTenantId?: string) => {
    const validate = async () => {
        if (!requiredTenantId) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Not authenticated');
        }

        const validation = await validateTenantAccess(user.id, requiredTenantId);
        if (!validation.valid) {
            console.error('[SECURITY] Tenant validation failed:', validation.reason);
            // In a real app, redirect to access denied or logout
            window.location.href = '/access-denied';
        }
    };

    return { validate };
};
