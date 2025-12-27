/**
 * Stripe Service
 * 
 * Wrapper for Stripe API to handle payments, subscriptions, and billing.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18',
    typescript: true,
});

/**
 * Stripe Price IDs
 * 
 * IMPORTANT: Replace these with your actual Price IDs from Stripe Dashboard
 * after creating the products.
 * 
 * To get these:
 * 1. Go to https://dashboard.stripe.com/products
 * 2. Create a product for each plan
 * 3. Copy the Price ID (starts with price_...)
 */
export const STRIPE_PRICES = {
    starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly',
    pro: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
    business: process.env.STRIPE_PRICE_BUSINESS || 'price_business_monthly',
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_monthly',
} as const;

/**
 * Create a Stripe customer for a tenant
 */
export async function createStripeCustomer(params: {
    email: string;
    tenantId: string;
    tenantName: string;
}) {
    const { email, tenantId, tenantName } = params;

    return await stripe.customers.create({
        email,
        name: tenantName,
        metadata: {
            tenant_id: tenantId,
            tenant_name: tenantName,
        },
    });
}

/**
 * Create checkout session for trial signup
 * 
 * This creates a Stripe Checkout session with a 14-day trial.
 * The customer provides payment info upfront but isn't charged until trial ends.
 */
export async function createTrialCheckoutSession(params: {
    tenantId: string;
    plan: string;
    email: string;
    successUrl: string;
    cancelUrl: string;
}) {
    const { tenantId, plan, email, successUrl, cancelUrl } = params;

    const priceId = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
    if (!priceId) {
        throw new Error(`Invalid plan: ${plan}`);
    }

    return await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        subscription_data: {
            trial_period_days: 14,
            trial_settings: {
                end_behavior: {
                    missing_payment_method: 'cancel', // Cancel if no payment method provided
                },
            },
            metadata: {
                tenant_id: tenantId,
                plan,
            },
        },
        payment_method_collection: 'always', // Require payment method upfront
        metadata: {
            tenant_id: tenantId,
            plan,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
}

/**
 * Update subscription plan (upgrade/downgrade)
 */
export async function updateSubscriptionPlan(subscriptionId: string, newPlan: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const newPriceId = STRIPE_PRICES[newPlan as keyof typeof STRIPE_PRICES];

    if (!newPriceId) {
        throw new Error(`Invalid plan: ${newPlan}`);
    }

    return await stripe.subscriptions.update(subscriptionId, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: newPriceId,
            },
        ],
        proration_behavior: 'create_prorations', // Prorate charges
        metadata: {
            ...subscription.metadata,
            plan: newPlan,
        },
    });
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string, immediately: boolean = false) {
    if (immediately) {
        return await stripe.subscriptions.cancel(subscriptionId);
    } else {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }
}

/**
 * Get customer portal URL for managing subscription
 */
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
    return await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });
}

/**
 * Get upcoming invoice preview
 */
export async function getUpcomingInvoice(customerId: string) {
    try {
        return await stripe.invoices.retrieveUpcoming({
            customer: customerId,
        });
    } catch (error) {
        return null;
    }
}
