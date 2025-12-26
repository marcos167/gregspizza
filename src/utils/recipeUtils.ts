/**
 * Recipe Utility Functions
 * Handles capacity calculations, stock status, and ingredient validations
 */

import type { RecipeIngredient, Ingredient } from '../lib/supabase';

export interface RecipeIngredientWithDetails extends RecipeIngredient {
    ingredient?: Ingredient;
}

export interface RecipeCapacity {
    capacity: number;
    limitingIngredient: string | null;
    limitingIngredientId: string | null;
}

export type StockStatus = 'critical' | 'danger' | 'warning' | 'ok';

/**
 * Calculate how many units of a recipe can be produced based on current stock
 * @param recipeIngredients - Array of ingredients with their required quantities
 * @returns Capacity and limiting ingredient information
 */
export const calculateRecipeCapacity = (
    recipeIngredients: RecipeIngredientWithDetails[]
): RecipeCapacity => {
    if (!recipeIngredients || recipeIngredients.length === 0) {
        return { capacity: 0, limitingIngredient: null, limitingIngredientId: null };
    }

    let minCapacity = Infinity;
    let limitingIngredient: string | null = null;
    let limitingIngredientId: string | null = null;

    recipeIngredients.forEach((ri) => {
        const currentStock = ri.ingredient?.current_stock || 0;
        const quantityNeeded = ri.quantity_needed;

        if (quantityNeeded === 0) return;

        const possibleUnits = Math.floor(currentStock / quantityNeeded);

        if (possibleUnits < minCapacity) {
            minCapacity = possibleUnits;
            limitingIngredient = ri.ingredient?.name || null;
            limitingIngredientId = ri.ingredient?.id || null;
        }
    });

    return {
        capacity: minCapacity === Infinity ? 0 : minCapacity,
        limitingIngredient,
        limitingIngredientId,
    };
};

/**
 * Determine stock status based on current and minimum stock levels
 * @param currentStock - Current stock quantity
 * @param minStock - Minimum stock threshold
 * @returns Status indicator
 */
export const getStockStatus = (
    currentStock: number,
    minStock: number
): StockStatus => {
    if (currentStock <= 0) return 'critical';
    if (currentStock <= minStock * 0.5) return 'danger';
    if (currentStock <= minStock) return 'warning';
    return 'ok';
};

/**
 * Get color for stock status
 * @param status - Stock status indicator
 * @returns CSS color value
 */
export const getStatusColor = (status: StockStatus): string => {
    const colors = {
        critical: '#ef4444', // Red
        danger: '#f97316',   // Orange
        warning: '#eab308',  // Yellow
        ok: '#22c55e',       // Green
    };
    return colors[status];
};

/**
 * Get icon emoji for stock status
 * @param status - Stock status indicator
 * @returns Emoji string
 */
export const getStatusIcon = (status: StockStatus): string => {
    const icons = {
        critical: '🔴',
        danger: '🟠',
        warning: '🟡',
        ok: '🟢',
    };
    return icons[status];
};

/**
 * Calculate stock percentage
 * @param currentStock - Current stock quantity
 * @param minStock - Minimum stock threshold
 * @returns Percentage (0-100+)
 */
export const getStockPercentage = (
    currentStock: number,
    minStock: number
): number => {
    if (minStock === 0) return 100;
    return Math.round((currentStock / minStock) * 100);
};

/**
 * Validate if there's enough stock to fulfill a sale
 * @param recipeIngredients - Recipe ingredients with stock info
 * @param quantity - Number of units to produce
 * @returns Validation result with details
 */
export const validateStockForSale = (
    recipeIngredients: RecipeIngredientWithDetails[],
    quantity: number
): { valid: boolean; insufficientIngredient?: string; message?: string } => {
    if (!recipeIngredients || recipeIngredients.length === 0) {
        return {
            valid: false,
            message: 'Receita não possui ingredientes cadastrados',
        };
    }

    for (const ri of recipeIngredients) {
        const required = ri.quantity_needed * quantity;
        const available = ri.ingredient?.current_stock || 0;

        if (available < required) {
            return {
                valid: false,
                insufficientIngredient: ri.ingredient?.name,
                message: `Estoque insuficiente de ${ri.ingredient?.name} (disponível: ${available} ${ri.ingredient?.unit}, necessário: ${required} ${ri.ingredient?.unit})`,
            };
        }
    }

    return { valid: true };
};

/**
 * Format unit display
 * @param unit - Unit type
 * @returns Formatted unit string
 */
export const formatUnit = (unit: string): string => {
    const unitMap: { [key: string]: string } = {
        kg: 'kg',
        gramas: 'g',
        litros: 'L',
        ml: 'ml',
        unidades: 'un',
    };
    return unitMap[unit] || unit;
};

/**
 * Get category icon
 * @param category - Ingredient category
 * @returns Emoji icon
 */
export const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
        massa: '🍞',
        queijo: '🧀',
        carnes: '🥩',
        vegetais: '🥬',
        molhos: '🍅',
        temperos: '🧂',
    };
    return icons[category.toLowerCase()] || '📦';
};
