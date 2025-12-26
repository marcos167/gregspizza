import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserAction {
    id: string;
    action_type: string;
    action_label: string;
    action_data: any;
    count: number;
    last_used: string;
}

export const useActionTracker = () => {
    const { user } = useAuth();

    /**
     * Track a user action (increments if exists, creates if new)
     */
    const trackAction = async (
        actionType: string,
        actionLabel: string,
        actionData: any = {}
    ): Promise<void> => {
        if (!user) return;

        try {
            await supabase.rpc('track_user_action', {
                p_user_id: user.id,
                p_action_type: actionType,
                p_action_label: actionLabel,
                p_action_data: actionData
            });
        } catch (err) {
            console.error('[ActionTracker] Error tracking action:', err);
        }
    };

    /**
     * Get top N actions for current user
     */
    const getTopActions = async (limit: number = 5): Promise<UserAction[]> => {
        if (!user) return [];

        try {
            const { data, error } = await supabase.rpc('get_top_user_actions', {
                p_user_id: user.id,
                p_limit: limit
            });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[ActionTracker] Error fetching top actions:', err);
            return [];
        }
    };

    return {
        trackAction,
        getTopActions
    };
};

export default useActionTracker;
