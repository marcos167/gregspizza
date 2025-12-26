import { Calculator } from 'lucide-react';
import type { RecipeIngredientInput } from './InlineIngredientSelector';

interface CapacityDisplayProps {
    ingredients: RecipeIngredientInput[];
}

const CapacityDisplay = ({ ingredients }: CapacityDisplayProps) => {
    const calculateCapacity = () => {
        if (ingredients.length === 0) {
            return { capacity: 0, limitingIngredient: null };
        }

        let minCapacity = Infinity;
        let limitingIngredient: string | null = null;

        ingredients.forEach((ing) => {
            if (ing.quantity_needed <= 0) return;

            const possible = Math.floor(ing.current_stock / ing.quantity_needed);

            if (possible < minCapacity) {
                minCapacity = possible;
                limitingIngredient = `${ing.ingredient_name} (${ing.current_stock}${ing.unit} ÷ ${ing.quantity_needed}${ing.unit})`;
            }
        });

        return {
            capacity: minCapacity === Infinity ? 0 : minCapacity,
            limitingIngredient,
        };
    };

    const { capacity, limitingIngredient } = calculateCapacity();

    const getColor = () => {
        if (capacity === 0) return 'var(--danger)';
        if (capacity <= 10) return 'var(--warning)';
        return 'var(--success)';
    };

    const hasValidIngredients = ingredients.length > 0 && ingredients.every(ing => ing.quantity_needed > 0);

    return (
        <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--bg-dark)',
            borderRadius: 'var(--radius-md)',
            border: `2px solid ${hasValidIngredients ? getColor() : 'var(--border)'}`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: `${hasValidIngredients ? getColor() : 'var(--text-muted)'}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Calculator size={24} color={hasValidIngredients ? getColor() : 'var(--text-muted)'} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Capacidade Estimada
                    </h4>
                    <h2 style={{
                        color: hasValidIngredients ? getColor() : 'var(--text-muted)',
                        margin: '4px 0 0 0',
                        fontSize: '1.75rem'
                    }}>
                        {ingredients.length === 0
                            ? '—'
                            : !hasValidIngredients
                                ? '— (defina quantidades)'
                                : `${capacity} unidades`
                        }
                    </h2>
                    {limitingIngredient && hasValidIngredients && (
                        <p className="text-muted" style={{
                            fontSize: '0.75rem',
                            margin: '4px 0 0 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ fontSize: '1rem' }}>⚠️</span>
                            Limitado por: {limitingIngredient}
                        </p>
                    )}
                </div>
            </div>

            {capacity === 0 && ingredients.length > 0 && hasValidIngredients && (
                <div style={{
                    marginTop: 'var(--space-md)',
                    padding: 'var(--space-sm)',
                    background: 'var(--danger)20',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--danger)',
                }}>
                    ⚠️ Estoque insuficiente para produzir ao menos 1 unidade
                </div>
            )}

            {ingredients.length > 0 && !hasValidIngredients && (
                <div style={{
                    marginTop: 'var(--space-md)',
                    padding: 'var(--space-sm)',
                    background: 'var(--warning)20',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--warning)',
                }}>
                    ⚠️ Defina a quantidade necessária de cada ingrediente
                </div>
            )}
        </div>
    );
};

export default CapacityDisplay;
