-- Anniversary reminder support for OrdainedPro.
-- Run this once in the Supabase SQL Editor for the production project.

CREATE TABLE IF NOT EXISTS anniversary_reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id BIGINT NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  wedding_date DATE NOT NULL,
  anniversary_year INTEGER NOT NULL,
  anniversary_date DATE NOT NULL,
  contact_status TEXT NOT NULL DEFAULT 'not_contacted'
    CHECK (contact_status IN ('not_contacted', 'email_sent', 'marked_contacted')),
  email_sent_at TIMESTAMPTZ,
  marked_contacted_at TIMESTAMPTZ,
  auto_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, couple_id, anniversary_year)
);

CREATE INDEX IF NOT EXISTS idx_anniversary_reminders_user_date
  ON anniversary_reminders (user_id, anniversary_date);

CREATE INDEX IF NOT EXISTS idx_anniversary_reminders_auto
  ON anniversary_reminders (anniversary_date, contact_status, auto_email_sent_at);

ALTER TABLE anniversary_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own anniversary reminders"
  ON anniversary_reminders;
DROP POLICY IF EXISTS "Users can insert their own anniversary reminders"
  ON anniversary_reminders;
DROP POLICY IF EXISTS "Users can update their own anniversary reminders"
  ON anniversary_reminders;
DROP POLICY IF EXISTS "Users can delete their own anniversary reminders"
  ON anniversary_reminders;

CREATE POLICY "Users can read their own anniversary reminders"
  ON anniversary_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anniversary reminders"
  ON anniversary_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anniversary reminders"
  ON anniversary_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anniversary reminders"
  ON anniversary_reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON anniversary_reminders TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE anniversary_reminders_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.anniversary_reminders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.anniversary_reminders_id_seq TO service_role;

CREATE TABLE IF NOT EXISTS anniversary_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_days INTEGER NOT NULL DEFAULT 3 CHECK (reminder_days BETWEEN 0 AND 60),
  auto_send_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE anniversary_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own anniversary settings"
  ON anniversary_settings;
DROP POLICY IF EXISTS "Users can insert their own anniversary settings"
  ON anniversary_settings;
DROP POLICY IF EXISTS "Users can update their own anniversary settings"
  ON anniversary_settings;

CREATE POLICY "Users can read their own anniversary settings"
  ON anniversary_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anniversary settings"
  ON anniversary_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anniversary settings"
  ON anniversary_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON anniversary_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.anniversary_settings TO service_role;
