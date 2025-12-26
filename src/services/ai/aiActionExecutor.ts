import type { ActionPreviewData } from '../../components/AI/ActionPreview';
import { supabase } from '../../lib/supabase';

export interface RecipeGenerationParams {
    count: number;
    useCurrentStock: boolean;
    theme?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ActionResult {
    success: boolean;
    action: string;
    preview?: ActionPreviewData;
    data?: any;
    error?: string;
}

/**
 * AI Action Executor - Handles executable AI actions
 */
export class AIActionExecutor {
    private geminiModel: any;

    constructor(geminiModel: any) {
        this.geminiModel = geminiModel;
    }

    /**
     * Main action executor - routes to specific action handlers
     */
    async executeAction(
        action: string,
        params: any,
        userId: string
    ): Promise<ActionResult> {
        console.log(`[AIActionExecutor] Executing action: ${action}`, params);

        try {
            switch (action) {
                case 'create_recipes_ai':
                    return await this.createRecipes(params, userId);

                case 'clone_recipe':
                    return await this.cloneRecipe(params, userId);

                case 'adjust_recipes_for_stock':
                    return await this.adjustRecipesForStock(params, userId);

                default:
                    return {
                        success: false,
                        action,
                        error: `Unknown action: ${action}`
                    };
            }
        } catch (error: any) {
            console.error(`[AIActionExecutor] Error executing ${action}:`, error);
            return {
                success: false,
                action,
                error: error.message || 'Unknown error'
            };
        }
    }

    /**
     * Create recipes using AI
     */
    private async createRecipes(
        params: RecipeGenerationParams,
        userId: string
    ): Promise<ActionResult> {
        console.log('[AIActionExecutor] Creating recipes with AI', params);

        // 1. Get current stock if requested
        let stockInfo = '';
        if (params.useCurrentStock) {
            const { data: ingredients } = await supabase
                .from('ingredients')
                .select('name, quantity, unit')
                .eq('user_id', userId);

            if (ingredients && ingredients.length > 0) {
                stockInfo = `Ingredientes disponíveis: ${ingredients.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}. `;
            }
        }

        // 2. Build AI prompt
        const theme = params.theme || 'pizzas tradicionais';
        const difficulty = params.difficulty || 'medium';

        const prompt = `Você é um chef especialista em pizzas. ${stockInfo}
        
Crie ${params.count} receitas de ${theme} com dificuldade ${difficulty}.

Para cada receita, forneça:
1. Nome criativo e atraente
2. Lista de ingredientes com quantidades precisas
3. Modo de preparo passo a passo (máximo 5 passos)
4. Tempo de preparo estimado
5. Custo estimado (em reais R$)
6. Categoria (ex: Tradicional, Especial, Vegetariana)

IMPORTANTE: Retorne APENAS um JSON array válido, sem texto adicional antes ou depois. Formato:
[
  {
    "name": "Nome da Pizza",
    "description": "Breve descrição",
    "ingredients": [
      {"name": "Ingrediente 1", "quantity": 200, "unit": "g"},
      {"name": "Ingrediente 2", "quantity": 150, "unit": "g"}
    ],
    "instructions": "Passo 1: ... Passo 2: ...",
    "prep_time_minutes": 30,
    "estimated_cost": 25.50,
    "category": "Tradicional"
  }
]`;

        // 3. Call Gemini AI
        const result = await this.geminiModel.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 4. Parse AI response
        console.log('[AIActionExecutor] Raw AI response:', text.substring(0, 200));

        // Clean up response (remove markdown code blocks if present)
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let recipes;
        try {
            recipes = JSON.parse(text);
        } catch (parseError) {
            console.error('[AIActionExecutor] Failed to parse JSON:', text);
            throw new Error('IA retornou formato inválido. Tente novamente.');
        }

        if (!Array.isArray(recipes)) {
            recipes = [recipes];
        }

        // 5. Calculate impact
        const totalCost = recipes.reduce((sum: number, r: any) => sum + (r.estimated_cost || 0), 0);
        const avgTime = recipes.reduce((sum: number, r: any) => sum + (r.prep_time_minutes || 0), 0) / recipes.length;

        const ingredientSet = new Set();
        recipes.forEach((r: any) => {
            r.ingredients?.forEach((ing: any) => ingredientSet.add(ing.name));
        });

        // 6. Build preview data
        const previewData: ActionPreviewData = {
            action: 'create_recipes_ai',
            title: `Criar ${recipes.length} Receitas com IA`,
            description: `A IA gerou ${recipes.length} receitas personalizadas para você.`,
            impact: {
                recipes: `+${recipes.length} novas receitas`,
                ingredients: `Usa ${ingredientSet.size} ingredientes diferentes`,
                cost: `Custo total estimado: R$ ${totalCost.toFixed(2)}`,
                time: `Tempo médio de preparo: ${Math.round(avgTime)} min`
            },
            previewData: {
                recipes: recipes.map((r: any) => ({
                    name: r.name,
                    category: r.category,
                    cost: `R$ ${r.estimated_cost?.toFixed(2) || '0.00'}`,
                    time: `${r.prep_time_minutes || 0} min`,
                    ingredients: r.ingredients?.length || 0
                }))
            },
            onConfirm: async () => {
                return await this.saveRecipesToDatabase(recipes, userId);
            },
            onCancel: () => {
                console.log('[AIActionExecutor] Recipe creation cancelled');
            }
        };

        return {
            success: true,
            action: 'create_recipes_ai',
            preview: previewData,
            data: recipes
        };
    }

    /**
     * Save recipes to database
     */
    private async saveRecipesToDatabase(recipes: any[], userId: string): Promise<boolean> {
        console.log('[AIActionExecutor] Saving recipes to database', recipes.length);

        try {
            for (const recipe of recipes) {
                // Insert recipe
                const { data: newRecipe, error: recipeError } = await supabase
                    .from('recipes')
                    .insert({
                        user_id: userId,
                        name: recipe.name,
                        description: recipe.description || '',
                        instructions: recipe.instructions || '',
                        prep_time_minutes: recipe.prep_time_minutes || 30,
                        category: recipe.category || 'Tradicional'
                    })
                    .select()
                    .single();

                if (recipeError) {
                    console.error('[AIActionExecutor] Recipe insert error:', recipeError);
                    throw recipeError;
                }

                // Insert ingredients
                if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                    const ingredientsData = recipe.ingredients.map((ing: any) => ({
                        recipe_id: newRecipe.id,
                        ingredient_name: ing.name,
                        quantity: ing.quantity || 0,
                        unit: ing.unit || 'g'
                    }));

                    const { error: ingredientsError } = await supabase
                        .from('recipe_ingredients')
                        .insert(ingredientsData);

                    if (ingredientsError) {
                        console.error('[AIActionExecutor] Ingredients insert error:', ingredientsError);
                    }
                }

                // Log to timeline
                await supabase.rpc('log_timeline_event', {
                    p_user_id: userId,
                    p_action_type: 'create',
                    p_entity_type: 'recipe',
                    p_entity_id: newRecipe.id,
                    p_entity_name: recipe.name,
                    p_description: `IA criou receita "${recipe.name}"`,
                    p_metadata: recipe,
                    p_actor: 'ai'
                });
            }

            console.log('[AIActionExecutor] ✅ All recipes saved successfully');
            return true;
        } catch (error) {
            console.error('[AIActionExecutor] Error saving recipes:', error);
            return false;
        }
    }

    /**
     * Clone a recipe with variations
     */
    private async cloneRecipe(_params: any, _userId: string): Promise<ActionResult> {
        // TODO: Implement recipe cloning
        return {
            success: false,
            action: 'clone_recipe',
            error: 'Not implemented yet'
        };
    }

    /**
     * Adjust recipes based on stock levels
     */
    private async adjustRecipesForStock(_params: any, _userId: string): Promise<ActionResult> {
        // TODO: Implement stock-based recipe adjustment
        return {
            success: false,
            action: 'adjust_recipes_for_stock',
            error: 'Not implemented yet'
        };
    }
}
