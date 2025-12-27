/**
 * EstokMax - Public Pricing Page
 * 
 * @author Marco Antonio de Souza - https://marcosouza.dev
 * @copyright © 2025 Marco Antonio de Souza. All rights reserved.
 * @license Proprietary - Unauthorized copying or distribution is prohibited.
 * 
 * This code is the intellectual property of Marco Antonio de Souza.
 * Any attempt to copy, modify, or distribute without explicit permission
 * from the author is strictly forbidden and will be prosecuted.
 * 
 * Public-facing pricing page for marketing and conversion.
 * Shows all available plans with features and pricing.
 */

import { Check, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Plan {
    name: string;
    displayName: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    cta: string;
}

export default function Pricing() {
    const navigate = useNavigate();

    // © Marco Antonio de Souza - Plan definitions
    const plans: Plan[] = [
        {
            name: 'starter',
            displayName: 'Starter',
            price: 49,
            period: 'mês',
            description: 'Perfeito para começar',
            cta: 'Começar Grátis',
            features: [
                '5 usuários',
                '200 receitas',
                '2 GB de armazenamento',
                '100 ações IA/dia',
                'Gestão de estoque',
                'Relatórios básicos',
                'Suporte por email'
            ]
        },
        {
            name: 'pro',
            displayName: 'Pro',
            price: 99,
            period: 'mês',
            description: 'Ideal para times em crescimento',
            cta: 'Começar Grátis',
            highlighted: true,
            features: [
                '15 usuários',
                '1.000 receitas',
                '10 GB de armazenamento',
                '500 ações IA/dia',
                'Tudo do Starter +',
                'API básica',
                '5 integrações',
                'Relatórios avançados',
                'Multi-localização',
                'Suporte chat (24h)'
            ]
        },
        {
            name: 'business',
            displayName: 'Business',
            price: 199,
            period: 'mês',
            description: 'Para empresas estabelecidas',
            cta: 'Começar Grátis',
            features: [
                '50 usuários',
                '5.000 receitas',
                '50 GB de armazenamento',
                '2.000 ações IA/dia',
                'Tudo do Pro +',
                'API completa',
                'Webhooks',
                'White-label',
                'Integrações ilimitadas',
                'Suporte prioritário (4h)'
            ]
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            price: 499,
            period: 'mês',
            description: 'Solução enterprise completa',
            cta: 'Falar com Vendas',
            features: [
                'Usuários ilimitados',
                'Receitas ilimitadas',
                '200 GB de armazenamento',
                '10.000 ações IA/dia',
                'Tudo do Business +',
                'SSO/SAML',
                'SLA 99.9%',
                'Account Manager dedicado',
                'Customizações',
                'Suporte 1h SLA'
            ]
        }
    ];

    const handlePlanClick = (plan: Plan) => {
        if (plan.name === 'enterprise') {
            // TODO: Open contact form or mailto
            window.location.href = 'mailto:contato@estokmax.com?subject=Enterprise Plan';
        } else {
            navigate('/signup', { state: { plan: plan.name } });
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(180deg, var(--bg-darker) 0%, var(--bg-dark) 100%)',
            padding: 'var(--space-2xl) var(--space-lg)'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header - © Marco Antonio de Souza */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            background: 'var(--gradient-primary)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}>
                            💰 PREÇOS TRANSPARENTES
                        </span>
                    </div>
                    <h1 style={{
                        fontSize: '3rem',
                        margin: '0 0 var(--space-md) 0',
                        background: 'var(--gradient-primary)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Planos para todo tipo de negócio
                    </h1>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-muted)',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Comece grátis com 14 dias de trial. Sem cartão de crédito necessário.*
                    </p>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        marginTop: 'var(--space-sm)'
                    }}>
                        *Cartão será solicitado após trial para continuar usando
                    </p>
                </div>

                {/* Plans Grid - © Marco Antonio de Souza */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 'var(--space-xl)',
                    marginBottom: 'var(--space-3xl)'
                }}>
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className="card"
                            style={{
                                background: plan.highlighted
                                    ? 'linear-gradient(135deg, rgba(155, 81, 224, 0.15), rgba(0, 168, 255, 0.15))'
                                    : 'var(--bg-dark)',
                                border: plan.highlighted
                                    ? '2px solid var(--primary)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                position: 'relative',
                                transform: plan.highlighted ? 'scale(1.05)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {plan.highlighted && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--gradient-primary)',
                                    padding: '4px 16px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    ⭐ MAIS POPULAR
                                </div>
                            )}

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '1.5rem',
                                    color: plan.highlighted ? 'var(--primary)' : 'var(--text-primary)'
                                }}>
                                    {plan.displayName}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {plan.description}
                                </p>
                            </div>

                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>R$</span>
                                    <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>{plan.price}</span>
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/{plan.period}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handlePlanClick(plan)}
                                className={plan.highlighted ? 'btn btn-primary' : 'btn btn-secondary'}
                                style={{
                                    width: '100%',
                                    marginBottom: 'var(--space-xl)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 'var(--space-sm)'
                                }}
                            >
                                {plan.name === 'enterprise' ? (
                                    <>
                                        <Zap size={18} />
                                        {plan.cta}
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp size={18} />
                                        {plan.cta}
                                    </>
                                )}
                            </button>

                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-sm)'
                            }}>
                                {plan.features.map((feature, idx) => (
                                    <li
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-sm)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <Check size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* FAQ - © Marco Antonio de Souza */}
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                        Perguntas Frequentes
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Como funciona o trial de 14 dias?</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                Você pode testar qualquer plano gratuitamente por 14 dias. Não é necessário cartão de crédito para começar.
                                Após o período de trial, você será solicitado a adicionar um método de pagamento para continuar usando.
                            </p>
                        </div>

                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Posso mudar de plano depois?</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. Mudanças são aplicadas imediatamente
                                e o valor é ajustado proporcionalmente.
                            </p>
                        </div>

                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>O que acontece se eu atingir o limite?</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                Quando você atingir o limite de usuários ou receitas do seu plano, receberá um aviso para fazer upgrade.
                                Você não poderá adicionar novos itens até fazer o upgrade.
                            </p>
                        </div>

                        <div className="card">
                            <h3 style={{ marginTop: 0 }}>Posso cancelar a qualquer momento?</h3>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                                Sim! Não há contratos ou taxas de cancelamento. Você pode cancelar sua assinatura a qualquer momento
                                pela página de configurações.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer CTA - © Marco Antonio de Souza */}
                <div style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-3xl)',
                    padding: 'var(--space-3xl)',
                    background: 'linear-gradient(135deg, rgba(155, 81, 224, 0.1), rgba(0, 168, 255, 0.1))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <h2 style={{ marginTop: 0 }}>Pronto para começar?</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                        Junte-se a centenas de restaurantes que já usam EstokMax
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn btn-primary"
                        style={{
                            fontSize: '1.125rem',
                            padding: '16px 32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}
                    >
                        <TrendingUp size={20} />
                        Começar Grátis por 14 Dias
                    </button>
                </div>
            </div>
        </div>
    );
}
