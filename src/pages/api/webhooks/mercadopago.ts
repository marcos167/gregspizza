/**
 * Mercado Pago Webhook Handler
 * 
 * Handles Mercado Pago notifications to automatically manage subscriptions and billing.
 * 
 * Notification Types:
 * - payment: When a payment is processed
 * - preapproval: When subscription status changes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import mercadopago, { getSubscription, getPayment } from '@/lib/mercadopago';
import { supabase } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type, data, action } = req.body;

        console.log(`[Mercado Pago Webhook] Type: ${type}, Action: ${action}, ID: ${data?.id}`);

        // Mercado Pago sends different notification types
        if (type === 'payment') {
            await handlePaymentNotification(data.id);
        } else if (type === 'preapproval') {
            await handleSubscriptionNotification(data.id);
        }

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('[Mercado Pago Webhook] Error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Handle payment notification
 */
async function handlePaymentNotification(paymentId: string) {
    try {
        const payment = await getPayment(paymentId);

        console.log(`[Payment] ID: ${payment.id}, Status: ${payment.status}, Amount: ${payment.transaction_amount}`);

        const subscriptionId = payment.preapproval_id;
        if (!subscriptionId) {
            console.warn('Payment has no subscription ID');
            return;
        }

        // Get subscription to access metadata
        const subscription = await getSubscription(subscriptionId);
        const tenantId = subscription.external_reference;
        const plan = subscription.metadata?.plan || 'starter';

        if (!tenantId) {
            console.warn('Subscription has no tenant ID');
            return;
        }

        if (payment.status === 'approved') {
            await handlePaymentApproved(payment, tenantId, plan, subscriptionId);
        } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
            await handlePaymentFailed(payment, tenantId);
        }
    } catch (error) {
        console.error('[Payment Notification] Error:', error);
    }
}

/**
 * Handle subscription status notification
 */
async function handleSubscriptionNotification(subscriptionId: string) {
    try {
        const subscription = await getSubscription(subscriptionId);

        console.log(`[Subscription] ID: ${subscription.id}, Status: ${subscription.status}`);

        const tenantId = subscription.external_reference;
        const plan = subscription.metadata?.plan || 'starter';

        if (!tenantId) {
            console.warn('Subscription has no tenant ID');
            return;
        }

        // Handle different subscription statuses
        switch (subscription.status) {
            case 'authorized':
                await handleSubscriptionAuthorized(subscription, tenantId, plan);
                break;

            case 'paused':
            case 'cancelled':
                await handleSubscriptionCancelled(subscription, tenantId);
                break;

            case 'pending':
                // Trial period active
                await handleTrialActive(subscription, tenantId, plan);
                break;
        }
    } catch (error) {
        console.error('[Subscription Notification] Error:', error);
    }
}

/**
 * Handle when subscription is authorized (active)
 */
async function handleSubscriptionAuthorized(subscription: any, tenantId: string, plan: string) {
    const { error } = await supabase
        .from('tenants')
        .update({
            mp_subscription_id: subscription.id,
            mp_payer_id: subscription.payer_id,
            status: 'active',
            updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);

    if (error) {
        console.error('Error updating tenant:', error);
        throw error;
    }

    console.log(`✅ [Subscription Authorized] Tenant ${tenantId} → Active`);
}

/**
 * Handle when trial is active
 */
async function handleTrialActive(subscription: any, tenantId: string, plan: string) {
    // Start trial if not already started
    const { data: tenant } = await supabase
        .from('tenants')
        .select('trial_started_at')
        .eq('id', tenantId)
        .single();

    if (tenant && !tenant.trial_started_at) {
        const { error } = await supabase.rpc('start_trial', {
            p_tenant_id: tenantId,
            p_trial_days: 14,
        });

        if (error) {
            console.error('Error starting trial:', error);
        }

        console.log(`✅ [Trial Started] Tenant ${tenantId}`);
    }

    // Update subscription ID
    await supabase
        .from('tenants')
        .update({
            mp_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', tenantId);
}

/**
 * Handle successful payment
 */
async function handlePaymentApproved(payment: any, tenantId: string, plan: string, subscriptionId: string) {
    // Check if this is first payment after trial
    const { data: tenant } = await supabase
        .from('tenants')
        .select('trial_converted')
        .eq('id', tenantId)
        .single();

    if (tenant && !tenant.trial_converted) {
        // Convert trial to paid
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        const { error } = await supabase.rpc('convert_trial_to_paid', {
            p_tenant_id: tenantId,
            p_plan_name: plan,
            p_subscription_id: subscriptionId,
            p_next_billing_date: nextBillingDate.toISOString().split('T')[0],
        });

        if (error) {
            console.error('Error converting trial:', error);
        }

        console.log(`🎉 [Trial Converted] Tenant ${tenantId} → ${plan.toUpperCase()}`);
    }

    // Record transaction
    const { error: txError } = await supabase.from('billing_transactions').insert({
        tenant_id: tenantId,
        amount: Math.round(payment.transaction_amount * 100), // Convert to cents
        currency: payment.currency_id,
        status: 'paid',
        gateway: 'mercadopago',
        gateway_transaction_id: payment.id.toString(),
        description: `Pagamento plano ${plan}`,
        paid_at: new Date(payment.date_approved).toISOString(),
        gateway_response: {
            payment_method: payment.payment_method_id,
            payment_type: payment.payment_type_id,
            status_detail: payment.status_detail,
        },
    });

    if (txError) {
        console.error('Error recording transaction:', txError);
    }

    console.log(`✅ [Payment Approved] Tenant ${tenantId}, R$ ${payment.transaction_amount.toFixed(2)}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment: any, tenantId: string) {
    // Record failed transaction
    const { error } = await supabase.from('billing_transactions').insert({
        tenant_id: tenantId,
        amount: Math.round(payment.transaction_amount * 100),
        currency: payment.currency_id,
        status: 'failed',
        gateway: 'mercadopago',
        gateway_transaction_id: payment.id.toString(),
        failed_at: new Date().toISOString(),
        gateway_response: {
            status_detail: payment.status_detail,
            payment_method: payment.payment_method_id,
        },
    });

    if (error) {
        console.error('Error recording failed transaction:', error);
    }

    console.log(`❌ [Payment Failed] Tenant ${tenantId}, R$ ${payment.transaction_amount.toFixed(2)}`);

    // TODO: Send email notification
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: any, tenantId: string) {
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

    console.log(`✅ [Subscription Cancelled] Tenant ${tenantId} suspended`);
}
