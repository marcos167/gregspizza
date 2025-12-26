import { useState, useEffect } from 'react';
import { ChefHat, Plus, AlertCircle } from 'lucide-react';
import { supabase, type RecipeWithIngredients, type Ingredient } from '../lib/supabase';
import { calculateRecipeCapacity } from '../utils/recipeUtils';
import RecipeIngredientsModal from '../components/RecipeIngredientsModal';
import InlineIngredientSelector, { type RecipeIngredientInput } from '../components/InlineIngredientSelector';
import QuickIngredientModal from '../components/QuickIngredientModal';
import CapacityDisplay from '../components/CapacityDisplay';

const RecipeManager = () => {
    const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showQuickIngredientModal, setShowQuickIngredientModal] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'pizza' as 'pizza' | 'esfiha',
        ingredients: [] as RecipeIngredientInput[],
    });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Load recipes with ingredients
        const { data: recipesData } = await supabase
            .from('recipes')
            .select(`
                *,
                recipe_ingredients(
                    id,
                    recipe_id,
                    ingredient_id,
                    quantity_needed,
                    ingredient:ingredients(*)
                )
            `)
            .order('name');

        if (recipesData) {
            const recipesWithCapacity = recipesData.map(recipe => {
                const capacityInfo = calculateRecipeCapacity(recipe.recipe_ingredients || []);
                return {
                    ...recipe,
                    capacity: capacityInfo.capacity,
                    limiting_ingredient: capacityInfo.limitingIngredient,
                    limiting_ingredient_id: capacityInfo.limitingIngredientId,
                };
            });
            setRecipes(recipesWithCapacity);
        }

        // Load all ingredients for the selector
        const { data: ingredientsData } = await supabase
            .from('ingredients')
            .select('*')
            .order('name');

        if (ingredientsData) {
            setIngredients(ingredientsData);
        }

        setLoading(false);
    };

    const validateForm = (): boolean => {
        const errors: string[] = [];

        if (!formData.name.trim()) {
            errors.push('Nome da receita é obrigatório');
        }

        if (formData.ingredients.length === 0) {
            errors.push('Adicione pelo menos 1 ingrediente à receita');
        }

        formData.ingredients.forEach((ing) => {
            if (ing.quantity_needed <= 0) {
                errors.push(`Quantidade de "${ing.ingredient_name}" deve ser maior que zero`);
            }
        });

        // Check if can produce at least 1 unit
        const hasValidQuantities = formData.ingredients.every(ing => ing.quantity_needed > 0);
        if (hasValidQuantities && formData.ingredients.length > 0) {
            const capacity = Math.min(...formData.ingredients.map(ing =>
                Math.floor(ing.current_stock / ing.quantity_needed)
            ));

            if (capacity === 0) {
                errors.push('Estoque insuficiente para produzir ao menos 1 unidade desta receita');
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // 1. Create recipe
            const { data: recipe, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    name: formData.name,
                    type: formData.type,
                    serving_size: 1,
                })
                .select()
                .single();

            if (recipeError) throw recipeError;

            // 2. Create recipe-ingredient relationships
            const recipeIngredients = formData.ingredients.map(ing => ({
                recipe_id: recipe.id,
                ingredient_id: ing.ingredient_id,
                quantity_needed: ing.quantity_needed,
            }));

            const { error: ingredientsError } = await supabase
                .from('recipe_ingredients')
                .insert(recipeIngredients);

            if (ingredientsError) throw ingredientsError;

            alert(`✅ Receita "${formData.name}" criada com sucesso!`);
            setShowForm(false);
            setFormData({ name: '', type: 'pizza', ingredients: [] });
            setValidationErrors([]);
            loadData();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Erro ao criar receita');
        }
    };

    const handleAddIngredient = (ingredient: RecipeIngredientInput) => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, ingredient],
        });
        setValidationErrors([]);
    };

    const handleRemoveIngredient = (tempId: string) => {
        setFormData({
            ...formData,
            ingredients: formData.ingredients.filter(ing => ing.tempId !== tempId),
        });
        setValidationErrors([]);
    };

    const handleQuantityChange = (tempId: string, quantity: number) => {
        setFormData({
            ...formData,
            ingredients: formData.ingredients.map(ing =>
                ing.tempId === tempId ? { ...ing, quantity_needed: quantity } : ing
            ),
        });
        setValidationErrors([]);
    };

    const handleQuickIngredientCreated = (newIngredient: { id: string; name: string; unit: string; current_stock: number }) => {
        // Add to ingredients list
        const fullIngredient: Ingredient = {
            id: newIngredient.id,
            name: newIngredient.name,
            unit: newIngredient.unit,
            current_stock: newIngredient.current_stock,
            min_stock: 0,
            category: 'Outros',
            cost_per_unit: 0,
            created_at: new Date().toISOString(),
        };
        setIngredients([...ingredients, fullIngredient]);

        // Auto-add to recipe
        const recipeIng: RecipeIngredientInput = {
            tempId: `temp_${Date.now()}`,
            ingredient_id: newIngredient.id,
            ingredient_name: newIngredient.name,
            quantity_needed: 0,
            unit: newIngredient.unit,
            current_stock: newIngredient.current_stock,
        };
        handleAddIngredient(recipeIng);

        setShowQuickIngredientModal(false);
        alert(`✅ Ingrediente "${newIngredient.name}" criado e adicionado!`);
    };

    const getCapacityColor = (capacity: number) => {
        if (capacity === 0) return 'var(--danger)';
        if (capacity <= 10) return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>Receitas</h1>
                    <p className="text-muted">Gerencie receitas e proporções de ingredientes</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    <Plus size={20} />
                    Nova Receita
                </button>
            </header>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Criar Nova Receita</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        {/* Basic Info */}
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Nome</label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Ex: Pizza Margherita"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo</label>
                                <select
                                    className="select"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'pizza' | 'esfiha' })}
                                >
                                    <option value="pizza">Pizza</option>
                                    <option value="esfiha">Esfiha</option>
                                </select>
                            </div>
                        </div>

                        {/* Separator */}
                        <div style={{ borderTop: '1px solid var(--border)' }}></div>

                        {/* Ingredients Section */}
                        <InlineIngredientSelector
                            ingredients={ingredients}
                            selectedIngredients={formData.ingredients}
                            onAdd={handleAddIngredient}
                            onRemove={handleRemoveIngredient}
                            onQuantityChange={handleQuantityChange}
                            onQuickCreate={() => setShowQuickIngredientModal(true)}
                        />

                        {/* Capacity Display */}
                        {formData.ingredients.length > 0 && (
                            <CapacityDisplay ingredients={formData.ingredients} />
                        )}

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <div style={{
                                padding: 'var(--space-md)',
                                background: 'var(--danger)20',
                                border: '2px solid var(--danger)',
                                borderRadius: 'var(--radius-md)',
                            }}>
                                <h4 style={{ margin: '0 0 var(--space-sm) 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <AlertCircle size={20} />
                                    Corrija os seguintes erros:
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)', color: 'var(--danger)' }}>
                                    {validationErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                Criar Receita
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({ name: '', type: 'pizza', ingredients: [] });
                                    setValidationErrors([]);
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Quick Ingredient Modal */}
            {showQuickIngredientModal && (
                <QuickIngredientModal
                    onClose={() => setShowQuickIngredientModal(false)}
                    onCreated={handleQuickIngredientCreated}
                />
            )}

            {loading ? (
                <div className="skeleton" style={{ height: '400px' }}></div>
            ) : recipes.length > 0 ? (
                <div className="grid grid-3">
                    {recipes.map((recipe) => {
                        const hasIngredients = recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0;
                        const capacity = recipe.capacity || 0;

                        return (
                            <div key={recipe.id} className="card card-glass">
                                <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-md)' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        background: recipe.type === 'pizza' ? 'var(--primary)20' : 'var(--warning)20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {recipe.type === 'pizza' ? '🍕' : '🥟'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{recipe.name}</h4>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                            {recipe.type === 'pizza' ? 'Pizza' : 'Esfiha'}
                                        </p>
                                    </div>
                                </div>

                                {!hasIngredients && (
                                    <div style={{
                                        padding: 'var(--space-sm)',
                                        background: 'var(--warning)20',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--space-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                    }}>
                                        <AlertCircle size={16} color="var(--warning)" />
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                            Sem ingredientes
                                        </p>
                                    </div>
                                )}

                                <div style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--bg-dark)',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: 'var(--space-md)',
                                }}>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                                        Capacidade estimada:
                                    </p>
                                    <h3 style={{ color: getCapacityColor(capacity), margin: '4px 0 0 0' }}>
                                        {hasIngredients ? `${capacity} unidades` : 'Configure ingredientes'}
                                    </h3>
                                    {hasIngredients && recipe.limiting_ingredient && (
                                        <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>
                                            Limitado por: {recipe.limiting_ingredient}
                                        </p>
                                    )}
                                </div>

                                <button
                                    className="btn btn-outline"
                                    style={{ width: '100%', marginTop: 'var(--space-md)' }}
                                    onClick={() => setSelectedRecipe(recipe)}
                                >
                                    <ChefHat size={18} />
                                    Ver Ingredientes
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <ChefHat size={64} color="var(--text-muted)" style={{ margin: '0 auto var(--space-lg)' }} />
                    <h3 className="text-muted">Nenhuma receita cadastrada</h3>
                    <p className="text-muted">Clique em "Nova Receita" para começar</p>
                </div>
            )}

            {selectedRecipe && (
                <RecipeIngredientsModal
                    recipe={selectedRecipe}
                    onClose={() => setSelectedRecipe(null)}
                    onUpdate={loadData}
                />
            )}
        </div>
    );
};

export default RecipeManager;
