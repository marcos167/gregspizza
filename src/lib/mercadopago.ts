/**
 * Mercado Pago Service
 * 
 * Wrapper for Mercado Pago API to handle payments, subscriptions, and billing.
 */

import mercadopago from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN environment variable is not set');
}

// Configure Mercado Pago SDK
mercadopago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

/**
 * Mercado Pago Plan IDs
 * 
 * IMPORTANT: Replace these with your actual Plan IDs from Mercado Pago Dashboard
 * after creating the subscription plans.
 * 
 * To create plans:
 * 1. Go to https://www.mercadopago.com.br/subscriptions/create
 * 2. Create a plan for each tier
 * 3. Copy the Plan ID
 */
export const MP_PLANS = {
    starter: process.env.MP_PLAN_STARTER || '',
    pro: process.env.MP_PLAN_PRO || '',
    business: process.env.MP_PLAN_BUSINESS || '',
    enterprise: process.env.MP_PLAN_ENTERPRISE || '',
} as const;

export const MP_PLAN_PRICES = {
    starter: 4900, // R$ 49.00 in cents
    pro: 9900, // R$ 99.00
    business: 19900, // R$ 199.00
    enterprise: 49900, // R$ 499.00
};

/**
 * Create a subscription preference with trial
 */
export async function createSubscriptionPreference(params: {
    tenantId: string;
    plan: string;
    email: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
}) {
    const { tenantId, plan, email, successUrl, failureUrl, pendingUrl } = params;

    const price = MP_PLAN_PRICES[plan as keyof typeof MP_PLAN_PRICES];
    if (!price) {
        throw new Error(`Invalid plan: ${plan}`);
    }

    const preference = {
        reason: `Assinatura EstokMax - Plano ${plan.toUpperCase()}`,
        auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: price / 100, // Convert cents to reais
            currency_id: 'BRL',
            free_trial: {
                frequency: 14,
                frequency_type: 'days',
            },
        },
        back_urls: {
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl,
        },
        payer: {
            email,
        },
        external_reference: tenantId,
        metadata: {
            tenant_id: tenantId,
            plan,
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    };

    const response = await mercadopago.preapproval.create(preference);
    return response.body;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
    const response = await mercadopago.preapproval.get(subscriptionId);
    return response.body;
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(subscriptionId: string, newPlan: string) {
    const newPrice = MP_PLAN_PRICES[newPlan as keyof typeof MP_PLAN_PRICES];

    if (!newPrice) {
        throw new Error(`Invalid plan: ${newPlan}`);
    }

    const response = await mercadopago.preapproval.update({
        id: subscriptionId,
        auto_recurring: {
            transaction_amount: newPrice / 100,
        },
    });

    return response.body;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
    const response = await mercadopago.preapproval.update({
        id: subscriptionId,
        status: 'cancelled',
    });

    return response.body;
}

/**
 * Pause subscription
 */
export async function pauseSubscription(subscriptionId: string) {
    const response = await mercadopago.preapproval.update({
        id: subscriptionId,
        status: 'paused',
    });

    return response.body;
}

/**
 * Get payment details
 */
export async function getPayment(paymentId: string) {
    const response = await mercadopago.payment.get(paymentId);
    return response.body;
}

/**
 * Search payments for a subscription
 */
export async function getSubscriptionPayments(subscriptionId: string) {
    const response = await mercadopago.payment.search({
        qs: {
            preapproval_id: subscriptionId,
        },
    });

    return response.body.results;
}

export default mercadopago;
