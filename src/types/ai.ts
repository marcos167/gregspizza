// AI Service Types
export interface Intent {
    action: 'create' | 'edit' | 'delete' | 'restore' | 'import' | 'export' | 'query' | 'list';
    entity: 'recipe' | 'ingredient' | 'category' | 'stock' | 'sale' | 'trash';
    params: Record<string, any>;
    confidence: number;
    rawCommand?: string;
}

export interface Command {
    id: string;
    intent: Intent;
    needsConfirmation: boolean;
    confirmationMessage?: string;
    validated: boolean;
    validationErrors?: string[];
}

export interface SystemContext {
    stock: {
        total_ingredients: number;
        low_stock_count: number;
        out_of_stock_count: number;
        critical_items: Array<{ name: string; stock: number; unit: string }>;
    };
    recipes: {
        total: number;
        with_ingredients: number;
        without_stock: number;
        recent: Array<{ id: string; name: string; type: string }>;
    };
    recent_activity: Array<{
        action_type: string;
        entity_type: string;
        entity_name: string;
        created_at: string;
    }>;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

export interface AIResponse {
    message: string;
    intent?: Intent;
    command?: Command;
    actions?: Array<{
        label: string;
        command: string;
        type: 'primary' | 'secondary' | 'danger';
    }>;
    data?: any;
}
