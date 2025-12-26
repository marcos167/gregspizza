import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface TimelineEvent {
    action_type: 'create' | 'update' | 'delete' | 'restore';
    entity_type: 'recipe' | 'ingredient' | 'stock' | 'category' | 'sale' | 'other';
    entity_id?: string;
    entity_name?: string;
    description: string;
    metadata?: any;
    impact_summary?: string;
    actor?: 'user' | 'ai' | 'system';
}

export const useTimelineLogger = () => {
    const { user } = useAuth();

    /**
     * Log an event to the operational timeline
     */
    const logEvent = async (event: TimelineEvent): Promise<void> => {
        if (!user) {
            console.warn('[TimelineLogger] No user, skipping log');
            return;
        }

        try {
            const { error } = await supabase.rpc('log_timeline_event', {
                p_user_id: user.id,
                p_action_type: event.action_type,
                p_entity_type: event.entity_type,
                p_entity_id: event.entity_id || null,
                p_entity_name: event.entity_name || null,
                p_description: event.description,
                p_metadata: event.metadata || {},
                p_impact_summary: event.impact_summary || null,
                p_actor: event.actor || 'user'
            });

            if (error) {
                console.error('[TimelineLogger] Error logging event:', error);
            } else {
                console.log('[TimelineLogger] ✅ Event logged:', event.description);
            }
        } catch (err) {
            console.error('[TimelineLogger] Exception:', err);
        }
    };

    /**
     * Log a create operation
     */
    const logCreate = async (
        entityType: TimelineEvent['entity_type'],
        entityId: string,
        entityName: string,
        metadata?: any
    ): Promise<void> => {
        await logEvent({
            action_type: 'create',
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            description: `${getEntityLabel(entityType)} "${entityName}" criado`,
            metadata
        });
    };

    /**
     * Log an update operation
     */
    const logUpdate = async (
        entityType: TimelineEvent['entity_type'],
        entityId: string,
        entityName: string,
        changes?: string,
        metadata?: any
    ): Promise<void> => {
        await logEvent({
            action_type: 'update',
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            description: `${getEntityLabel(entityType)} "${entityName}" atualizado${changes ? `: ${changes}` : ''}`,
            metadata
        });
    };

    /**
     * Log a delete operation
     */
    const logDelete = async (
        entityType: TimelineEvent['entity_type'],
        entityId: string,
        entityName: string,
        metadata?: any
    ): Promise<void> => {
        await logEvent({
            action_type: 'delete',
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            description: `${getEntityLabel(entityType)} "${entityName}" excluído`,
            metadata
        });
    };

    /**
     * Log a restore operation
     */
    const logRestore = async (
        entityType: TimelineEvent['entity_type'],
        entityId: string,
        entityName: string
    ): Promise<void> => {
        await logEvent({
            action_type: 'restore',
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            description: `${getEntityLabel(entityType)} "${entityName}" restaurado`
        });
    };

    /**
     * Get user-friendly entity label
     */
    const getEntityLabel = (entityType: string): string => {
        const labels: Record<string, string> = {
            recipe: 'Receita',
            ingredient: 'Ingrediente',
            stock: 'Estoque',
            category: 'Categoria',
            sale: 'Venda',
            other: 'Item'
        };
        return labels[entityType] || entityType;
    };

    return {
        logEvent,
        logCreate,
        logUpdate,
        logDelete,
        logRestore
    };
};

export default useTimelineLogger;
