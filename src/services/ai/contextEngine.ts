// Context detection engine for AI suggestions
// No external dependencies needed for now

export interface PageContext {
    page: 'dashboard' | 'recipes' | 'stock' | 'sales' | 'ingredients' | 'categories' | 'timeline' | 'unknown';
    route: string;
    data?: any;
    user?: User;
    stock?: Stock;
}

export interface Suggestion {
    id: string;
    icon: string;
    text: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
    actionLabel?: string;
    actionData?: any;
}

export class ContextEngine {
    /**
     * Detect current page context from route
     */
    getPageFromRoute(pathname: string): PageContext['page'] {
        if (pathname.includes('/dashboard')) return 'dashboard';
        if (pathname.includes('/receitas')) return 'recipes';
        if (pathname.includes('/entrada')) return 'stock';
        if (pathname.includes('/saida')) return 'sales';
        if (pathname.includes('/ingredientes')) return 'ingredients';
        if (pathname.includes('/categories')) return 'categories';
        if (pathname.includes('/timeline')) return 'timeline';
        return 'unknown';
    }

    /**
     * Analyze context and generate suggestions
     */
    generateSuggestions(context: PageContext): Suggestion[] {
        const suggestions: Suggestion[] = [];

        switch (context.page) {
            case 'recipes':
                suggestions.push(...this.getRecipeSuggestions(context));
                break;
            case 'stock':
                suggestions.push(...this.getStockSuggestions(context));
                break;
            case 'dashboard':
                suggestions.push(...this.getDashboardSuggestions(context));
                break;
            case 'ingredients':
                suggestions.push(...this.getIngredientSuggestions(context));
                break;
        }

        // Sort by priority
        return suggestions.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Recipe page suggestions
     */
    private getRecipeSuggestions(context: PageContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const recipes = context.data?.recipes || [];

        // Empty state - suggest AI creation
        if (recipes.length === 0) {
            suggestions.push({
                id: 'create-first-recipes',
                icon: '✨',
                text: 'Você ainda não tem receitas. Posso criar as primeiras para você?',
                action: 'create_recipes_ai',
                priority: 'high',
                actionLabel: 'Criar com IA',
                actionData: { count: 5, useCurrentStock: true }
            });
        }

        // Has recipes - suggest optimization
        if (recipes.length > 0 && recipes.length < 10) {
            suggestions.push({
                id: 'expand-recipes',
                icon: '📝',
                text: `Você tem ${recipes.length} receitas. Quer expandir seu cardápio?`,
                action: 'create_recipes_ai',
                priority: 'medium',
                actionLabel: 'Adicionar mais',
                actionData: { count: 3, useCurrentStock: true }
            });
        }

        // Viewing specific recipe
        if (context.data?.selectedRecipe) {
            suggestions.push({
                id: 'clone-recipe',
                icon: '✂️',
                text: `Clonar "${context.data.selectedRecipe.name}" com variação?`,
                action: 'clone_recipe',
                priority: 'medium',
                actionLabel: 'Clonar',
                actionData: { recipeId: context.data.selectedRecipe.id }
            });
        }

        return suggestions;
    }

    /**
     * Stock page suggestions
     */
    private getStockSuggestions(context: PageContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const stock = context.stock;

        if (!stock) return suggestions;

        // Low stock warning
        const lowStockItems = this.findLowStockItems(stock);
        if (lowStockItems.length > 0) {
            suggestions.push({
                id: 'low-stock-warning',
                icon: '⚠️',
                text: `${lowStockItems.length} ingredientes com estoque baixo`,
                action: 'adjust_recipes_for_stock',
                priority: 'high',
                actionLabel: 'Ajustar Receitas',
                actionData: { lowStockItems }
            });
        }

        // Expiring items
        const expiringItems = this.findExpiringItems(stock);
        if (expiringItems.length > 0) {
            suggestions.push({
                id: 'expiring-items',
                icon: '📅',
                text: `${expiringItems.length} ingredientes vão vencer em breve`,
                action: 'create_recipes_with_expiring',
                priority: 'high',
                actionLabel: 'Usar Agora',
                actionData: { expiringItems }
            });
        }

        return suggestions;
    }

    /**
     * Dashboard suggestions
     */
    private getDashboardSuggestions(context: PageContext): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // General health check
        suggestions.push({
            id: 'daily-summary',
            icon: '📊',
            text: 'Ver resumo operacional de hoje',
            action: 'show_daily_summary',
            priority: 'low',
            actionLabel: 'Ver Resumo'
        });

        return suggestions;
    }

    /**
     * Ingredient page suggestions
     */
    private getIngredientSuggestions(_context: PageContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const ingredients = _context.data?.ingredients || [];

        if (ingredients.length === 0) {
            suggestions.push({
                id: 'add-first-ingredients',
                icon: '🧈',
                text: 'Adicione seus primeiros ingredientes para começar',
                action: 'navigate_to_ingredients',
                priority: 'medium',
                actionLabel: 'Adicionar'
            });
        }

        return suggestions;
    }

    /**
     * Find low stock items (< 20% of ideal)
     */
    private findLowStockItems(_stock: any): any[] {
        // TODO: Implement based on actual stock structure
        return [];
    }

    /**
     * Find items expiring soon (< 7 days)
     */
    private findExpiringItems(_stock: any): any[] {
        // TODO: Implement based on actual stock structure
        return [];
    }
}

export const contextEngine = new ContextEngine();
