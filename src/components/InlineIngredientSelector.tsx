import { Trash2, AlertCircle } from 'lucide-react';
import type { Ingredient } from '../lib/supabase';

export interface RecipeIngredientInput {
    tempId: string;
    ingredient_id: string;
    ingredient_name: string;
    quantity_needed: number;
    unit: string;
    current_stock: number;
}

interface InlineIngredientSelectorProps {
    ingredients: Ingredient[];
    selectedIngredients: RecipeIngredientInput[];
    onAdd: (ingredient: RecipeIngredientInput) => void;
    onRemove: (tempId: string) => void;
    onQuantityChange: (tempId: string, quantity: number) => void;
    onQuickCreate: () => void;
}

const InlineIngredientSelector = ({
    ingredients,
    selectedIngredients,
    onAdd,
    onRemove,
    onQuantityChange,
    onQuickCreate,
}: InlineIngredientSelectorProps) => {
    const availableIngredients = ingredients.filter(
        ing => !selectedIngredients.some(si => si.ingredient_id === ing.id)
    );

    const handleAddIngredient = (ingredientId: string) => {
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (!ingredient) return;

        const newIngredient: RecipeIngredientInput = {
            tempId: `temp_${Date.now()}`,
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            quantity_needed: 0,
            unit: ingredient.unit,
            current_stock: ingredient.current_stock || 0,
        };

        onAdd(newIngredient);
    };

    const getStockColor = (ing: RecipeIngredientInput) => {
        if (ing.quantity_needed <= 0) return 'var(--text-muted)';
        const possible = Math.floor(ing.current_stock / ing.quantity_needed);
        if (possible === 0) return 'var(--danger)';
        if (possible <= 10) return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <h4 style={{ margin: 0 }}>🧪 Ingredientes da Receita</h4>
                {selectedIngredients.length > 0 && (
                    <span style={{
                        fontSize: '0.875rem',
                        padding: '2px 8px',
                        background: 'var(--primary)30',
                        color: 'var(--primary)',
                        borderRadius: 'var(--radius-full)',
                    }}>
                        {selectedIngredients.length}
                    </span>
                )}
            </div>

            {/* Lista de ingredientes selecionados */}
            {selectedIngredients.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-md)',
                    background: 'var(--bg-dark)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    {/* Cabeçalho da tabela */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 80px 40px',
                        gap: 'var(--space-md)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        paddingBottom: 'var(--space-xs)',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        <span>Ingrediente</span>
                        <span>Quantidade</span>
                        <span>Unidade</span>
                        <span></span>
                    </div>

                    {/* Linhas de ingredientes */}
                    {selectedIngredients.map((ing) => {
                        const stockColor = getStockColor(ing);
                        const possibleUnits = ing.quantity_needed > 0
                            ? Math.floor(ing.current_stock / ing.quantity_needed)
                            : 0;

                        return (
                            <div
                                key={ing.tempId}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 80px 40px',
                                    gap: 'var(--space-md)',
                                    alignItems: 'center',
                                    padding: 'var(--space-sm)',
                                    background: 'var(--bg-darker)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1px solid ${stockColor}40`,
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 500 }}>{ing.ingredient_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: stockColor, marginTop: '2px' }}>
                                        Estoque: {ing.current_stock} {ing.unit}
                                        {ing.quantity_needed > 0 && ` (${possibleUnits} unidades possíveis)`}
                                    </div>
                                </div>

                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={ing.quantity_needed || ''}
                                    onChange={(e) => onQuantityChange(ing.tempId, parseFloat(e.target.value) || 0)}
                                    style={{
                                        fontSize: '0.875rem',
                                        borderColor: ing.quantity_needed <= 0 ? 'var(--warning)' : undefined
                                    }}
                                />

                                <div style={{
                                    padding: '8px',
                                    background: 'var(--bg-dark)',
                                    borderRadius: 'var(--radius-sm)',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                }}>
                                    {ing.unit}
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => onRemove(ing.tempId)}
                                    style={{ padding: '8px' }}
                                    title="Remover ingrediente"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedIngredients.length === 0 && (
                <div style={{
                    padding: 'var(--space-lg)',
                    background: 'var(--bg-dark)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border)',
                    textAlign: 'center',
                }}>
                    <AlertCircle size={32} color="var(--text-muted)" style={{ margin: '0 auto var(--space-sm)' }} />
                    <p className="text-muted" style={{ margin: 0 }}>
                        Nenhum ingrediente adicionado ainda
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                        Adicione ingredientes para calcular a capacidade
                    </p>
                </div>
            )}

            {/* Adicionar novo ingrediente */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <select
                    className="select"
                    value=""
                    onChange={(e) => {
                        if (e.target.value === 'create_new') {
                            onQuickCreate();
                        } else if (e.target.value) {
                            handleAddIngredient(e.target.value);
                        }
                    }}
                    style={{ flex: 1 }}
                >
                    <option value="">Selecione um ingrediente...</option>
                    <option value="create_new" style={{
                        fontWeight: 'bold',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--primary)20'
                    }}>
                        ➕ Criar Novo Ingrediente
                    </option>
                    <option disabled>────────────────</option>
                    {availableIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                            {ing.name} - {ing.current_stock || 0} {ing.unit}  disponível
                        </option>
                    ))}
                </select>
            </div>

            {availableIngredients.length === 0 && selectedIngredients.length > 0 && (
                <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', margin: 0 }}>
                    Todos os ingredientes disponíveis foram adicionados
                </p>
            )}
        </div>
    );
};

export default InlineIngredientSelector;
