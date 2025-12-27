/**
 * CheckoutButton Component
 * 
 * Initiates Stripe Checkout flow for trial signup.
 */

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutButtonProps {
    tenantId: string;
    plan: string;
    email: string;
    className?: string;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
    tenantId,
    plan,
    email,
    className = '',
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            // Create checkout session
            const response = await fetch('/api/create-checkout-session', {
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
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // Redirect to Stripe Checkout
            const stripe = await stripePromise;

            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId: data.sessionId,
            });

            if (stripeError) {
                throw stripeError;
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'Failed to start checkout');
        } finally {
            setLoading(false);
        }
    };

    const planNames: Record<string, string> = {
        starter: 'Starter',
        pro: 'Pro',
        business: 'Business',
        enterprise: 'Enterprise',
    };

    return (
        <div>
            <button
                onClick={handleCheckout}
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

            <p
                style={{
                    marginTop: 'var(--space-sm)',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textAlign: 'center',
                }}
            >
                💳 Cartão necessário • 🚫 Sem cobrança nos primeiros 14 dias • ❌ Cancele a qualquer momento
            </p>
        </div>
    );
};
