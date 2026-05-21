-- Meeting lifecycle support for calendar invites, rescheduling, and cancellations.
-- Run this in the Supabase SQL editor for the OrdainedPro portal project.

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS meeting_type TEXT NOT NULL DEFAULT 'in-person',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS response_deadline DATE,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_by TEXT,
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meetings_status_check'
      AND conrelid = 'public.meetings'::regclass
  ) THEN
    ALTER TABLE public.meetings
      ADD CONSTRAINT meetings_status_check
      CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed', 'canceled', 'completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meetings_couple_user_date
  ON public.meetings (couple_id, user_id, date, time);

