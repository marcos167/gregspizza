import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface TrashItem {
    item_type: 'recipe' | 'ingredient' | 'category' | 'sale';
    id: string;
    item_name: string;
    deleted_at: string;
    user_id: string;
    metadata: any;
}

export const useTrash = () => {
    const { user } = useAuth();

    /**
     * Soft delete an item (move to trash)
     */
    const softDelete = async (
        tableName: string,
        recordId: string
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            const { data, error } = await supabase.rpc('soft_delete', {
                p_table_name: tableName,
                p_record_id: recordId,
                p_user_id: user.id
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useTrash] Error soft deleting:', err);
            return false;
        }
    };

    /**
     * Restore an item from trash
     */
    const restore = async (
        tableName: string,
        recordId: string
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            const { data, error } = await supabase.rpc('restore_from_trash', {
                p_table_name: tableName,
                p_record_id: recordId,
                p_user_id: user.id
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useTrash] Error restoring:', err);
            return false;
        }
    };

    /**
     * Permanently delete an item from trash
     */
    const permanentDelete = async (
        tableName: string,
        recordId: string
    ): Promise<boolean> => {
        if (!user) return false;

        try {
            const { data, error } = await supabase.rpc('permanent_delete', {
                p_table_name: tableName,
                p_record_id: recordId,
                p_user_id: user.id
            });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('[useTrash] Error permanently deleting:', err);
            return false;
        }
    };

    /**
     * Get all trash items for current user
     */
    const getTrashItems = async (): Promise<TrashItem[]> => {
        if (!user) return [];

        try {
            const { data, error } = await supabase
                .from('trash_bin')
                .select('*')
                .eq('user_id', user.id)
                .order('deleted_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error('[useTrash] Error fetching trash:', err);
            return [];
        }
    };

    /**
     * Get trash count
     */
    const getTrashCount = async (): Promise<number> => {
        if (!user) return 0;

        try {
            const { count, error } = await supabase
                .from('trash_bin')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (error) throw error;
            return count || 0;
        } catch (err) {
            console.error('[useTrash] Error counting trash:', err);
            return 0;
        }
    };

    return {
        softDelete,
        restore,
        permanentDelete,
        getTrashItems,
        getTrashCount
    };
};

export default useTrash;
