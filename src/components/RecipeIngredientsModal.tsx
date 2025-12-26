import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { supabase, type Recipe, type Ingredient, type RecipeIngredientWithDetails } from '../lib/supabase';
import { calculateRecipeCapacity, formatUnit, getCategoryIcon } from '../utils/recipeUtils';

interface RecipeIngredientsModalProps {
    recipe: Recipe;
    onClose: () => void;
    onUpdate?: () => void;
}

const RecipeIngredientsModal = ({ recipe, onClose, onUpdate }: RecipeIngredientsModalProps) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state for adding new ingredient
    const [selectedIngredientId, setSelectedIngredientId] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        loadData();
    }, [recipe.id]);

    const loadData = async () => {
        setLoading(true);

        // Load all ingredients
        const { data: ingredientsData } = await supabase
            .from('ingredients')
            .select('*')
            .order('name');

        if (ingredientsData) setIngredients(ingredientsData);

        // Load recipe ingredients
        const { data: recipeIngrData } = await supabase
            .from('recipe_ingredients')
            .select(`
                id,
                recipe_id,
                ingredient_id,
                quantity_needed,
                ingredient:ingredients(*)
            `)
            .eq('recipe_id', recipe.id);

        if (recipeIngrData) {
            setRecipeIngredients(recipeIngrData as any as RecipeIngredientWithDetails[]);
        }

        setLoading(false);
    };

    const handleAddIngredient = async () => {
        if (!selectedIngredientId || !quantity) {
            alert('Por favor, selecione um ingrediente e informe a quantidade');
            return;
        }

        // Check if ingredient already exists in recipe
        if (recipeIngredients.some(ri => ri.ingredient_id === selectedIngredientId)) {
            alert('Este ingrediente já está vinculado a esta receita');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('recipe_ingredients')
                .insert({
                    recipe_id: recipe.id,
                    ingredient_id: selectedIngredientId,
                    quantity_needed: parseFloat(quantity),
                })
                .select(`
                    id,
                    recipe_id,
                    ingredient_id,
                    quantity_needed,
                    ingredient:ingredients(*)
                `)
                .single();

            if (error) throw error;

            if (data) {
                setRecipeIngredients([...recipeIngredients, data as any as RecipeIngredientWithDetails]);
                setSelectedIngredientId('');
                setQuantity('');
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Error adding ingredient:', error);
            alert('Erro ao adicionar ingrediente');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveIngredient = async (id: string) => {
        if (!confirm('Remover este ingrediente da receita?')) return;

        try {
            const { error } = await supabase
                .from('recipe_ingredients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setRecipeIngredients(recipeIngredients.filter(ri => ri.id !== id));
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error removing ingredient:', error);
            alert('Erro ao remover ingrediente');
        }
    };

    // Calculate capacity
    const capacityInfo = calculateRecipeCapacity(recipeIngredients);

    // Get available ingredients (not already in recipe)
    const availableIngredients = ingredients.filter(
        ing => !recipeIngredients.some(ri => ri.ingredient_id === ing.id)
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-lg)',
        }} onClick={onClose}>
            <div className="card" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-lg)',
                }}>
                    <div>
                        <h3 style={{ margin: 0 }}>Ingredientes - {recipe.name}</h3>
                        <p className="text-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                            {recipe.type === 'pizza' ? '🍕 Pizza' : '🥟 Esfiha'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-dark)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={20} color="var(--text-muted)" />
                    </button>
                </div>

                {loading ? (
                    <div className="skeleton" style={{ height: '200px' }}></div>
                ) : (
                    <>
                        {/* Add Ingredient Form */}
                        <div style={{
                            padding: 'var(--space-lg)',
                            background: 'var(--bg-dark)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                        }}>
                            <h4 style={{ marginBottom: 'var(--space-md)' }}>Adicionar Ingrediente</h4>

                            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                                <label>Ingrediente</label>
                                <select
                                    className="select"
                                    value={selectedIngredientId}
                                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                                >
                                    <option value="">Selecione um ingrediente...</option>
                                    {availableIngredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>
                                            {getCategoryIcon(ing.category || '')} {ing.name} ({ing.current_stock || 0} {formatUnit(ing.unit)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label>Quantidade por unidade</label>
                                    <input
                                        className="input"
                                        type="number"
                                        step="0.01"
                                        placeholder="120"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>
                                {selectedIngredientId && (
                                    <div className="form-group">
                                        <label>Unidade</label>
                                        <input
                                            className="input"
                                            type="text"
                                            value={formatUnit(ingredients.find(i => i.id === selectedIngredientId)?.unit || '')}
                                            disabled
                                            style={{ opacity: 0.7 }}
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleAddIngredient}
                                disabled={saving || !selectedIngredientId || !quantity}
                                style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                            >
                                <Plus size={18} />
                                {saving ? 'Adicionando...' : 'Adicionar'}
                            </button>
                        </div>

                        {/* Ingredients List */}
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <h4 style={{ marginBottom: 'var(--space-md)' }}>
                                Ingredientes Vinculados ({recipeIngredients.length})
                            </h4>

                            {recipeIngredients.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: 'var(--space-xl)',
                                    background: 'var(--bg-dark)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <p className="text-muted">Nenhum ingrediente vinculado</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {recipeIngredients.map(ri => (
                                        <div key={ri.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--space-md)',
                                            background: 'var(--bg-dark)',
                                            borderRadius: 'var(--radius-md)',
                                            border: ri.ingredient?.id === capacityInfo.limitingIngredientId
                                                ? '2px solid var(--warning)'
                                                : '1px solid transparent',
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                    <span>{getCategoryIcon(ri.ingredient?.category || '')}</span>
                                                    <span style={{ fontWeight: 500 }}>{ri.ingredient?.name}</span>
                                                    {ri.ingredient?.id === capacityInfo.limitingIngredientId && (
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            padding: '2px 8px',
                                                            background: 'var(--warning)',
                                                            color: 'var(--bg-dark)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontWeight: 'bold',
                                                        }}>LIMITANTE</span>
                                                    )}
                                                </div>
                                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                                                    {ri.quantity_needed} {formatUnit(ri.ingredient?.unit || '')} por unidade
                                                    <span style={{ marginLeft: 'var(--space-sm)', opacity: 0.7 }}>
                                                        • Estoque: {ri.ingredient?.current_stock || 0} {formatUnit(ri.ingredient?.unit || '')}
                                                    </span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveIngredient(ri.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 'var(--space-sm)',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}
                                            >
                                                <Trash2 size={18} color="var(--danger)" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Capacity Card */}
                        {recipeIngredients.length > 0 && (
                            <div style={{
                                padding: 'var(--space-lg)',
                                background: 'linear-gradient(135deg, var(--primary)20, var(--success)20)',
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--primary)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
                                    <Calculator size={24} color="var(--primary)" />
                                    <h4 style={{ margin: 0 }}>Capacidade Estimada</h4>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)' }}>
                                    <h2 style={{ color: 'var(--success)', margin: 0, fontSize: '2.5rem' }}>
                                        {capacityInfo.capacity}
                                    </h2>
                                    <span className="text-muted">unidades</span>
                                </div>
                                {capacityInfo.limitingIngredient && (
                                    <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>
                                        Limitado por: <strong>{capacityInfo.limitingIngredient}</strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RecipeIngredientsModal;
