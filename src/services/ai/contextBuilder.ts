import { supabase } from '../../lib/supabase';
import type { SystemContext } from '../../types/ai';

export async function buildSystemContext(userId: string): Promise<SystemContext> {
    try {
        // Fetch stock summary
        const { data: ingredients } = await supabase
            .from('ingredients')
            .select('id, name, current_stock, min_stock, unit')
            .is('deleted_at', null);

        const totalIngredients = ingredients?.length || 0;
        const lowStockCount = ingredients?.filter(i =>
            (i.current_stock || 0) <= (i.min_stock || 0)
        ).length || 0;
        const outOfStockCount = ingredients?.filter(i =>
            (i.current_stock || 0) === 0
        ).length || 0;
        const criticalItems = ingredients
            ?.filter(i => (i.current_stock || 0) === 0)
            .slice(0, 5)
            .map(i => ({
                name: i.name,
                stock: i.current_stock || 0,
                unit: i.unit,
            })) || [];

        // Fetch recipes summary
        const { data: recipes } = await supabase
            .from('recipes')
            .select(`
                id,
                name,
                type,
                recipe_ingredients(
                    quantity_needed,
                    ingredient:ingredients(current_stock)
                )
            `)
            .is('deleted_at', null);

        const totalRecipes = recipes?.length || 0;
        const recipesWithIngredients = recipes?.filter(r =>
            r.recipe_ingredients && r.recipe_ingredients.length > 0
        ).length || 0;

        // Calculate recipes without sufficient stock
        const recipesWithoutStock = recipes?.filter(r => {
            if (!r.recipe_ingredients || r.recipe_ingredients.length === 0) return true;

            return r.recipe_ingredients.some((ri: any) => {
                const ingredientData = ri.ingredient;
                const stock = ingredientData?.current_stock || 0;
                return stock < ri.quantity_needed;
            });
        }).length || 0;

        const recentRecipes = recipes?.slice(0, 3).map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
        })) || [];

        // Fetch recent activity
        const { data: recentActivity } = await supabase
            .from('action_logs')
            .select('action_type, entity_type, entity_name, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, role')
            .eq('id', userId)
            .single();

        return {
            stock: {
                total_ingredients: totalIngredients,
                low_stock_count: lowStockCount,
                out_of_stock_count: outOfStockCount,
                critical_items: criticalItems,
            },
            recipes: {
                total: totalRecipes,
                with_ingredients: recipesWithIngredients,
                without_stock: recipesWithoutStock,
                recent: recentRecipes,
            },
            recent_activity: (recentActivity || []).map((a: any) => ({
                action_type: a.action_type,
                entity_type: a.entity_type,
                entity_name: a.entity_name || '',
                created_at: a.created_at,
            })),
            user: {
                id: profile?.id || userId,
                email: profile?.email || '',
                role: profile?.role || 'user',
            },
        };
    } catch (error) {
        console.error('Error building context:', error);

        // Return minimal context on error
        return {
            stock: {
                total_ingredients: 0,
                low_stock_count: 0,
                out_of_stock_count: 0,
                critical_items: [],
            },
            recipes: {
                total: 0,
                with_ingredients: 0,
                without_stock: 0,
                recent: [],
            },
            recent_activity: [],
            user: {
                id: userId,
                email: '',
                role: 'user',
            },
        };
    }
}
