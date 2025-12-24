import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
