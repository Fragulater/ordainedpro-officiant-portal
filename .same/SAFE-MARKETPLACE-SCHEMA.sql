-- ================================================================
-- SAFE MARKETPLACE SCHEMA FOR EXISTING OFFICIANT PORTAL DATABASE
-- ================================================================
-- This SQL is SAFE to run - it won't break your portal!
-- It adds marketplace features while preserving portal functionality
-- ================================================================

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- STEP 1: EXTEND EXISTING PROFILES TABLE (NOT RECREATE!)
-- ================================================================
-- Add marketplace-specific columns to your existing profiles table

-- Add user_type column for marketplace (officiant, professional-writer, guest)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'officiant'
CHECK (user_type IN ('professional-writer', 'officiant', 'guest'));

-- Add wedding_date for guest users planning weddings
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wedding_date DATE;

-- Add partner name for guest users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Add location convenience field (combines city + state)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location TEXT;

-- Update location field from existing city/state data
UPDATE public.profiles
SET location = CONCAT(city, ', ', state)
WHERE location IS NULL AND city IS NOT NULL AND state IS NOT NULL;

-- ================================================================
-- STEP 2: CREATE MARKETPLACE-SPECIFIC TABLES (NEW TABLES ONLY)
-- ================================================================

-- Purchases table - tracks who bought which scripts
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id INTEGER NOT NULL, -- References user_files.id (your existing scripts table)
  amount_paid DECIMAL(10, 2), -- How much they paid
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, script_id) -- Prevent duplicate purchases
);

-- Favorites table - tracks favorite scripts
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id INTEGER NOT NULL, -- References user_files.id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, script_id) -- Prevent duplicate favorites
);

-- Cart table - for marketplace shopping cart
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id INTEGER NOT NULL, -- References user_files.id
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, script_id) -- One item per script in cart
);

-- Reviews table - for marketplace script reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id INTEGER NOT NULL, -- References user_files.id
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, script_id) -- One review per user per script
);

-- ================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 4: CREATE POLICIES FOR MARKETPLACE TABLES
-- ================================================================

-- Purchases policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;
CREATE POLICY "Users can insert their own purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
CREATE POLICY "Users can insert their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Cart policies
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart;
CREATE POLICY "Users can view their own cart"
  ON public.cart FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their own cart" ON public.cart;
CREATE POLICY "Users can insert into their own cart"
  ON public.cart FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their own cart" ON public.cart;
CREATE POLICY "Users can delete from their own cart"
  ON public.cart FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews policies
DROP POLICY IF EXISTS "Everyone can view reviews" ON public.reviews;
CREATE POLICY "Everyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- STEP 5: UPDATE EXISTING user_files TABLE FOR MARKETPLACE
-- ================================================================
-- Your portal uses user_files for scripts - let's make sure it works for marketplace too

-- Add marketplace-friendly columns if they don't exist
ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Wedding';

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS preview_content TEXT;

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0;

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Add description if it doesn't exist (might already have it)
ALTER TABLE public.user_files
ADD COLUMN IF NOT EXISTS description TEXT;

-- ================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- ================================================================

-- Function to update script rating when reviews change
CREATE OR REPLACE FUNCTION public.update_script_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_files
  SET
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM public.reviews WHERE script_id = NEW.script_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE script_id = NEW.script_id)
  WHERE id = NEW.script_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update rating when review is added
DROP TRIGGER IF EXISTS update_rating_on_review ON public.reviews;
CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_script_rating();

-- Function to handle new user profiles (updated for marketplace)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, user_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'user_type', 'guest')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- STEP 7: CREATE VIEWS FOR MARKETPLACE (OPTIONAL)
-- ================================================================

-- View for marketplace scripts (maps user_files to marketplace format)
-- OPTIONAL: Only create this if you want a dedicated view.
-- Skip this section if it causes errors - the marketplace can query user_files directly.
-- Uncomment the lines below if your user_files table has these exact column names:

/*
CREATE OR REPLACE VIEW public.marketplace_scripts AS
SELECT
  uf.id,
  uf.file_name as title,  -- Or whatever your title column is called
  uf.description,
  uf.price,
  COALESCE(uf.rating, 0) as rating,
  COALESCE(uf.review_count, 0) as reviews,
  COALESCE(uf.category, 'Wedding') as category,
  uf.file_type as type,
  COALESCE(uf.language, 'English') as language,
  COALESCE(p.full_name, 'Anonymous') as author,
  COALESCE(uf.tags, ARRAY[]::TEXT[]) as tags,
  uf.preview_content,
  uf.file_url,
  COALESCE(uf.is_popular, false) as is_popular,
  COALESCE(uf.is_published, false) as is_published,
  uf.created_at,
  uf.updated_at
FROM public.user_files uf
LEFT JOIN public.profiles p ON uf.user_id = p.user_id
WHERE COALESCE(uf.is_published, false) = true;
*/

-- The marketplace doesn't need this view - it can query user_files directly!

-- ================================================================
-- DONE! ✅
-- ================================================================
-- This schema is now compatible with BOTH:
-- 1. Your existing officiant portal (profiles, user_files, ceremonies, etc.)
-- 2. The new marketplace (purchases, favorites, cart, reviews)
--
-- Scripts are stored in user_files table (shared between both)
-- When portal publishes a script → it appears in marketplace
-- When marketplace shows scripts → it reads from user_files
-- ================================================================
