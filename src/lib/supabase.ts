import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pcmyscxqkthrilhazfrz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjbXlzY3hxa3RocmlsaGF6ZnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzY2NzMsImV4cCI6MjA0OTg1MjY3M30.qFSrO0KtKvH5WaV_-L8zExGBrK7P4DajuJ6zvdYb9Ng';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Usando credenciais Supabase padrão - configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Persist session in localStorage
        autoRefreshToken: true, // Auto refresh token before it expires
        detectSessionInUrl: true, // Detect session from URL (email confirmation links)
        storage: localStorage, // Use localStorage for persistence
    }
});

// Database Types
export interface Ingredient {
    id: string;
    name: string;
    unit: string;
    min_stock: number;
    category: string;
    cost_per_unit: number;
    current_stock?: number;
    created_at: string;
}

export interface StockEntry {
    id: string;
    ingredient_id: string;
    quantity: number;
    cost: number;
    supplier: string;
    entry_date: string;
    notes?: string;
}

export interface StockExit {
    id: string;
    product_type: 'pizza' | 'esfiha';
    product_name: string;
    quantity: number;
    sale_date: string;
    revenue: number;
}

export interface Recipe {
    id: string;
    name: string;
    type: 'pizza' | 'esfiha';
    serving_size: number;
    created_at: string;
}

export interface RecipeIngredient {
    id: string;
    recipe_id: string;
    ingredient_id: string;
    quantity_needed: number;
}

export interface WeeklyReport {
    id: string;
    week_start: string;
    week_end: string;
    total_revenue: number;
    total_cost: number;
    profit: number;
    top_selling_product: string;
    total_waste: number;
    generated_at: string;
}

export interface AIInsight {
    id: string;
    insight_type: 'suggestion' | 'warning' | 'optimization';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    related_ingredient_id?: string;
    created_at: string;
    dismissed: boolean;
}

// Extended Types for UI
export interface RecipeIngredientWithDetails extends RecipeIngredient {
    ingredient?: Ingredient;
}

export interface RecipeWithIngredients extends Recipe {
    recipe_ingredients?: RecipeIngredientWithDetails[];
    capacity?: number;
    limiting_ingredient?: string;
    limiting_ingredient_id?: string;
}

export interface IngredientWithAlert extends Ingredient {
    status?: 'critical' | 'danger' | 'warning' | 'ok';
    stock_percentage?: number;
    used_in_recipes_count?: number;
}

