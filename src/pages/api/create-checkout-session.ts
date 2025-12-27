/**
 * Create Checkout Session API
 * 
 * Creates a Stripe Checkout session for trial signup.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createTrialCheckoutSession } from '@/lib/stripe';
import { supabase } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tenantId, plan, email } = req.body;

        // Validate input
        if (!tenantId || !plan || !email) {
            return res.status(400).json({ error: 'Missing required fields: tenantId, plan, email' });
        }

        // Verify tenant exists
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('id', tenantId)
            .single();

        if (tenantError || !tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Create Stripe checkout session
        const session = await createTrialCheckoutSession({
            tenantId,
            plan,
            email,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment?canceled=true`,
        });

        res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('[Create Checkout Session] Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
