-- Marketplace publishing + reporting fields for officiant scripts.
-- Run once in Supabase SQL Editor before relying on script marketplace reporting.

ALTER TABLE public.scripts
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketplace_languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketplace_categories TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketplace_ceremony_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS marketplace_visibility TEXT NOT NULL DEFAULT 'main_marketplace',
  ADD COLUMN IF NOT EXISTS marketplace_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketplace_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS last_sale_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.script_sales (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  script_id INTEGER NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
  buyer_email TEXT,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.script_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own script sales" ON public.script_sales;
CREATE POLICY "Users can view own script sales"
  ON public.script_sales FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own script sales" ON public.script_sales;
CREATE POLICY "Users can insert own script sales"
  ON public.script_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scripts_marketplace_user
  ON public.scripts(user_id, is_published);

CREATE INDEX IF NOT EXISTS idx_scripts_marketplace_visibility
  ON public.scripts(user_id, is_published, marketplace_visibility);

CREATE INDEX IF NOT EXISTS idx_script_sales_user_created
  ON public.script_sales(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_script_sales_script
  ON public.script_sales(script_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'scripts_marketplace_visibility_check'
      AND conrelid = 'public.scripts'::regclass
  ) THEN
    ALTER TABLE public.scripts
      ADD CONSTRAINT scripts_marketplace_visibility_check
      CHECK (marketplace_visibility IN ('main_marketplace', 'store_only', 'private'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_main_marketplace_script_limit()
RETURNS TRIGGER AS $$
DECLARE
  visible_count INTEGER;
BEGIN
  IF NEW.is_published = TRUE AND NEW.marketplace_visibility = 'main_marketplace' THEN
    SELECT COUNT(*)
    INTO visible_count
    FROM public.scripts
    WHERE user_id = NEW.user_id
      AND is_published = TRUE
      AND marketplace_visibility = 'main_marketplace'
      AND id <> COALESCE(NEW.id, -1);

    IF visible_count >= 10 THEN
      RAISE EXCEPTION 'You have reached the maximum of 10 scripts allowed in the main marketplace. Remove one from the marketplace or publish this script to your store only.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_main_marketplace_script_limit ON public.scripts;
CREATE TRIGGER trg_enforce_main_marketplace_script_limit
  BEFORE INSERT OR UPDATE OF is_published, marketplace_visibility
  ON public.scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_main_marketplace_script_limit();

CREATE OR REPLACE FUNCTION public.unpublish_scripts_when_subscription_inactive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'active' OR COALESCE(NEW.cancel_at_period_end, FALSE) = TRUE THEN
    UPDATE public.scripts
    SET
      is_published = FALSE,
      status = 'Marketplace Draft',
      updated_at = NOW()
    WHERE user_id = NEW.user_id
      AND is_published = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_unpublish_scripts_when_subscription_inactive ON public.subscriptions;
CREATE TRIGGER trg_unpublish_scripts_when_subscription_inactive
  AFTER INSERT OR UPDATE OF status, cancel_at_period_end
  ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.unpublish_scripts_when_subscription_inactive();

DROP POLICY IF EXISTS "Anyone can view published scripts" ON public.scripts;
CREATE POLICY "Anyone can view published scripts"
  ON public.scripts FOR SELECT
  USING (is_published = TRUE);
