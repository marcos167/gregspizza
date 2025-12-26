/**
 * Audit Logger
 * 
 * Comprehensive logging system for security-critical operations
 * Tracks all admin actions with full context for compliance
 */

import { supabase } from '../lib/supabase';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    details: Record<string, any>;
    riskLevel?: RiskLevel;
}

/**
 * Get client IP address (best effort)
 */
const getClientIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
    } catch {
        return 'unknown';
    }
};

/**
 * Log an admin action to the audit trail
 * 
 * @param entry - Audit log entry with action details
 */
export const logAdminAction = async (entry: AuditLogEntry): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('[AUDIT] Cannot log action: No user authenticated');
            return;
        }

        const ipAddress = await getClientIP();
        const userAgent = navigator.userAgent;

        await supabase.from('operational_timeline').insert({
            user_id: user.id,
            action_type: entry.action,
            entity_type: entry.entityType,
            entity_id: entry.entityId,
            entity_name: entry.entityName,
            description: JSON.stringify(entry.details),
            metadata: {
                risk_level: entry.riskLevel || 'medium',
                ip_address: ipAddress,
                user_agent: userAgent,
                timestamp: new Date().toISOString()
            },
            actor: 'platform_admin'
        });

        // Log to console for immediate visibility
        console.log('[AUDIT]', {
            action: entry.action,
            entity: entry.entityType,
            risk: entry.riskLevel,
            user: user.email,
            ip: ipAddress
        });
    } catch (error) {
        console.error('[AUDIT] Failed to log action:', error);
        // Don't throw - logging failure shouldn't break app
    }
};

/**
 * Pre-defined audit actions with risk levels
 */
export const AuditActions = {
    // Critical risk actions
    CREATE_TENANT: {
        action: 'create_tenant',
        entityType: 'tenant',
        riskLevel: 'critical' as RiskLevel
    },
    SUSPEND_TENANT: {
        action: 'suspend_tenant',
        entityType: 'tenant',
        riskLevel: 'critical' as RiskLevel
    },
    DELETE_TENANT: {
        action: 'delete_tenant',
        entityType: 'tenant',
        riskLevel: 'critical' as RiskLevel
    },
    CHANGE_SUPER_ADMIN: {
        action: 'change_super_admin',
        entityType: 'user',
        riskLevel: 'critical' as RiskLevel
    },

    // High risk actions
    ACTIVATE_TENANT: {
        action: 'activate_tenant',
        entityType: 'tenant',
        riskLevel: 'high' as RiskLevel
    },
    UPDATE_TENANT_PLAN: {
        action: 'update_plan',
        entityType: 'tenant',
        riskLevel: 'high' as RiskLevel
    },
    UPDATE_TENANT_LIMITS: {
        action: 'update_limits',
        entityType: 'tenant',
        riskLevel: 'high' as RiskLevel
    },

    // Medium risk actions
    UPDATE_TENANT_BRANDING: {
        action: 'update_branding',
        entityType: 'tenant',
        riskLevel: 'medium' as RiskLevel
    },
    VIEW_TENANT_DETAILS: {
        action: 'view_details',
        entityType: 'tenant',
        riskLevel: 'low' as RiskLevel
    },

    // Low risk actions
    VIEW_TENANT_LIST: {
        action: 'view_list',
        entityType: 'tenant',
        riskLevel: 'low' as RiskLevel
    }
} as const;
