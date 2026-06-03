-- Private Mr. Script writing-style profiles for each officiant.
-- Uploaded script samples are analyzed into style metadata; full script text is not stored here.

CREATE TABLE IF NOT EXISTS public.officiant_script_style_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.officiant_script_style_samples (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  ceremony_type TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.officiant_script_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officiant_script_style_samples ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.officiant_script_style_profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.officiant_script_style_samples TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.officiant_script_style_samples_id_seq TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can view own script style profile" ON public.officiant_script_style_profiles;
CREATE POLICY "Users can view own script style profile"
  ON public.officiant_script_style_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own script style profile" ON public.officiant_script_style_profiles;
CREATE POLICY "Users can insert own script style profile"
  ON public.officiant_script_style_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own script style profile" ON public.officiant_script_style_profiles;
CREATE POLICY "Users can update own script style profile"
  ON public.officiant_script_style_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own script style profile" ON public.officiant_script_style_profiles;
CREATE POLICY "Users can delete own script style profile"
  ON public.officiant_script_style_profiles FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own script style samples" ON public.officiant_script_style_samples;
CREATE POLICY "Users can view own script style samples"
  ON public.officiant_script_style_samples FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own script style samples" ON public.officiant_script_style_samples;
CREATE POLICY "Users can insert own script style samples"
  ON public.officiant_script_style_samples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own script style samples" ON public.officiant_script_style_samples;
CREATE POLICY "Users can delete own script style samples"
  ON public.officiant_script_style_samples FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_script_style_samples_user_created
  ON public.officiant_script_style_samples(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_script_style_samples_user_type
  ON public.officiant_script_style_samples(user_id, ceremony_type);
