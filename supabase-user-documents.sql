-- Server-backed "My Documents" library for files saved from the portal.
-- Run once in the Supabase SQL Editor if the user_files table or user-documents bucket is missing.

CREATE TABLE IF NOT EXISTS public.user_files (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_files
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS size BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_files TO authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relkind = 'S'
      AND relname = 'user_files_id_seq'
  ) THEN
    GRANT USAGE, SELECT ON SEQUENCE public.user_files_id_seq TO authenticated, service_role;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own files" ON public.user_files;
CREATE POLICY "Users can view own files"
  ON public.user_files FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own files" ON public.user_files;
CREATE POLICY "Users can insert own files"
  ON public.user_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own files" ON public.user_files;
CREATE POLICY "Users can update own files"
  ON public.user_files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own files" ON public.user_files;
CREATE POLICY "Users can delete own files"
  ON public.user_files FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_files_user_created
  ON public.user_files(user_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "Users can view own user documents" ON storage.objects;
CREATE POLICY "Users can view own user documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can upload own user documents" ON storage.objects;
CREATE POLICY "Users can upload own user documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own user documents" ON storage.objects;
CREATE POLICY "Users can update own user documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own user documents" ON storage.objects;
CREATE POLICY "Users can delete own user documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
