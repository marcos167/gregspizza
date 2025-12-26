import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Tenant {
    id: string;
    slug: string;
    name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    custom_domain?: string;
    plan: string;
    status: string;
    max_users: number;
    max_recipes: number;
    max_storage_mb: number;
    max_ai_actions_daily: number;
    settings: any;
    created_at: string;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    loading: boolean;
    refreshTenant: () => Promise<void>;
    canAddUser: () => Promise<boolean>;
    canAddRecipe: () => Promise<boolean>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    const { user, profile } = useAuth();
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profile?.tenant_id) {
            loadTenant();
        } else {
            setCurrentTenant(null);
            setLoading(false);
        }
    }, [user, profile?.tenant_id]);

    const loadTenant = async () => {
        if (!profile?.tenant_id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', profile.tenant_id)
                .single();

            if (error) throw error;
            setCurrentTenant(data);

            // Apply tenant branding
            applyTenantBranding(data);
        } catch (error) {
            console.error('[TenantContext] Error loading tenant:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTenantBranding = (tenant: Tenant) => {
        // Apply CSS variables for dynamic theming
        document.documentElement.style.setProperty('--tenant-primary', tenant.primary_color);
        document.documentElement.style.setProperty('--tenant-secondary', tenant.secondary_color);

        if (tenant.logo_url) {
            document.documentElement.style.setProperty('--tenant-logo', `url(${tenant.logo_url})`);
        }

        // Update page title
        document.title = `${tenant.name} - Sistema de Gestão`;
    };

    const refreshTenant = async () => {
        await loadTenant();
    };

    const canAddUser = async (): Promise<boolean> => {
        if (!currentTenant) return false;

        try {
            const { count } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', currentTenant.id)
                .eq('status', 'ACTIVE');

            return (count || 0) < currentTenant.max_users;
        } catch (error) {
            console.error('[TenantContext] Error checking user limit:', error);
            return false;
        }
    };

    const canAddRecipe = async (): Promise<boolean> => {
        if (!currentTenant) return false;

        try {
            const { count } = await supabase
                .from('recipes')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', currentTenant.id)
                .is('deleted_at', null);

            return (count || 0) < currentTenant.max_recipes;
        } catch (error) {
            console.error('[TenantContext] Error checking recipe limit:', error);
            return false;
        }
    };

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                loading,
                refreshTenant,
                canAddUser,
                canAddRecipe
            }}
        >
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
