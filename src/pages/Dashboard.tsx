import { useEffect, useState } from 'react';
import { TrendingUp, Package, Pizza, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import { supabase, type Ingredient, type AIInsight } from '../lib/supabase';
import { generateInventoryInsights } from '../services/ai';
import StockAlerts from '../components/StockAlerts';

interface KPI {
    label: string;
    value: string;
    change?: string;
    icon: any;
    color: string;
}

const Dashboard = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [insights, setInsights] = useState<AIInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingAI, setGeneratingAI] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Load ingredients
        const { data: ingredientsData } = await supabase
            .from('ingredients')
            .select('*');

        if (ingredientsData) setIngredients(ingredientsData);

        // Load AI insights from database
        const { data: insightsData } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('dismissed', false)
            .order('created_at', { ascending: false })
            .limit(5);

        if (insightsData) setInsights(insightsData);
        setLoading(false);
    };

    // Generate AI insights in real-time
    const generateAIInsights = async () => {
        setGeneratingAI(true);
        try {
            // Fetch necessary data
            const { data: sales } = await supabase
                .from('stock_exits')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

            const { data: recipes } = await supabase
                .from('recipes')
                .select('*');

            // Generate insights using OpenAI
            const generatedInsights = await generateInventoryInsights({
                ingredients: ingredients,
                sales: sales || [],
                recipes: recipes || []
            });

            // Save insights to database
            for (const insight of generatedInsights) {
                await supabase.from('ai_insights').insert({
                    title: insight.title,
                    description: insight.description,
                    insight_type: insight.category,
                    priority: insight.priority,
                    dismissed: false
                });
            }

            // Reload insights
            loadData();
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
            alert('Erro ao gerar insights com IA. Verifique a chave da API.');
        }
        setGeneratingAI(false);
    };

    // Calculate KPIs
    const totalStockValue = ingredients.reduce((sum, ing) => {
        const stock = ing.current_stock || 0;
        return sum + (stock * ing.cost_per_unit);
    }, 0);

    const lowStockItems = ingredients.filter(ing =>
        (ing.current_stock || 0) < ing.min_stock
    ).length;

    const kpis: KPI[] = [
        {
            label: 'Valor Total em Estoque',
            value: `R$ ${totalStockValue.toFixed(2)}`,
            change: '+12%',
            icon: TrendingUp,
            color: 'var(--success)',
        },
        {
            label: 'Pizzas Possíveis',
            value: '245',
            change: '+8%',
            icon: Pizza,
            color: 'var(--primary)',
        },
        {
            label: 'Esfihas Possíveis',
            value: '380',
            change: '+15%',
            icon: Package,
            color: 'var(--warning)',
        },
        {
            label: 'Alertas de Estoque',
            value: lowStockItems.toString(),
            icon: AlertTriangle,
            color: 'var(--danger)',
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>Dashboard</h1>
                <p className="text-muted">Visão geral do estoque e produção em tempo real</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
                {kpis.map((kpi, index) => {
                    const Icon = kpi.icon;
                    return (
                        <div
                            key={index}
                            className="card card-glass"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${kpi.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Icon size={24} color={kpi.color} />
                                </div>
                                {kpi.change && (
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--success)',
                                        fontWeight: 600,
                                    }}>
                                        {kpi.change}
                                    </span>
                                )}
                            </div>
                            <h3 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>
                                {kpi.value}
                            </h3>
                            <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                                {kpi.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="grid grid-2">
                {/* Stock Alerts */}
                <StockAlerts />

                {/* AI Insights */}
                <div className="card">
                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="flex items-center gap-md">
                            <Lightbulb size={24} color="var(--warning)" />
                            <h3 style={{ margin: 0 }}>Insights da IA</h3>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={generateAIInsights}
                            disabled={generatingAI || ingredients.length === 0}
                            style={{ fontSize: '0.875rem', padding: 'var(--space-sm) var(--space-md)' }}
                        >
                            <Sparkles size={16} />
                            {generatingAI ? 'Gerando...' : 'Gerar Insights'}
                        </button>
                    </div>
                    {loading ? (
                        <div className="skeleton" style={{ height: '200px' }}></div>
                    ) : insights.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {insights.map((insight) => {
                                const colors = {
                                    high: 'var(--danger)',
                                    medium: 'var(--warning)',
                                    low: 'var(--success)',
                                };
                                const bgColors = {
                                    high: 'rgba(230, 57, 70, 0.1)',
                                    medium: 'rgba(255, 183, 3, 0.1)',
                                    low: 'rgba(6, 214, 160, 0.1)',
                                };

                                return (
                                    <div
                                        key={insight.id}
                                        style={{
                                            padding: 'var(--space-md)',
                                            borderRadius: 'var(--radius-md)',
                                            background: bgColors[insight.priority],
                                            border: `1px solid ${colors[insight.priority]}40`,
                                        }}
                                    >
                                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                                            <span className={`badge badge-${insight.priority === 'high' ? 'danger' : insight.priority === 'medium' ? 'warning' : 'success'}`}>
                                                {insight.insight_type}
                                            </span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                                {insight.title}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                                            {insight.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                            <Lightbulb size={48} style={{ margin: '0 auto var(--space-md)' }} />
                            <p>A IA está analisando seus dados...</p>
                            <p style={{ fontSize: '0.75rem' }}>Insights aparecerão em breve!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
