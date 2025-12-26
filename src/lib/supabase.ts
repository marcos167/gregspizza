import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ============================================
// CRITICAL SECURITY: Two Separate Clients
// ============================================
//
// 1. supabase (tenant client):
//    - Uses anon key
//    - Subject to RLS policies
//    - Filters by tenant_id automatically
//    - Used by ALL tenant-level operations
//
// 2. supabaseAdmin (platform client):
//    - Uses service role key (bypasses RLS)
//    - ONLY for platform admin operations
//    - NEVER used within tenant context
//    - Access controlled by SUPER_ADMIN role
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
}

// ============================================
// TENANT CLIENT (Default)
// ============================================
// Use this for ALL tenant-scoped operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Persist session in localStorage
        autoRefreshToken: true, // Auto refresh token before it expires
        detectSessionInUrl: true, // Detect session from URL (email confirmation links)
        storage: localStorage, // Use localStorage for persistence
    },
});

// ============================================
// PLATFORM ADMIN CLIENT (Service Role)
// ============================================
// ⚠️ WARNING: Bypasses ALL RLS policies!
// ONLY use in:
// - PlatformAdmin.tsx
// - CreateTenantModal.tsx
// - Platform-level operations
//
// NEVER use for:
// - Tenant data queries
// - User-facing operations
// - Any operation within tenant context
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

export const supabaseAdmin = supabaseServiceKey
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
    : null;

// Validate admin client availability for platform operations
export const validateAdminClient = () => {
    if (!supabaseAdmin) {
        throw new Error(
            'SECURITY ERROR: supabaseAdmin not configured. Set VITE_SUPABASE_SERVICE_KEY in environment.'
        );
    }
    return supabaseAdmin;
};

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

