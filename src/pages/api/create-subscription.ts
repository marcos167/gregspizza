/**
 * Create Subscription API
 * 
 * Creates a Mercado Pago subscription preference with 14-day trial.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createSubscriptionPreference } from '@/lib/mercadopago';
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

        // Create Mercado Pago subscription preference
        const preference = await createSubscriptionPreference({
            tenantId,
            plan,
            email,
            successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success`,
            failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment?failed=true`,
            pendingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/pending`,
        });

        res.status(200).json({
            preferenceId: preference.id,
            initPoint: preference.init_point, // Checkout URL
        });
    } catch (error: any) {
        console.error('[Create Subscription] Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
