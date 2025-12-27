/**
 * SubscribeButton Component
 * 
 * Initiates Mercado Pago subscription flow with 14-day trial.
 */

import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
    tenantId: string;
    plan: string;
    email: string;
    className?: string;
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({
    tenantId,
    plan,
    email,
    className = '',
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubscribe = async () => {
        setLoading(true);
        setError(null);

        try {
            // Create subscription preference
            const response = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tenantId,
                    plan,
                    email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create subscription');
            }

            // Redirect to Mercado Pago checkout
            window.location.href = data.initPoint;
        } catch (err: any) {
            console.error('Subscription error:', err);
            setError(err.message || 'Failed to start subscription');
            setLoading(false);
        }
    };

    const planNames: Record<string, string> = {
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
        enterprise: 'Enterprise',
    };

    const planPrices: Record<string, string> = {
        starter: 'R$ 49',
        pro: 'R$ 99',
        business: 'R$ 199',
        enterprise: 'R$ 499',
    };

    return (
        <div>
            <button
                onClick={handleSubscribe}
                disabled={loading}
                className={`btn btn-primary ${className}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-sm)',
                }}
            >
                {loading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        Processando...
                    </>
                ) : (
                    <>
                        <CreditCard size={20} />
                        Iniciar Trial de 14 Dias - {planNames[plan] || plan}
                    </>
                )}
            </button>

            {error && (
                <p style={{ color: 'var(--danger)', marginTop: 'var(--space-sm)', fontSize: '0.875rem' }}>
                    ❌ {error}
                </p>
            )}

            <div style={{ marginTop: 'var(--space-sm)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                    Após o trial: <strong>{planPrices[plan]}/mês</strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    💳 Sem cobrança nos primeiros 14 dias • ❌ Cancele quando quiser
                </p>
            </div>
        </div>
    );
};
