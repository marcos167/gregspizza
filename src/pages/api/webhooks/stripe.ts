/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe events to automatically manage subscriptions and billing.
 * 
 * Webhook Events Handled:
 * - checkout.session.completed: When customer completes payment
 * - customer.subscription.created: When subscription is created
 * - customer.subscription.updated: When subscription status changes
 * - customer.subscription.deleted: When subscription is canceled
 * - invoice.payment_succeeded: When payment succeeds (trial conversion)
 * - invoice.payment_failed: When payment fails
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase-admin';
import Stripe from 'stripe';

// Disable body parsing (Stripe needs raw body)
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        return res.status(400).json({ error: 'No signature' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err: any) {
        console.error(`❌ Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] ${event.type} - ${event.id}`);

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            default:
                console.log(`ℹ️  Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error: any) {
        console.error('[Webhook Handler] Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Handle checkout.session.completed
 * 
 * Called when customer completes payment info (even during trial).
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenant_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!tenantId) {
        console.warn('No tenant_id in checkout session metadata');
        return;
    }

    // Update tenant with Stripe IDs
    const { error } = await supabase
        .from('tenants')
        .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            payment_method_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);

    if (error) {
        console.error('Error updating tenant:', error);
        throw error;
    }

    console.log(`✅ [Checkout Complete] Tenant ${tenantId} → Customer ${customerId}`);
}

/**
 * Handle customer.subscription.created
 * 
 * Called when subscription is created (with trial).
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;
    const plan = subscription.metadata.plan || 'starter';

    if (!tenantId) {
        console.warn('No tenant_id in subscription metadata');
        return;
    }

    // Start trial if subscription has trial period
    if (subscription.status === 'trialing' && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end * 1000);
        const trialDays = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        const { error } = await supabase.rpc('start_trial', {
            p_tenant_id: tenantId,
            p_trial_days: trialDays,
        });

        if (error) {
            console.error('Error starting trial:', error);
        }

        console.log(`✅ [Trial Started] Tenant ${tenantId}, ends ${trialEnd.toISOString()}`);
    }
}

/**
 * Handle customer.subscription.updated
 * 
 * Called when subscription status changes (active, past_due, canceled, etc.).
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;

    if (!tenantId) return;

    // Map Stripe status to tenant status
    let status: 'active' | 'suspended' = 'active';
    if (['past_due', 'canceled', 'unpaid'].includes(subscription.status)) {
        status = 'suspended';
    }

    const { error } = await supabase
        .from('tenants')
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);

    if (error) {
        console.error('Error updating tenant status:', error);
    }

    console.log(`✅ [Subscription Updated] Tenant ${tenantId} → ${status} (${subscription.status})`);
}

/**
 * Handle customer.subscription.deleted
 * 
 * Called when subscription is canceled.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const tenantId = subscription.metadata.tenant_id;

    if (!tenantId) return;

    // Suspend tenant
    const { error } = await supabase
        .from('tenants')
        .update({
            status: 'suspended',
            updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);

    if (error) {
        console.error('Error suspending tenant:', error);
    }

    console.log(`✅ [Subscription Deleted] Tenant ${tenantId} suspended`);
}

/**
 * Handle invoice.payment_succeeded
 * 
 * Called when payment succeeds (including first payment after trial).
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) return;

    // Get subscription to access metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata.tenant_id;
    const plan = subscription.metadata.plan || 'starter';

    if (!tenantId) return;

    // Check if this is first payment after trial
    const { data: tenant } = await supabase
        .from('tenants')
        .select('trial_converted')
        .eq('id', tenantId)
        .single();

    if (tenant && !tenant.trial_converted) {
        // Convert trial to paid
        const nextBillingDate = new Date(invoice.period_end * 1000).toISOString().split('T')[0];

        const { error } = await supabase.rpc('convert_trial_to_paid', {
            p_tenant_id: tenantId,
            p_plan_name: plan,
            p_subscription_id: subscriptionId,
            p_next_billing_date: nextBillingDate,
        });

        if (error) {
            console.error('Error converting trial:', error);
        }

        console.log(`🎉 [Trial Converted] Tenant ${tenantId} → ${plan.toUpperCase()}`);
    }

    // Record billing transaction
    const { error: txError } = await supabase.from('billing_transactions').insert({
        tenant_id: tenantId,
        amount: invoice.amount_paid,
        currency: invoice.currency.toUpperCase(),
        status: 'paid',
        gateway: 'stripe',
        gateway_transaction_id: invoice.id,
        description: `Payment for ${plan} plan`,
        period_start: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
        period_end: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
        paid_at: new Date().toISOString(),
    });

    if (txError) {
        console.error('Error recording transaction:', error);
    }

    const amount = (invoice.amount_paid / 100).toFixed(2);
    console.log(`✅ [Payment Succeeded] Tenant ${tenantId}, R$ ${amount}`);
}

/**
 * Handle invoice.payment_failed
 * 
 * Called when payment fails.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const tenantId = subscription.metadata.tenant_id;

    if (!tenantId) return;

    // Record failed transaction
    const { error } = await supabase.from('billing_transactions').insert({
        tenant_id: tenantId,
        amount: invoice.amount_due,
        currency: invoice.currency.toUpperCase(),
        status: 'failed',
        gateway: 'stripe',
        gateway_transaction_id: invoice.id,
        description: `Failed payment for ${subscription.metadata.plan} plan`,
        failed_at: new Date().toISOString(),
        gateway_response: {
            charge_id: invoice.charge,
            attempt_count: invoice.attempt_count,
        },
    });

    if (error) {
        console.error('Error recording failed transaction:', error);
    }

    const amount = (invoice.amount_due / 100).toFixed(2);
    console.log(`❌ [Payment Failed] Tenant ${tenantId}, R$ ${amount}`);

    // TODO: Send email notification to tenant
}
