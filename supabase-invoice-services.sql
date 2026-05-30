-- Saved invoice service items for each officiant.
-- Run once in Supabase SQL Editor before using saved invoice services in production.

CREATE TABLE IF NOT EXISTS public.invoice_service_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Ceremony Services',
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, service)
);

ALTER TABLE public.invoice_service_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoice_service_items TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.invoice_service_items_id_seq TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view own invoice services" ON public.invoice_service_items;
CREATE POLICY "Users can view own invoice services"
  ON public.invoice_service_items FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoice services" ON public.invoice_service_items;
CREATE POLICY "Users can insert own invoice services"
  ON public.invoice_service_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoice services" ON public.invoice_service_items;
CREATE POLICY "Users can update own invoice services"
  ON public.invoice_service_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoice services" ON public.invoice_service_items;
CREATE POLICY "Users can delete own invoice services"
  ON public.invoice_service_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoice_service_items_user
  ON public.invoice_service_items(user_id);
