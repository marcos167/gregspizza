import { useState } from 'react';
import { Sparkles, X, TrendingUp, Loader } from 'lucide-react';
import { generateInventoryInsights } from '../services/ai';
import { supabase } from '../lib/supabase';

const AIFloatingWidget = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [latestInsights, setLatestInsights] = useState<any[]>([]);

    const loadLatestInsights = async () => {
        const { data } = await supabase
            .from('ai_insights')
            .select('*')
            .eq('dismissed', false)
            .order('created_at', { ascending: false })
            .limit(3);

        if (data) setLatestInsights(data);
    };

    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        try {
            const { data: ingredients } = await supabase.from('ingredients').select('*');
            const { data: sales } = await supabase
                .from('stock_exits')
                .select('*')
                .order('sale_date', { ascending: false })
                .limit(50);
            const { data: recipes } = await supabase.from('recipes').select('*');

            const insights = await generateInventoryInsights({
                ingredients: ingredients || [],
                sales: sales || [],
                recipes: recipes || []
            });

            for (const insight of insights) {
                await supabase.from('ai_insights').insert({
                    title: insight.title,
                    description: insight.description,
                    insight_type: insight.category,
                    priority: insight.priority,
                    dismissed: false
                });
            }

            await loadLatestInsights();
            alert('✨ Novos insights gerados com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
            alert('Erro ao gerar insights. Verifique a configuração da API.');
        }
        setIsGenerating(false);
    };

    const handleToggle = async () => {
        if (!isExpanded) {
            await loadLatestInsights();
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            {/* Floating Button */}
            {!isExpanded && (
                <button
                    onClick={handleToggle}
                    className="animate-scale-in"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        border: '2px solid rgba(255, 20, 147, 0.3)',
                        boxShadow: 'var(--shadow-glow)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        transition: 'all var(--transition-base)',
                        animation: 'glow 2s ease-in-out infinite'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <Sparkles size={28} color="white" />
                </button>
            )}

            {/* Expanded Card */}
            {isExpanded && (
                <div
                    className="card animate-slide-up"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '400px',
                        maxWidth: 'calc(100vw - 4rem)',
                        zIndex: 1000,
                        maxHeight: '600px',
                        overflow: 'auto'
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                        <div className="flex items-center gap-md">
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--gradient-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Sparkles size={20} color="white" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.125rem' }}>Assistente IA</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Insights inteligentes
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggle}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 'var(--space-sm)',
                                borderRadius: 'var(--radius-md)',
                                transition: 'background var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <X size={20} color="var(--text-muted)" />
                        </button>
                    </div>

                    {/* Latest Insights */}
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <h5 style={{ fontSize: '0.875rem', marginBottom: 'var(--space-md)', color: 'var(--text-muted)' }}>
                            Últimos Insights
                        </h5>
                        {latestInsights.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                {latestInsights.map((insight) => (
                                    <div
                                        key={insight.id}
                                        style={{
                                            padding: 'var(--space-sm)',
                                            borderRadius: 'var(--radius-md)',
                                            background:
                                                insight.priority === 'high'
                                                    ? 'rgba(230, 57, 70, 0.1)'
                                                    : insight.priority === 'medium'
                                                        ? 'rgba(255, 183, 3, 0.1)'
                                                        : 'rgba(6, 214, 160, 0.1)',
                                            border: `1px solid ${insight.priority === 'high'
                                                ? 'var(--danger)'
                                                : insight.priority === 'medium'
                                                    ? 'var(--warning)'
                                                    : 'var(--success)'
                                                }40`
                                        }}
                                    >
                                        <div className="flex items-center gap-sm" style={{ marginBottom: '4px' }}>
                                            <TrendingUp
                                                size={14}
                                                color={
                                                    insight.priority === 'high'
                                                        ? 'var(--danger)'
                                                        : insight.priority === 'medium'
                                                            ? 'var(--warning)'
                                                            : 'var(--success)'
                                                }
                                            />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{insight.title}</span>
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                                            {insight.description.substring(0, 80)}
                                            {insight.description.length > 80 && '...'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                                Nenhum insight disponível ainda
                            </p>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateInsights}
                        disabled={isGenerating}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        {isGenerating ? (
                            <>
                                <Loader size={16} className="animate-pulse" />
                                Gerando Insights...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Gerar Novos Insights
                            </>
                        )}
                    </button>
                </div>
            )}
        </>
    );
};

export default AIFloatingWidget;
