import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    status: UserStatus;
    approved_by?: string;
    approved_at?: string;
    suspended_by?: string;
    suspended_at?: string;
    suspension_reason?: string;
    last_login?: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export const useRBAC = () => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadUserProfile();
        }
    }, [user]);

    const loadUserProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setUserProfile(data);
        } catch (err) {
            console.error('[useRBAC] Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Check if user has specific role
     */
    const hasRole = (role: UserRole): boolean => {
        if (!userProfile) return false;
        return userProfile.role === role;
    };

    /**
     * Check if user is admin or owner
     */
    const isAdmin = (): boolean => {
        return hasRole('ADMIN') || hasRole('OWNER');
    };

    /**
     * Check if user is active
     */
    const isActive = (): boolean => {
        return userProfile?.status === 'ACTIVE';
    };

    /**
     * Check if user can access system
     */
    const canAccess = (): boolean => {
        return isActive();
    };

    /**
     * Approve a pending user (admin only)
     */
    const approveUser = async (
        userId: string,
        role: UserRole = 'STAFF'
    ): Promise<boolean> => {
        if (!isAdmin()) {
            console.error('[useRBAC] Only admins can approve users');
            return false;
        }

        try {
            const { data, error } = await supabase.rpc('approve_user', {
                p_user_id: userId,
                p_role: role
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useRBAC] Error approving user:', err);
            return false;
        }
    };

    /**
     * Suspend an active user (admin only)
     */
    const suspendUser = async (
        userId: string,
        reason: string = 'Suspenso pelo administrador'
    ): Promise<boolean> => {
        if (!isAdmin()) {
            console.error('[useRBAC] Only admins can suspend users');
            return false;
        }

        try {
            const { data, error } = await supabase.rpc('suspend_user', {
                p_user_id: userId,
                p_reason: reason
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useRBAC] Error suspending user:', err);
            return false;
        }
    };

    /**
     * Activate a suspended user (admin only)
     */
    const activateUser = async (userId: string): Promise<boolean> => {
        if (!isAdmin()) {
            console.error('[useRBAC] Only admins can activate users');
            return false;
        }

        try {
            const { data, error } = await supabase.rpc('activate_user', {
                p_user_id: userId
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useRBAC] Error activating user:', err);
            return false;
        }
    };

    /**
     * Change user role (admin only)
     */
    const changeUserRole = async (
        userId: string,
        newRole: UserRole
    ): Promise<boolean> => {
        if (!isAdmin()) {
            console.error('[useRBAC] Only admins can change roles');
            return false;
        }

        try {
            const { data, error } = await supabase.rpc('change_user_role', {
                p_user_id: userId,
                p_new_role: newRole
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useRBAC] Error changing role:', err);
            return false;
        }
    };

    /**
     * Get pending users (admin only)
     */
    const getPendingUsers = async (): Promise<UserProfile[]> => {
        if (!isAdmin()) return [];

        try {
            const { data, error } = await supabase
                .from('pending_users')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[useRBAC] Error fetching pending users:', err);
            return [];
        }
    };

    /**
     * Get all users (admin only)
     */
    const getAllUsers = async (): Promise<UserProfile[]> => {
        if (!isAdmin()) return [];

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[useRBAC] Error fetching users:', err);
            return [];
        }
    };

    return {
        userProfile,
        loading,
        hasRole,
        isAdmin,
        isActive,
        canAccess,
        approveUser,
        suspendUser,
        activateUser,
        changeUserRole,
        getPendingUsers,
        getAllUsers,
        reload: loadUserProfile
    };
};

export default useRBAC;
