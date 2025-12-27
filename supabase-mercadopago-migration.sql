-- ============================================
-- MERCADO PAGO DATABASE MIGRATION
-- ============================================
-- Add Mercado Pago specific fields to tenants table
-- Update tenants table with Mercado Pago fields
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payer_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payment_method_id TEXT;

-- Update trial_sessions for Mercado Pago
ALTER TABLE trial_sessions
ADD COLUMN IF NOT EXISTS mp_payment_method_id TEXT;

-- Rename Stripe columns (optional - for backward compatibility)
-- You can keep stripe_ columns or rename them to be gateway-agnostic
-- For now, we'll keep both and use mp_ for Mercado Pago
COMMENT ON COLUMN tenants.mp_subscription_id IS 'Mercado Pago subscription (preapproval) ID';

COMMENT ON COLUMN tenants.mp_payer_id IS 'Mercado Pago payer/customer ID';

COMMENT ON COLUMN tenants.mp_payment_method_id IS 'Mercado Pago payment method ID';