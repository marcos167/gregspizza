/**
 * UpgradeModal Component
 * 
 * Displays when a user hits a plan limit and needs to upgrade.
 * Shows plan comparison and upgrade options.
 */

import React from 'react';
import { X, Check, ArrowRight } from 'lucide-react';
import './UpgradeModal.css';

interface Plan {
    name: string;
    display_name: string;
    price: number; // in cents
    users: number;
    recipes: number;
    features: string[];
}

interface UpgradeModalProps {
    currentPlan: string;
    feature: string; // What they're trying to do (e.g., "adicionar mais usuários")
    onClose: () => void;
    onUpgrade?: (plan: string) => void;
}

const PLANS: Plan[] = [
    {
        name: 'starter',
        display_name: 'Starter',
        price: 4900,
        users: 5,
        recipes: 200,
        features: ['Gestão básica', 'Suporte email'],
    },
    {
        name: 'pro',
        display_name: 'Pro',
        price: 9900,
        users: 15,
        recipes: 1000,
        features: ['API básica', '5 integrações', 'Relatórios avançados', 'Multi-localização'],
    },
    {
        name: 'business',
        display_name: 'Business',
        price: 19900,
        users: 50,
        recipes: 5000,
        features: ['API completa', 'Webhooks', 'White-label', 'Integrações ilimitadas'],
    },
    {
        name: 'enterprise',
        display_name: 'Enterprise',
        price: 49900,
        users: 999999,
        recipes: 999999,
        features: ['SSO/SAML', 'SLA 99.9%', 'Gerente dedicado', 'Customizações'],
    },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
    currentPlan,
    feature,
    onClose,
    onUpgrade,
}) => {
    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(cents / 100);
    };

    const currentPlanIndex = PLANS.findIndex((p) => p.name === currentPlan);
    const recommendedPlan = currentPlanIndex < PLANS.length - 1 ? PLANS[currentPlanIndex + 1] : null;

    const handleUpgradeClick = () => {
        if (recommendedPlan && onUpgrade) {
            onUpgrade(recommendedPlan.name);
        } else {
            // Redirect to billing page or contact sales
            window.location.href = '/settings/billing';
        }
    };

    return (
        <div className="upgrade-modal-overlay" onClick={onClose}>
            <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
                <button className="upgrade-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="upgrade-modal-header">
                    <h2>✨ Upgrade Necessário</h2>
                    <p>
                        Você atingiu o limite do plano <strong>{PLANS[currentPlanIndex]?.display_name}</strong>.
                    </p>
                    <p className="upgrade-modal-subtitle">
                        Faça upgrade para {feature} e desbloquear mais recursos!
                    </p>
                </div>

                <div className="upgrade-modal-plans">
                    {/* Current Plan */}
                    <div className="upgrade-plan-card current">
                        <div className="plan-header">
                            <h3>{PLANS[currentPlanIndex]?.display_name}</h3>
                            <span className="plan-badge current">Plano Atual</span>
                        </div>
                        <p className="plan-price">{formatPrice(PLANS[currentPlanIndex]?.price || 0)}/mês</p>
                        <ul className="plan-features">
                            <li className="limit-reached">
                                <X size={16} className="icon-x" />
                                <span>Limite atingido</span>
                            </li>
                            <li>
                                <Check size={16} />
                                {PLANS[currentPlanIndex]?.users} usuários
                            </li>
                            <li>
                                <Check size={16} />
                                {PLANS[currentPlanIndex]?.recipes} receitas
                            </li>
                        </ul>
                    </div>

                    {/* Recommended Plan */}
                    {recommendedPlan && (
                        <div className="upgrade-plan-card recommended">
                            <div className="plan-header">
                                <h3>{recommendedPlan.display_name}</h3>
                                <span className="plan-badge recommended">Recomendado</span>
                            </div>
                            <p className="plan-price">{formatPrice(recommendedPlan.price)}/mês</p>
                            <ul className="plan-features">
                                <li className="highlight">
                                    <Check size={16} className="icon-check" />
                                    <span>
                                        <strong>{recommendedPlan.users}</strong> usuários
                                    </span>
                                </li>
                                <li className="highlight">
                                    <Check size={16} className="icon-check" />
                                    <span>
                                        <strong>{recommendedPlan.recipes}</strong> receitas
                                    </span>
                                </li>
                                {recommendedPlan.features.slice(0, 3).map((feat, idx) => (
                                    <li key={idx}>
                                        <Check size={16} />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                            <button className="btn-upgrade" onClick={handleUpgradeClick}>
                                Fazer Upgrade Agora
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="upgrade-modal-footer">
                    <p>
                        💳 Upgrade instantâneo • 📊 Sem perda de dados • 🔒 Cancelamento a qualquer momento
                    </p>
                </div>
            </div>
        </div>
    );
};
