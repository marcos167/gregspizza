import { useState, useEffect } from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { supabase, type RecipeWithIngredients } from '../lib/supabase';
import { calculateRecipeCapacity, validateStockForSale } from '../utils/recipeUtils';

const SalesEntry = () => {
    const [formData, setFormData] = useState({
        product_type: 'pizza' as 'pizza' | 'esfiha',
        product_name: '',
        quantity: '',
        revenue: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);

    useEffect(() => {
        loadRecipes();
    }, [formData.product_type]);

    useEffect(() => {
        // Find selected recipe when product name changes
        const recipe = recipes.find(r => r.name === formData.product_name);
        setSelectedRecipe(recipe || null);
    }, [formData.product_name, recipes]);

    const loadRecentSales = async () => {
        try {
            /*
            const { data: stockData } = await supabase
                .from('stock_exits')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(10);

            setRecentExits(stockData || []);
            */
            setRecentExits([]); // Placeholder
        } catch (error) {
            console.error('Error loading recent exits:', error);
        }
    };

    const loadRecipes = async () => {
        const { data } = await supabase
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
            .eq('type', formData.product_type);

        if (data) {
            const recipesWithCapacity = data.map(recipe => {
                const capacityInfo = calculateRecipeCapacity(recipe.recipe_ingredients || []);
                return {
                    ...recipe,
                    capacity: capacityInfo.capacity,
                    limiting_ingredient: capacityInfo.limitingIngredient,
                };
            });
            setRecipes(recipesWithCapacity);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate stock before submitting
        if (selectedRecipe) {
            const validation = validateStockForSale(
                selectedRecipe.recipe_ingredients || [],
                parseInt(formData.quantity)
            );

            if (!validation.valid) {
                alert(validation.message || 'Estoque insuficiente');
                return;
            }
        }

        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('stock_exits')
                .insert({
                    product_type: formData.product_type,
                    product_name: formData.product_name,
                    quantity: parseInt(formData.quantity),
                    revenue: parseFloat(formData.revenue),
                });

            if (error) throw error;

            alert('✅ Venda registrada com sucesso! Estoque atualizado.');

            // Reset form and reload recipes to update capacity
            setFormData({
                product_type: formData.product_type,
                product_name: '',
                quantity: '',
                revenue: '',
            });
            loadRecipes();
        } catch (error: any) {
            console.error('Error:', error);
            alert(`❌ ${error.message || 'Erro ao registrar venda'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const capacity = selectedRecipe?.capacity || 0;
    const hasIngredients = selectedRecipe?.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>Registrar Vendas</h1>
                <p className="text-muted">Registre as vendas e o estoque será atualizado automaticamente</p>
            </header>

            <div className="grid grid-2">
                {/* Form */}
                <div className="card">
                    <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                        <ShoppingCart size={24} color="var(--success)" />
                        <h3 style={{ margin: 0 }}>Nova Venda</h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label>Tipo de Produto</label>
                            <select
                                className="select"
                                value={formData.product_type}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    product_type: e.target.value as 'pizza' | 'esfiha',
                                    product_name: '',
                                })}
                            >
                                <option value="pizza">🍕 Pizza</option>
                                <option value="esfiha">🥟 Esfiha</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Produto</label>
                            <select
                                className="select"
                                value={formData.product_name}
                                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                {recipes.map(recipe => (
                                    <option key={recipe.id} value={recipe.name}>
                                        {recipe.name} {recipe.capacity !== undefined ? `(${recipe.capacity} disponíveis)` : ''}
                                    </option>
                                ))}
                            </select>
                            {selectedRecipe && !hasIngredients && (
                                <small style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <AlertCircle size={14} />
                                    Esta receita não possui ingredientes cadastrados
                                </small>
                            )}
                            {selectedRecipe && hasIngredients && capacity === 0 && (
                                <small style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <AlertCircle size={14} />
                                    Estoque insuficiente para produzir este item
                                </small>
                            )}
                            {selectedRecipe && capacity > 0 && capacity <= 10 && (
                                <small style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <AlertCircle size={14} />
                                    Estoque baixo (apenas {capacity} unidades disponíveis)
                                </small>
                            )}
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    placeholder="5"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Valor Total</label>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    placeholder="R$ 150.00"
                                    value={formData.revenue}
                                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={submitting || (selectedRecipe !== null && capacity === 0)}
                            style={{ marginTop: 'var(--space-md)' }}
                        >
                            <ShoppingCart size={20} />
                            {submitting ? 'Registrando...' : 'Registrar Venda'}
                        </button>
                    </form>
                </div>

                {/* Quick Stats */}
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Vendas do Dia</h4>
                        <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                            <div>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Pizzas</p>
                                <h2 style={{ color: 'var(--primary)', margin: 0 }}>24</h2>
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Esfihas</p>
                                <h2 style={{ color: 'var(--warning)', margin: 0 }}>67</h2>
                            </div>
                        </div>
                    </div>

                    <div className="card card-glass">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Dedução Automática</h4>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                            Ao registrar uma venda, o sistema:
                        </p>
                        <ul style={{
                            marginTop: 'var(--space-md)',
                            paddingLeft: 'var(--space-lg)',
                            fontSize: '0.875rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-sm)',
                        }}>
                            <li>✅ Deduz ingredientes automaticamente</li>
                            <li>✅ Atualiza capacidade de produção</li>
                            <li>✅ Gera alertas se estoque baixo</li>
                            <li>✅ Alimenta a IA com dados</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesEntry;
