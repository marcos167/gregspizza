import { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';
import { supabase, type IngredientWithAlert } from '../lib/supabase';
import { getStatusColor, getStatusIcon, getStockPercentage, formatUnit, getCategoryIcon } from '../utils/recipeUtils';

const Ingredients = () => {
    const [ingredients, setIngredients] = useState<IngredientWithAlert[]>([]);
    const [filteredIngredients, setFilteredIngredients] = useState<IngredientWithAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', 'massa', 'queijo', 'carnes', 'vegetais', 'molhos', 'temperos'];

    useEffect(() => {
        loadIngredients();
    }, []);

    useEffect(() => {
        filterIngredients();
    }, [ingredients, searchTerm, selectedCategory]);

    const loadIngredients = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('low_stock_ingredients')
            .select('*');

        if (error) {
            console.error('Error loading ingredients:', error);
        } else if (data) {
            setIngredients(data as IngredientWithAlert[]);
        }

        setLoading(false);
    };

    const filterIngredients = () => {
        let filtered = [...ingredients];

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(ing => ing.category === selectedCategory);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(ing =>
                ing.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredIngredients(filtered);
    };

    const getProgressBarColor = (status: string) => {
        return getStatusColor(status as any);
    };

    // Stats
    const criticalCount = ingredients.filter(i => i.status === 'critical').length;
    const dangerCount = ingredients.filter(i => i.status === 'danger').length;
    const warningCount = ingredients.filter(i => i.status === 'warning').length;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <h1 style={{ marginBottom: 'var(--space-sm)' }}>Ingredientes</h1>
                        <p className="text-muted">Gerencie o estoque de ingredientes</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.href = '#/stock-entry'}
                    >
                        <Plus size={20} />
                        Adicionar Estoque
                    </button>
                </div>

                {/* Alert Stats */}
                <div className="grid grid-3">
                    <div className="card" style={{ background: criticalCount > 0 ? 'var(--danger)20' : 'var(--bg-dark)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{ fontSize: '2rem' }}>🔴</div>
                            <div>
                                <h3 style={{ color: 'var(--danger)', margin: 0 }}>{criticalCount}</h3>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Críticos</p>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ background: dangerCount > 0 ? 'var(--warning)20' : 'var(--bg-dark)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{ fontSize: '2rem' }}>🟠</div>
                            <div>
                                <h3 style={{ color: 'var(--warning)', margin: 0 }}>{dangerCount}</h3>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Perigo</p>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ background: warningCount > 0 ? '#eab30820' : 'var(--bg-dark)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{ fontSize: '2rem' }}>🟡</div>
                            <div>
                                <h3 style={{ color: '#eab308', margin: 0 }}>{warningCount}</h3>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Aviso</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="grid grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Buscar</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                className="input"
                                type="text"
                                placeholder="Nome do ingrediente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Categoria</label>
                        <div style={{ position: 'relative' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                className="select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'Todas' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ingredients Grid */}
            {loading ? (
                <div className="skeleton" style={{ height: '400px' }}></div>
            ) : filteredIngredients.length > 0 ? (
                <div className="grid grid-3">
                    {filteredIngredients.map((ingredient) => {
                        const status = ingredient.status || 'ok';
                        const percentage = getStockPercentage(ingredient.current_stock || 0, ingredient.min_stock);
                        const progressPercentage = Math.min((ingredient.current_stock || 0) / (ingredient.min_stock * 2) * 100, 100);

                        return (
                            <div key={ingredient.id} className="card card-glass" style={{
                                border: status !== 'ok' ? `2px solid ${getStatusColor(status)}` : undefined,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-md)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <div style={{ fontSize: '1.5rem' }}>
                                            {getCategoryIcon(ingredient.category || '')}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{ingredient.name}</h4>
                                            <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                                {ingredient.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.25rem' }}>
                                        {getStatusIcon(status)}
                                    </div>
                                </div>

                                {/* Stock Info */}
                                <div style={{
                                    padding: 'var(--space-md)',
                                    background: 'var(--bg-dark)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-md)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>Estoque Atual</span>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {ingredient.current_stock || 0} {formatUnit(ingredient.unit)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                        <span className="text-muted" style={{ fontSize: '0.875rem' }}>Estoque Mínimo</span>
                                        <span>{ingredient.min_stock} {formatUnit(ingredient.unit)}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'var(--bg)',
                                        borderRadius: 'var(--radius-sm)',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${progressPercentage}%`,
                                            height: '100%',
                                            background: getProgressBarColor(status),
                                            transition: 'width 0.3s ease',
                                        }}></div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                            Usado em {ingredient.used_in_recipes_count || 0} receita
                                            {(ingredient.used_in_recipes_count || 0) !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '4px 8px',
                                            background: getStatusColor(status) + '30',
                                            color: getStatusColor(status),
                                            borderRadius: 'var(--radius-sm)',
                                            fontWeight: 'bold',
                                        }}>
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <Package size={64} color="var(--text-muted)" style={{ margin: '0 auto var(--space-lg)' }} />
                    <h3 className="text-muted">Nenhum ingrediente encontrado</h3>
                    <p className="text-muted">
                        {searchTerm || selectedCategory !== 'all'
                            ? 'Tente ajustar os filtros'
                            : 'Adicione ingredientes através da Entrada de Estoque'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Ingredients;
