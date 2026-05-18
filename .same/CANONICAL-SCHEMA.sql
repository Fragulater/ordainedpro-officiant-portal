-- CANONICAL SCHEMA FOR ORDAINEDPRO OFFICIANT PORTAL
-- This schema matches the LIVE Supabase database exactly.
-- Last verified: May 18, 2026
-- Project ID: ailrvrxibpizbvyroonp

-- ============================================
-- PROFILES TABLE
-- Stores officiant and couple user profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  business_name TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  website TEXT,
  bio TEXT,
  headshot_url TEXT,
  years_experience INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  price_min INTEGER DEFAULT 300,
  price_max INTEGER DEFAULT 800,
  social_facebook TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_youtube TEXT,
  photo_gallery TEXT[],
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_type TEXT DEFAULT 'officiant',
  wedding_date DATE,
  partner_name TEXT,
  location TEXT,
  square_customer_id TEXT
);

-- ============================================
-- COUPLES TABLE
-- Contains couple info AND wedding details in one table
-- ============================================
CREATE TABLE IF NOT EXISTS couples (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bride_name TEXT NOT NULL,
  bride_email TEXT,
  bride_phone TEXT,
  bride_address TEXT,
  groom_name TEXT NOT NULL,
  groom_email TEXT,
  groom_phone TEXT,
  groom_address TEXT,
  address TEXT,
  emergency_contact TEXT,
  special_requests TEXT,
  is_active BOOLEAN DEFAULT true,
  colors JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Wedding details stored directly on couples table (not separate ceremonies table)
  venue_name TEXT,
  venue_address TEXT,
  wedding_date DATE,
  start_time TEXT,
  end_time TEXT,
  expected_guests INTEGER,
  notes TEXT
);

-- ============================================
-- MESSAGES TABLE
-- Communication between officiant and couples
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  body TEXT,
  recipient_email TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  attachments JSONB DEFAULT '[]'
);

-- ============================================
-- TASKS TABLE
-- Per-couple task management
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  details TEXT,
  due_date DATE,
  due_time TIME,
  priority TEXT DEFAULT 'medium',
  category TEXT,
  completed BOOLEAN DEFAULT false,
  email_reminder BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 1,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEETINGS TABLE
-- Note: Uses 'title' column, NOT 'subject'
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,  -- Database uses 'title', code maps to 'subject'
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  duration INTEGER DEFAULT 60,           -- Meeting duration in minutes
  meeting_type TEXT DEFAULT 'in-person', -- 'in-person', 'video', 'phone'
  status TEXT DEFAULT 'scheduled',       -- 'scheduled', 'confirmed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  notes TEXT,
  description TEXT,
  payment_type TEXT DEFAULT 'service',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  status TEXT DEFAULT 'draft',
  expiry_date TIMESTAMP,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- SCRIPTS TABLE
-- Ceremony scripts (per officiant, optionally per couple)
-- ============================================
CREATE TABLE IF NOT EXISTS scripts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id INTEGER REFERENCES couples(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Traditional',
  status TEXT NOT NULL DEFAULT 'Draft',
  content TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COUPLE_FILES TABLE
-- Files uploaded for couples
-- ============================================
CREATE TABLE IF NOT EXISTS couple_files (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- All tables filter by user_id = auth.uid()
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Couples policies
CREATE POLICY "Users can view own couples" ON couples FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own couples" ON couples FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own couples" ON couples FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own couples" ON couples FOR DELETE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (user_id = auth.uid());

-- Meetings policies
CREATE POLICY "Users can view own meetings" ON meetings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own meetings" ON meetings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own meetings" ON meetings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own meetings" ON meetings FOR DELETE USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (user_id = auth.uid());

-- Contracts policies
CREATE POLICY "Users can view own contracts" ON contracts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own contracts" ON contracts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own contracts" ON contracts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own contracts" ON contracts FOR DELETE USING (user_id = auth.uid());

-- Scripts policies
CREATE POLICY "Users can view own scripts" ON scripts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own scripts" ON scripts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own scripts" ON scripts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own scripts" ON scripts FOR DELETE USING (user_id = auth.uid());

-- Couple_files policies
CREATE POLICY "Users can view own files" ON couple_files FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own files" ON couple_files FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own files" ON couple_files FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own files" ON couple_files FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Storage bucket 'couple-files' exists and is public
-- Other buckets: contracts, documents, gallery, headshots, invoices, scripts, user-documents, videos
