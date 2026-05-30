-- Refund fee tracking for payments
-- Run this in Supabase SQL Editor for an existing OrdainedPro database.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refund_fee_rate DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS refund_fee_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS total_officiant_charge DECIMAL(10,2);
