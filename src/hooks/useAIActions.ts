import { useState } from 'react';
import { aiClient } from '../services/ai/geminiClient';
import { useAuth } from '../contexts/AuthContext';
import type { ActionResult } from '../services/ai/aiActionExecutor';
import type { ActionPreviewData } from '../components/AI/ActionPreview';

export const useAIActions = () => {
    const { user } = useAuth();
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentPreview, setCurrentPreview] = useState<ActionPreviewData | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Execute an AI action with preview
     */
    const executeAction = async (action: string, params: any): Promise<ActionResult | null> => {
        if (!aiClient.actionExecutor) {
            setError('AI Action Executor not available');
            return null;
        }

        if (!user) {
            setError('User not authenticated');
            return null;
        }

        setIsExecuting(true);
        setError(null);

        try {
            console.log('[useAIActions] Executing action:', action, params);

            const result = await aiClient.actionExecutor.executeAction(
                action,
                params,
                user.id
            );

            if (result.success && result.preview) {
                // Set preview data for display
                setCurrentPreview(result.preview);
            } else if (!result.success) {
                setError(result.error || 'Action failed');
            }

            return result;
        } catch (err: any) {
            console.error('[useAIActions] Error:', err);
            setError(err.message || 'Unknown error');
            return null;
        } finally {
            setIsExecuting(false);
        }
    };

    /**
     * Clear current preview
     */
    const clearPreview = () => {
        setCurrentPreview(null);
    };

    /**
     * Confirm and execute the current preview
     */
    const confirmAction = async (): Promise<boolean> => {
        if (!currentPreview?.onConfirm) {
            return false;
        }

        try {
            const result = await currentPreview.onConfirm();
            const success = result === undefined ? true : Boolean(result);
            if (success) {
                setCurrentPreview(null);
            }
            return success;
        } catch (err: any) {
            console.error('[useAIActions] Confirm error:', err);
            setError(err.message);
            return false;
        }
    };

    /**
     * Cancel the current preview
     */
    const cancelAction = () => {
        if (currentPreview?.onCancel) {
            currentPreview.onCancel();
        }
        setCurrentPreview(null);
    };

    return {
        executeAction,
        confirmAction,
        cancelAction,
        clearPreview,
        isExecuting,
        currentPreview,
        error
    };
};

export default useAIActions;
