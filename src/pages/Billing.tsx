/**
 * Billing Page
 * 
 * Comprehensive billing dashboard for tenant admins to:
 * - View current plan and limits
 * - Monitor usage metrics
 * - View payment history
 * - Upgrade/downgrade plans
 * - Manage payment methods
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { UpgradeModal } from '../components/UpgradeModal';
import { CreditCard, TrendingUp, Calendar, DollarSign, Users, ChefHat, Database, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BillingTransaction {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'failed' | 'pending';
    created_at: string;
    paid_at?: string;
    description?: string;
}

export default function Billing() {
    const { user, tenant, isAdmin } = useAuth();
    const { limits, usage, isLoading: limitsLoading, trialStatus, canAddUser, canAddRecipe } = usePlanLimits(tenant?.id);

    const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (tenant?.id) {
            loadBillingData();
        }
    }, [tenant?.id]);

    const loadBillingData = async () => {
        setLoading(true);

        // Load billing transactions
        const { data: txData } = await supabase
            .from('billing_transactions')
            .select('*')
            .eq('tenant_id', tenant?.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (txData) {
            setTransactions(txData);
        }

        setLoading(false);
    };

    const getUsagePercentage = (used: number, max: number) => {
        if (max === 999999) return 0; // Unlimited
        return Math.min(Math.round((used / max) * 100), 100);
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'var(--danger)';
        if (percentage >= 75) return 'var(--warning)';
        return 'var(--success)';
    };

    const formatCurrency = (amount: number, currency: string = 'BRL') => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
        }).format(amount / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const planPrices: Record<string, number> = {
        starter: 49,
        pro: 99,
        business: 199,
        enterprise: 499,
    };

    const planNames: Record<string, string> = {
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
        enterprise: 'Enterprise',
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <CreditCard size={64} color="var(--danger)" style={{ margin: '0 auto var(--space-lg)' }} />
                <h2>Acesso Negado</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Apenas administradores podem acessar a página de planos e pagamentos.
                </p>
            </div>
        );
    }

    if (loading || limitsLoading) {
        return (
            <div style={{ padding: 'var(--space-2xl)', textAlign: 'center' }}>
                <div className="skeleton" style={{ height: '400px', maxWidth: '1200px', margin: '0 auto' }}></div>
            </div>
        );
    }

    const currentPlan = tenant?.plan || 'starter';
    const usersPercentage = getUsagePercentage(usage?.users || 0, limits?.max_users || 0);
    const recipesPercentage = getUsagePercentage(usage?.recipes || 0, limits?.max_recipes || 0);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <CreditCard size={32} color="var(--primary)" />
                    <div>
                        <h1 style={{ margin: 0 }}>Planos & Pagamentos</h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Gerencie sua assinatura e acompanhe uso
                        </p>
                    </div>
                </div>
            </div>

            {/* Trial Banner */}
            {trialStatus?.is_trial && (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, var(--warning), var(--primary))',
                    marginBottom: 'var(--space-xl)',
                    border: 'none',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <AlertCircle size={24} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>⏰ Trial Ativo</h3>
                            <p style={{ margin: '4px 0 0', opacity: 0.9 }}>
                                Seu trial expira em <strong>{trialStatus.days_remaining} dias</strong> ({trialStatus.hours_remaining}h restantes)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Plan Card */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(155, 81, 224, 0.1), rgba(0, 168, 255, 0.1))',
                border: '2px solid var(--primary)',
                marginBottom: 'var(--space-xl)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Plano Atual</p>
                        <h2 style={{ margin: '8px 0 0', fontSize: '2rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {planNames[currentPlan]} Plan
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            R$ {planPrices[currentPlan]}<span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mês</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="btn btn-primary"
                        style={{ minWidth: '120px' }}
                    >
                        <TrendingUp size={18} />
                        Upgrade
                    </button>
                </div>

                {/* Plan Features */}
                <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <CheckCircle size={18} color="var(--success)" />
                        <span>{limits?.max_users === 999999 ? 'Usuários ilimitados' : `Até ${limits?.max_users} usuários`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <CheckCircle size={18} color="var(--success)" />
                        <span>{limits?.max_recipes === 999999 ? 'Receitas ilimitadas' : `Até ${limits?.max_recipes} receitas`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <CheckCircle size={18} color="var(--success)" />
                        <span>{limits?.max_storage_mb ? `${Math.round(limits.max_storage_mb / 1024)} GB` : '0 GB'} de armazenamento</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <CheckCircle size={18} color="var(--success)" />
                        <span>{limits?.max_ai_actions_daily || 0} ações IA/dia</span>
                    </div>
                </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
                {/* Users Usage */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Usuários</p>
                            <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>
                                {usage?.users || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {limits?.max_users === 999999 ? '∞' : limits?.max_users}</span>
                            </h3>
                        </div>
                        <Users size={32} color={getUsageColor(usersPercentage)} style={{ opacity: 0.5 }} />
                    </div>

                    {/* Progress Bar */}
                    {limits?.max_users !== 999999 && (
                        <div>
                            <div style={{
                                height: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${usersPercentage}%`,
                                    background: getUsageColor(usersPercentage),
                                    transition: 'width 0.3s ease',
                                }}></div>
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {usersPercentage}% usado {!canAddUser() && '• Limite atingido!'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Recipes Usage */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receitas</p>
                            <h3 style={{ margin: '4px 0 0', fontSize: '1.5rem' }}>
                                {usage?.recipes || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {limits?.max_recipes === 999999 ? '∞' : limits?.max_recipes}</span>
                            </h3>
                        </div>
                        <ChefHat size={32} color={getUsageColor(recipesPercentage)} style={{ opacity: 0.5 }} />
                    </div>

                    {/* Progress Bar */}
                    {limits?.max_recipes !== 999999 && (
                        <div>
                            <div style={{
                                height: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${recipesPercentage}%`,
                                    background: getUsageColor(recipesPercentage),
                                    transition: 'width 0.3s ease',
                                }}></div>
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {recipesPercentage}% usado {!canAddRecipe() && '• Limite atingido!'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment History */}
            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: 'var(--space-lg)' }}>
                    <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    Histórico de Pagamentos
                </h3>

                {transactions.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                        Nenhum pagamento registrado ainda
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{formatDate(tx.paid_at || tx.created_at)}</td>
                                        <td>{tx.description || `Pagamento plano ${planNames[currentPlan]}`}</td>
                                        <td style={{ fontWeight: 'bold' }}>{formatCurrency(tx.amount, tx.currency)}</td>
                                        <td>
                                            {tx.status === 'paid' && (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.75rem',
                                                    background: 'var(--success)20',
                                                    color: 'var(--success)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}>
                                                    <CheckCircle size={12} />
                                                    Pago
                                                </span>
                                            )}
                                            {tx.status === 'failed' && (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.75rem',
                                                    background: 'var(--danger)20',
                                                    color: 'var(--danger)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}>
                                                    <XCircle size={12} />
                                                    Falhou
                                                </span>
                                            )}
                                            {tx.status === 'pending' && (
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.75rem',
                                                    background: 'var(--warning)20',
                                                    color: 'var(--warning)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                }}>
                                                    <AlertCircle size={12} />
                                                    Pendente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <UpgradeModal
                    currentPlan={currentPlan}
                    limitType="users"
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgrade={(plan) => {
                        console.log('Upgrade to:', plan);
                        // TODO: Implement upgrade logic
                        setShowUpgradeModal(false);
                    }}
                />
            )}
        </div>
    );
}
