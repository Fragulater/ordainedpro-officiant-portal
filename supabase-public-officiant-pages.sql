-- Public officiant pages.
-- Run once in Supabase SQL Editor before saving travel details from the profile editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS travel_radius_miles INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS travel_state TEXT,
  ADD COLUMN IF NOT EXISTS public_profile_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_public_profile_enabled
  ON public.profiles(public_profile_enabled);

CREATE INDEX IF NOT EXISTS idx_profiles_public_location
  ON public.profiles(state, city)
  WHERE public_profile_enabled = TRUE;

-- If your project has "Automatically expose new tables" disabled, grants may be needed.
-- These profiles are intentionally public-facing; RLS should still stay enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public officiant profiles" ON public.profiles;
CREATE POLICY "Anyone can view public officiant profiles"
  ON public.profiles FOR SELECT
  USING (public_profile_enabled = TRUE);

DROP POLICY IF EXISTS "Users can update own public profile fields" ON public.profiles;
CREATE POLICY "Users can update own public profile fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
