import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Package } from 'lucide-react';
import { supabase, type IngredientWithAlert } from '../lib/supabase';
import { getStatusColor, getStatusIcon, formatUnit } from '../utils/recipeUtils';

const StockAlerts = () => {
    const [alerts, setAlerts] = useState<IngredientWithAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        const { data } = await supabase
            .from('low_stock_ingredients')
            .select('*')
            .in('status', ['critical', 'danger', 'warning'])
            .limit(5);

        if (data) {
            setAlerts(data as IngredientWithAlert[]);
        }

        setLoading(false);
    };

    if (loading) {
        return <div className="skeleton" style={{ height: '200px' }}></div>;
    }

    if (alerts.length === 0) {
        return (
            <div className="card card-glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <Package size={24} color="var(--success)" />
                    <h3 style={{ margin: 0 }}>Alertas de Estoque</h3>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>✅</div>
                    <p className="text-muted">Nenhum alerta no momento!</p>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Todos os ingredientes estão com estoque adequado.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{
            border: `2px solid ${getStatusColor(alerts[0].status || 'ok')}`,
            background: `${getStatusColor(alerts[0].status || 'ok')}10`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <AlertTriangle size={24} color={getStatusColor(alerts[0].status || 'ok')} />
                <h3 style={{ margin: 0 }}>Alertas de Estoque</h3>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.875rem',
                    padding: '4px 12px',
                    background: getStatusColor(alerts[0].status || 'ok'),
                    color: 'white',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'bold',
                }}>
                    {alerts.length}
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {alerts.map((ingredient) => (
                    <div key={ingredient.id} style={{
                        padding: 'var(--space-md)',
                        background: 'var(--bg-dark)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${getStatusColor(ingredient.status || 'ok')}40`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '1.25rem' }}>{getStatusIcon(ingredient.status || 'ok')}</span>
                                <div>
                                    <h4 style={{ margin: 0 }}>{ingredient.name}</h4>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                        {ingredient.category}
                                    </p>
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.875rem',
                                padding: '4px 8px',
                                background: getStatusColor(ingredient.status || 'ok') + '30',
                                color: getStatusColor(ingredient.status || 'ok'),
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 'bold',
                            }}>
                                {ingredient.stock_percentage}%
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-lg)', fontSize: '0.875rem' }}>
                            <div>
                                <span className="text-muted">Atual: </span>
                                <strong style={{ color: getStatusColor(ingredient.status || 'ok') }}>
                                    {ingredient.current_stock || 0} {formatUnit(ingredient.unit)}
                                </strong>
                            </div>
                            <div>
                                <span className="text-muted">Mínimo: </span>
                                <strong>{ingredient.min_stock} {formatUnit(ingredient.unit)}</strong>
                            </div>
                        </div>

                        {ingredient.used_in_recipes_count && ingredient.used_in_recipes_count > 0 && (
                            <div style={{ marginTop: 'var(--space-sm)' }}>
                                <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                    ⚠️ Afeta {ingredient.used_in_recipes_count} receita
                                    {ingredient.used_in_recipes_count !== 1 ? 's' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                className="btn btn-outline"
                style={{ width: '100%', marginTop: 'var(--space-md)' }}
                onClick={() => window.location.href = '#/ingredients'}
            >
                <TrendingDown size={18} />
                Ver Todos os Ingredientes
            </button>
        </div>
    );
};

export default StockAlerts;
