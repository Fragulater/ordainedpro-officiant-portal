-- Task reminder support for OrdainedPro.
-- Run this once in the Supabase SQL Editor for the production project.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS email_reminder BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_pending_reminders
  ON tasks (email_reminder, reminder_sent, completed, due_date);
