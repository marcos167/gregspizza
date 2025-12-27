/**
 * usePlanLimits Hook
 * 
 * Manages plan limits and usage tracking for the current tenant.
 * Checks if tenant can add more users, recipes, etc based on their plan.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PlanLimits {
    name: string;
    display_name: string;
    price_monthly: number;
    max_users: number;
    max_recipes: number;
    max_storage_mb: number;
    max_ai_actions_daily: number;
    features: string[];
}

interface Usage {
    users: number;
    recipes: number;
    storage_mb: number;
    ai_actions_today: number;
}

interface TrialStatus {
    is_trial: boolean;
    days_remaining: number;
    hours_remaining: number;
    expires_at: string | null;
    requires_payment: boolean;
    card_added: boolean;
}

export const usePlanLimits = (tenantId?: string) => {
    const [limits, setLimits] = useState<PlanLimits | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLimitsAndUsage = useCallback(async () => {
        if (!tenantId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Get current tenant to know which plan they're on
            const { data: tenant, error: tenantError } = await supabase
                .from('tenants')
                .select('plan, id')
                .eq('id', tenantId)
                .single();

            if (tenantError) throw tenantError;

            // Get plan limits
            const { data: planData, error: planError } = await supabase
                .rpc('get_plan_details', {
                    p_plan_name: tenant.plan
                });

            if (planError) throw planError;

            // Get trial status
            const { data: trialData, error: trialError } = await supabase
                .rpc('check_trial_status', {
                    p_tenant_id: tenantId
                });

            if (trialError) console.warn('Trial status check failed:', trialError);

            // Get current usage in parallel
            const [
                { count: usersCount },
                { count: recipesCount },
            ] = await Promise.all([
                supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId)
                    .eq('status', 'ACTIVE'),
                supabase
                    .from('recipes')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', tenantId)
                    .is('deleted_at', null),
            ]);

            setLimits(planData);
            setUsage({
                users: usersCount || 0,
                recipes: recipesCount || 0,
                storage_mb: 0, // TODO: Implement storage tracking
                ai_actions_today: 0, // TODO: Implement AI action tracking
            });

            if (trialData && trialData.length > 0) {
                setTrialStatus(trialData[0]);
            }

            setLoading(false);
        } catch (err: any) {
            console.error('[usePlanLimits] Error:', err);
            setError(err.message);
            setLoading(false);
        }
    }, [tenantId]);

    useEffect(() => {
        loadLimitsAndUsage();
    }, [loadLimitsAndUsage]);

    const canAddUser = useCallback((): boolean => {
        if (!limits || !usage) return false;
        return usage.users < limits.max_users;
    }, [limits, usage]);

    const canAddRecipe = useCallback((): boolean => {
        if (!limits || !usage) return false;
        return usage.recipes < limits.max_recipes;
    }, [limits, usage]);

    const hasFeature = useCallback((feature: string): boolean => {
        if (!limits) return false;
        return limits.features.includes(feature);
    }, [limits]);

    const getUsersRemaining = useCallback((): number => {
        if (!limits || !usage) return 0;
        return Math.max(0, limits.max_users - usage.users);
    }, [limits, usage]);

    const getRecipesRemaining = useCallback((): number => {
        if (!limits || !usage) return 0;
        return Math.max(0, limits.max_recipes - usage.recipes);
    }, [limits, usage]);

    const getUsagePercentage = useCallback((type: 'users' | 'recipes'): number => {
        if (!limits || !usage) return 0;

        if (type === 'users') {
            return Math.round((usage.users / limits.max_users) * 100);
        } else {
            return Math.round((usage.recipes / limits.max_recipes) * 100);
        }
    }, [limits, usage]);

    const isNearLimit = useCallback((type: 'users' | 'recipes', threshold: number = 80): boolean => {
        return getUsagePercentage(type) >= threshold;
    }, [getUsagePercentage]);

    return {
        limits,
        usage,
        trialStatus,
        loading,
        error,
        canAddUser,
        canAddRecipe,
        hasFeature,
        getUsersRemaining,
        getRecipesRemaining,
        getUsagePercentage,
        isNearLimit,
        refresh: loadLimitsAndUsage,
    };
};
