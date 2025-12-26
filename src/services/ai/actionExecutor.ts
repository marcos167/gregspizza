import { supabase } from '../../lib/supabase';
import type { ActionPreviewData } from '../../components/AI/ActionPreview';

export interface PendingAction {
    id: string;
    user_id: string;
    action_type: string;
    action_label: string;
    preview_data: any;
    impact_summary: any;
    status: 'pending' | 'confirmed' | 'rejected' | 'expired';
    created_at: string;
    expires_at: string;
}

export class ActionExecutor {
    /**
     * Create a pending action that requires user confirmation
     */
    async createPendingAction(actionData: ActionPreviewData): Promise<string> {
        const { data, error } = await supabase
            .from('pending_actions')
            .insert({
                action_type: actionData.actionType,
                action_label: actionData.title,
                preview_data: actionData.preview,
                impact_summary: actionData.impact
            })
            .select()
            .single();

        if (error) throw error;
        return data.id;
    }

    /**
     * Confirm and execute a pending action
     */
    async confirmAction(actionId: string): Promise<any> {
        // Get the pending action
        const { data: action, error: fetchError } = await supabase
            .from('pending_actions')
            .select('*')
            .eq('id', actionId)
            .single();

        if (fetchError) throw fetchError;
        if (!action) throw new Error('Action not found');
        if (action.status !== 'pending') throw new Error('Action already processed');

        // Execute based on action type
        let result;
        try {
            result = await this.executeActionByType(
                action.action_type,
                action.preview_data
            );

            // Update status to confirmed
            await supabase
                .from('pending_actions')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString(),
                    result
                })
                .eq('id', actionId);

            // Log to timeline
            await this.logToTimeline({
                action_type: 'ai_action',
                entity_type: this.getEntityType(action.action_type),
                entity_id: result.id,
                entity_name: result.name || action.action_label,
                description: `IA executou: ${action.action_label}`,
                metadata: result,
                actor: 'ai'
            });

            return result;
        } catch (error) {
            // Update status to rejected
            await supabase
                .from('pending_actions')
                .update({
                    status: 'rejected',
                    result: { error: (error as Error).message }
                })
                .eq('id', actionId);

            throw error;
        }
    }

    /**
     * Execute action based on type
     */
    private async executeActionByType(actionType: string, data: any): Promise<any> {
        switch (actionType) {
            case 'create_recipes':
                return await this.createRecipes(data);

            case 'update_stock':
                return await this.updateStock(data);

            case 'clone_recipe':
                return await this.cloneRecipe(data);

            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }
    }

    /**
     * Create multiple recipes
     */
    private async createRecipes(recipes: any[]): Promise<any> {
        const { data, error } = await supabase
            .from('recipes')
            .insert(recipes)
            .select();

        if (error) throw error;
        return { id: data[0]?.id, name: `${data.length} receitas`, count: data.length };
    }

    /**
     * Update stock levels
     */
    private async updateStock(stockUpdates: any[]): Promise<any> {
        const results = [];

        for (const update of stockUpdates) {
            const { data, error } = await supabase
                .from('stock_movements')
                .insert({
                    ingredient_id: update.ingredient_id,
                    quantity: update.quantity,
                    type: update.type,
                    notes: 'Atualizado via IA'
                })
                .select();

            if (error) throw error;
            results.push(data[0]);
        }

        return { id: results[0]?.id, name: 'Estoque atualizado', count: results.length };
    }

    /**
     * Clone a recipe
     */
    private async cloneRecipe(recipe: any): Promise<any> {
        const { data, error } = await supabase
            .from('recipes')
            .insert({
                ...recipe,
                name: `${recipe.name} (Cópia)`,
                id: undefined // Let DB generate new ID
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Log action to operational timeline
     */
    private async logToTimeline(event: {
        action_type: string;
        entity_type: string;
        entity_id?: string;
        entity_name?: string;
        description: string;
        metadata?: any;
        impact_summary?: string;
        actor?: string;
    }): Promise<void> {
        await supabase.rpc('log_timeline_event', {
            p_user_id: (await supabase.auth.getUser()).data.user?.id,
            p_action_type: event.action_type,
            p_entity_type: event.entity_type,
            p_entity_id: event.entity_id || null,
            p_entity_name: event.entity_name || null,
            p_description: event.description,
            p_metadata: event.metadata || {},
            p_impact_summary: event.impact_summary || null,
            p_actor: event.actor || 'user'
        });
    }

    /**
     * Get entity type from action type
     */
    private getEntityType(actionType: string): string {
        if (actionType.includes('recipe')) return 'recipe';
        if (actionType.includes('stock')) return 'stock';
        if (actionType.includes('ingredient')) return 'ingredient';
        return 'other';
    }

    /**
     * Cancel a pending action
     */
    async cancelAction(actionId: string): Promise<void> {
        await supabase
            .from('pending_actions')
            .update({ status: 'rejected' })
            .eq('id', actionId);
    }

    /**
     * Get all pending actions for current user
     */
    async getPendingActions(): Promise<PendingAction[]> {
        const { data, error } = await supabase
            .from('pending_actions')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}

export const actionExecutor = new ActionExecutor();
