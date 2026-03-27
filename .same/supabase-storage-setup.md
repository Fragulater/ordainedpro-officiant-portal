# Supabase Storage Setup Guide

## 📋 Overview

This guide will help you set up Supabase Storage to enable photo and video uploads in your Officiant Portal. Currently, uploads are failing because the storage buckets and policies need to be configured in Supabase.

---

## 🔧 Required Storage Buckets

Your portal needs **3 storage buckets** for file uploads:

1. **`headshots`** - For officiant profile photos
2. **`gallery`** - For officiant photo galleries
3. **`videos`** - For officiant introduction videos

---

## ✅ Step 1: Create Storage Buckets

### 1.1 Open Supabase Dashboard

1. Go to https://supabase.com
2. Sign in to your account
3. Open your project: `ailrvrxibpizbvyroonp`

### 1.2 Navigate to Storage

1. In the left sidebar, click **Storage**
2. You'll see a list of buckets (if any exist)

### 1.3 Create Each Bucket

For **each bucket** (headshots, gallery, videos):

1. Click **"New bucket"** button
2. Fill in the details:
   - **Name**: `headshots` (or `gallery`, `videos`)
   - **Public bucket**: ✅ **YES** (check this box)
   - **Allowed MIME types**: Leave empty (allow all) or specify:
     - For headshots/gallery: `image/*`
     - For videos: `video/*`
   - **File size limit**:
     - For headshots/gallery: `10 MB`
     - For videos: `200 MB`
3. Click **"Create bucket"**

Repeat this for all 3 buckets.

---

## 🔐 Step 2: Configure Storage Policies (RLS)

By default, Supabase Storage has Row Level Security (RLS) enabled. You need to create policies to allow uploads.

### 2.1 Navigate to Policies

1. In Supabase Dashboard, go to **Storage**
2. Click on one of your buckets (e.g., `headshots`)
3. Click the **"Policies"** tab at the top

### 2.2 Create Upload Policy

For **each bucket**, create a policy to allow authenticated users to upload:

1. Click **"New Policy"**
2. Choose **"For full customization"** (or create from template)
3. Fill in:
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: ✅ **INSERT**
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     true
     ```
   - **WITH CHECK expression**:
     ```sql
     (bucket_id = 'headshots'::text AND auth.role() = 'authenticated'::text)
     ```
     (Replace `headshots` with the actual bucket name)
4. Click **"Save policy"**

### 2.3 Create Read Policy (for public access)

Create a policy to allow everyone to view uploaded files:

1. Click **"New Policy"**
2. Fill in:
   - **Policy name**: `Allow public reads`
   - **Allowed operation**: ✅ **SELECT**
   - **Target roles**: `public`, `authenticated`
   - **USING expression**:
     ```sql
     true
     ```
3. Click **"Save policy"**

### 2.4 Create Update/Delete Policies (optional)

If users need to update or delete their own files:

1. **Update Policy**:
   - **Policy name**: `Allow users to update own files`
   - **Allowed operation**: ✅ **UPDATE**
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (bucket_id = 'headshots'::text AND (storage.foldername(name))[1] = auth.uid()::text)
     ```

2. **Delete Policy**:
   - **Policy name**: `Allow users to delete own files`
   - **Allowed operation**: ✅ **DELETE**
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (bucket_id = 'headshots'::text AND (storage.foldername(name))[1] = auth.uid()::text)
     ```

Repeat for all 3 buckets.

---

## 🧪 Step 3: Test the Upload

After setting up the buckets and policies:

1. **Restart your portal dev server**:
   ```bash
   cd ordainedpro-officiant-portal
   # Press Ctrl+C to stop the server
   bun run dev
   ```

2. **Login to the portal**

3. **Go to Officiant Dashboard → My Profile**

4. **Try uploading**:
   - Profile headshot (click camera icon)
   - Gallery photos (click "Add Photos")
   - Introduction video (click "Upload Video")

5. **Check the browser console** (F12) for detailed error messages if uploads fail

---

## 🔍 Step 4: Verify Storage in Supabase

After a successful upload:

1. Go to **Supabase Dashboard → Storage**
2. Click on the bucket (e.g., `headshots`)
3. You should see a folder named with your user ID
4. Inside, you'll see the uploaded files
5. Click on a file to get its public URL

---

## ⚡ Quick SQL Setup (Alternative)

If you prefer, you can run this SQL to create all policies at once:

### In Supabase SQL Editor:

```sql
-- Policies for headshots bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'headshots');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public, authenticated
  USING (bucket_id = 'headshots');

CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'headshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'headshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policies for gallery bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public, authenticated
  USING (bucket_id = 'gallery');

CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policies for videos bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public, authenticated
  USING (bucket_id = 'videos');

CREATE POLICY "Allow users to update own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 🐛 Troubleshooting

### Upload still fails after setup?

1. **Check browser console** (F12 → Console tab)
   - Look for the actual error message
   - The portal now shows detailed error messages

2. **Verify bucket exists**:
   - Go to Supabase Dashboard → Storage
   - Make sure `headshots`, `gallery`, and `videos` buckets exist

3. **Verify policies are enabled**:
   - Click on each bucket → Policies tab
   - Make sure policies are listed and enabled

4. **Check file size**:
   - Images must be under 10MB
   - Videos must be under 200MB

5. **Check file type**:
   - Images: JPG, PNG, GIF, WEBP, etc.
   - Videos: MP4, MOV, AVI, etc.

6. **Check authentication**:
   - Make sure you're logged in to the portal
   - Check that `user.id` exists in the console

7. **Check Storage quota**:
   - Free tier: 1GB storage
   - Make sure you haven't exceeded the limit

---

## ✅ Success Indicators

You'll know storage is working when:

1. ✅ Upload button shows "Uploading..." during upload
2. ✅ Success message appears: "Headshot uploaded successfully!"
3. ✅ Image/video appears immediately in the UI
4. ✅ Browser console shows: "✅ Uploaded [filename]: [public URL]"
5. ✅ File appears in Supabase Dashboard → Storage → [bucket]
6. ✅ After clicking "Save Profile", data persists after page reload

---

## 📝 Code Changes Made

The portal code has been updated to:

1. ✅ **Remove localStorage usage** - No more local storage for profile data
2. ✅ **Load profile from Supabase** - Fetches profile on dashboard open
3. ✅ **Save profile to Supabase** - Saves to `profiles` table
4. ✅ **Upload files to Supabase Storage** - Uses storage buckets
5. ✅ **Better error messages** - Shows actual error details
6. ✅ **File validation** - Checks file type and size before upload
7. ✅ **Auto-create buckets** - Creates buckets if they don't exist (requires permissions)

---

## 🎯 Next Steps

After setting up storage:

1. ✅ Test uploads (headshot, gallery, video)
2. ✅ Click "Save Profile" to save to Supabase
3. ✅ Reload page and verify data persists
4. ✅ Check files in Supabase Storage dashboard
5. 🚀 Continue with marketplace deployment!

---

**Need help?** Check the browser console for detailed error messages, or ask in the chat!
