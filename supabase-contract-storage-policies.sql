-- Allow signed-in users to manage files in their own folder inside the contracts bucket.
-- The app uploads contract files to: contracts/{auth_user_id}/{timestamp}_{auth_user_id}.{ext}

INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

DROP POLICY IF EXISTS "Users can view own contract files" ON storage.objects;
CREATE POLICY "Users can view own contract files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can upload own contract files" ON storage.objects;
CREATE POLICY "Users can upload own contract files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own contract files" ON storage.objects;
CREATE POLICY "Users can update own contract files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own contract files" ON storage.objects;
CREATE POLICY "Users can delete own contract files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
