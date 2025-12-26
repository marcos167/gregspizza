import { useEffect, useState } from 'react';
import { FileText, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { supabase, type WeeklyReport as WeeklyReportType } from '../lib/supabase';

const WeeklyReport = () => {
    const [reports, setReports] = useState<WeeklyReportType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);

        const { data } = await supabase
            .from('weekly_reports')
            .select('*')
            .order('week_start', { ascending: false })
            .limit(4);

        if (data) setReports(data);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const mockAIRecommendations = [
        {
            title: 'Aumente estoque de queijo',
            description: 'Terças-feiras têm 40% mais vendas de pizzas com queijo. Sugiro aumentar estoque em 30% para próxima terça.',
            priority: 'high',
        },
        {
            title: 'Otimize compra de tomates',
            description: 'Você está comprando tomates toda semana, mas poderia economizar 15% comprando quinzenalmente.',
            priority: 'medium',
        },
        {
            title: 'Esfiha de carne em alta',
            description: 'Vendas de esfiha de carne cresceram 25% nos últimos 14 dias. Considere promoção.',
            priority: 'medium',
        },
    ];

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>Relatório Semanal</h1>
                <p className="text-muted">Análise automática com insights e recomendações</p>
            </header>

            {/* AI Recommendations */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'var(--gradient-primary)' }}>
                <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                    <Lightbulb size={28} color="white" />
                    <div>
                        <h3 style={{ margin: 0, color: 'white' }}>Recomendações da IA</h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                            Baseado nos últimos 30 dias de dados
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {mockAIRecommendations.map((rec, index) => (
                        <div
                            key={index}
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(10px)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgba(255,255,255,0.2)',
                            }}
                        >
                            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--space-xs)' }}>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: rec.priority === 'high' ? '#FFF' : 'rgba(255,255,255,0.3)',
                                    color: rec.priority === 'high' ? 'var(--primary)' : 'white',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                }}>
                                    {rec.priority === 'high' ? '⚡ Alta' : '💡 Média'}
                                </span>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>{rec.title}</h4>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.95)' }}>
                                {rec.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Historical Reports */}
            <h3 style={{ marginBottom: 'var(--space-lg)' }}>
                <FileText size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 'var(--space-sm)' }} />
                Histórico de Semanas
            </h3>

            {loading ? (
                <div className="skeleton" style={{ height: '400px' }}></div>
            ) : reports.length > 0 ? (
                <div className="grid grid-2">
                    {reports.map((report) => {
                        const profitMargin = ((report.profit / report.total_revenue) * 100).toFixed(1);
                        const isProfitable = report.profit > 0;

                        return (
                            <div key={report.id} className="card">
                                <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-lg)' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>
                                            {formatDate(report.week_start)} - {formatDate(report.week_end)}
                                        </h4>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                                            Semana {new Date(report.week_start).getWeek()}
                                        </p>
                                    </div>
                                    {isProfitable ? (
                                        <TrendingUp size={24} color="var(--success)" />
                                    ) : (
                                        <TrendingDown size={24} color="var(--danger)" />
                                    )}
                                </div>

                                <div className="grid grid-2" style={{ gap: 'var(--space-lg)' }}>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Receita</p>
                                        <h3 style={{ color: 'var(--success)', margin: '4px 0 0 0' }}>
                                            R$ {report.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                    <div>
                                        <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Custo</p>
                                        <h3 style={{ color: 'var(--danger)', margin: '4px 0 0 0' }}>
                                            R$ {report.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </h3>
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: 'var(--space-lg)',
                                    padding: 'var(--space-md)',
                                    background: isProfitable ? 'rgba(6, 214, 160, 0.1)' : 'rgba(230, 57, 70, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${isProfitable ? 'var(--success)' : 'var(--danger)'}40`,
                                }}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-muted)' }}>
                                                Lucro
                                            </p>
                                            <h3 style={{
                                                margin: '4px 0 0 0',
                                                color: isProfitable ? 'var(--success)' : 'var(--danger)',
                                            }}>
                                                R$ {report.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </h3>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-muted)' }}>
                                                Margem
                                            </p>
                                            <h3 style={{
                                                margin: '4px 0 0 0',
                                                color: isProfitable ? 'var(--success)' : 'var(--danger)',
                                            }}>
                                                {profitMargin}%
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                {report.top_selling_product && (
                                    <div style={{ marginTop: 'var(--space-md)' }}>
                                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                                            🏆 Mais vendido: <strong>{report.top_selling_product}</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <FileText size={64} color="var(--text-muted)" style={{ margin: '0 auto var(--space-lg)' }} />
                    <h3 className="text-muted">Nenhum relatório gerado ainda</h3>
                    <p className="text-muted">Relatórios semanais são gerados automaticamente todo domingo à meia-noite</p>
                </div>
            )}
        </div>
    );
};

// Helper function to get week number
declare global {
    interface Date {
        getWeek(): number;
    }
}

Date.prototype.getWeek = function () {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export default WeeklyReport;
