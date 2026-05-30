-- Stripe Connect accounts for officiant payouts.
-- Run this once in Supabase SQL Editor before enabling seller payouts.

CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  country TEXT,
  default_currency TEXT,
  charges_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stripe_connect_accounts_user_unique UNIQUE (user_id)
);

ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.stripe_connect_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stripe_connect_accounts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.stripe_connect_accounts_id_seq TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view own Stripe Connect account" ON public.stripe_connect_accounts;
CREATE POLICY "Users can view own Stripe Connect account"
  ON public.stripe_connect_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts and updates are performed by server routes with the service role key.
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_user_id
  ON public.stripe_connect_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_stripe_account_id
  ON public.stripe_connect_accounts(stripe_account_id);
