-- Stripe refund support for invoice payment records.
-- Run this in Supabase SQL Editor for an existing OrdainedPro database.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id
  ON payments(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_payments_refunded_payment_id
  ON payments(refunded_payment_id);
