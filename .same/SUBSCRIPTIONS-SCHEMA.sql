-- Subscriptions Table for Square Integration
-- Run this in your Supabase SQL Editor

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Square integration
  square_subscription_id TEXT,
  square_customer_id TEXT,

  -- Plan details
  plan_type TEXT NOT NULL DEFAULT 'aspirant', -- 'aspirant', 'professional', 'data_retention'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'data_retention', 'expired'
  price_cents INTEGER DEFAULT 0,

  -- Billing cycle (30-day increments)
  billing_cycle_start TIMESTAMPTZ,
  billing_cycle_end TIMESTAMPTZ,

  -- Cancellation tracking
  canceled_at TIMESTAMPTZ,
  data_deletion_scheduled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one subscription per user
  UNIQUE(user_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_square_subscription_id ON public.subscriptions(square_subscription_id);

-- Add square_customer_id to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS square_customer_id TEXT;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS subscription_updated_at ON public.subscriptions;
CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Grant permissions
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
