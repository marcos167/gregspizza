import { useState, useEffect } from 'react';
import { ChefHat, Plus } from 'lucide-react';
import { supabase, type Recipe, type Ingredient } from '../lib/supabase';

const RecipeManager = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'pizza' as 'pizza' | 'esfiha',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        const { data: recipesData } = await supabase
            .from('recipes')
            .select('*')
            .order('name');

        const { data: ingredientsData } = await supabase
            .from('ingredients')
            .select('*')
            .order('name');

        if (recipesData) setRecipes(recipesData);
        if (ingredientsData) setIngredients(ingredientsData);

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await supabase
                .from('recipes')
                .insert({
                    name: formData.name,
                    type: formData.type,
                    serving_size: 1,
                });

            alert('✅ Receita criada!');
            setShowForm(false);
            setFormData({ name: '', type: 'pizza' });
            loadData();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Erro ao criar receita');
        }
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
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-primary">Criar Receita</button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setShowForm(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="skeleton" style={{ height: '400px' }}></div>
            ) : recipes.length > 0 ? (
                <div className="grid grid-3">
                    {recipes.map((recipe) => (
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
                                <div>
                                    <h4 style={{ margin: 0 }}>{recipe.name}</h4>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                        {recipe.type === 'pizza' ? 'Pizza' : 'Esfiha'}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--space-md)',
                                background: 'var(--bg-dark)',
                                borderRadius: 'var(--radius-md)',
                                marginTop: 'var(--space-md)',
                            }}>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                                    Capacidade estimada:
                                </p>
                                <h3 style={{ color: 'var(--success)', margin: '4px 0 0 0' }}>
                                    {Math.floor(Math.random() * 50 + 20)} unidades
                                </h3>
                            </div>

                            <button
                                className="btn btn-outline"
                                style={{ width: '100%', marginTop: 'var(--space-md)' }}
                            >
                                <ChefHat size={18} />
                                Ver Ingredientes
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <ChefHat size={64} color="var(--text-muted)" style={{ margin: '0 auto var(--space-lg)' }} />
                    <h3 className="text-muted">Nenhuma receita cadastrada</h3>
                    <p className="text-muted">Clique em "Nova Receita" para começar</p>
                </div>
            )}
        </div>
    );
};

export default RecipeManager;
