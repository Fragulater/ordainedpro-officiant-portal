# Supabase Setup Guide for OrdainedPro

## Overview
This guide will help you set up Supabase as the backend for your OrdainedPro officiant portal.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: ordained-pro-portal
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on **Settings** (gear icon)
2. Click on **API** in the sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Configure Environment Variables

Update your `.env.local` file with the values from Step 2:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

## Step 4: Create Database Schema

In your Supabase project dashboard:

1. Click on **SQL Editor** in the sidebar
2. Click **New query**
3. Copy and paste the SQL schema below
4. Click **Run** to execute

### Database Schema SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  rating DECIMAL(2,1) DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  price_min INTEGER DEFAULT 300,
  price_max INTEGER DEFAULT 800,
  social_facebook TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_youtube TEXT,
  photo_gallery TEXT[],
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Couples table
CREATE TABLE couples (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ceremonies table
CREATE TABLE ceremonies (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_name TEXT,
  venue_address TEXT,
  wedding_date DATE,
  start_time TIME,
  end_time TIME,
  expected_guests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(couple_id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'aspirant' CHECK (tier IN ('aspirant', 'professional')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table
CREATE TABLE scripts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings table
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_couples_user_id ON couples(user_id);
CREATE INDEX idx_ceremonies_couple_id ON ceremonies(couple_id);
CREATE INDEX idx_messages_couple_id ON messages(couple_id);
CREATE INDEX idx_payments_couple_id ON payments(couple_id);
CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceremonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can read and update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Couples: Users can CRUD their own couples
CREATE POLICY "Users can view their own couples"
  ON couples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own couples"
  ON couples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own couples"
  ON couples FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own couples"
  ON couples FOR DELETE
  USING (auth.uid() = user_id);

-- Ceremonies: Users can CRUD their own ceremonies
CREATE POLICY "Users can view their own ceremonies"
  ON ceremonies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ceremonies"
  ON ceremonies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ceremonies"
  ON ceremonies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ceremonies"
  ON ceremonies FOR DELETE
  USING (auth.uid() = user_id);

-- Subscriptions: Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: Users can CRUD messages for their couples
CREATE POLICY "Users can view messages for their couples"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages for their couples"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Payments: Users can CRUD payments for their couples
CREATE POLICY "Users can view payments for their couples"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert payments for their couples"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update payments for their couples"
  ON payments FOR UPDATE
  USING (auth.uid() = user_id);

-- Scripts: Users can CRUD their own scripts
CREATE POLICY "Users can view their own scripts"
  ON scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts"
  ON scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
  ON scripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts"
  ON scripts FOR DELETE
  USING (auth.uid() = user_id);

-- Documents, Tasks, Meetings: Similar policies
CREATE POLICY "Users can view documents for their couples"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert documents for their couples"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view tasks for their couples"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert tasks for their couples"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update tasks for their couples"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete tasks for their couples"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view meetings for their couples"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert meetings for their couples"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update meetings for their couples"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete meetings for their couples"
  ON meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON couples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ceremonies_updated_at BEFORE UPDATE ON ceremonies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Set Up Authentication (Optional)

For now, you can work in development mode without authentication. When ready to add user auth:

1. Go to **Authentication** > **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates as needed
4. Later, you can add OAuth providers (Google, Facebook, etc.)

## Step 6: Test the Connection

1. Restart your dev server
2. Open the browser console
3. Look for Supabase connection messages
4. The app will automatically detect if Supabase is configured

## Step 7: Migrate Data (Optional)

If you have existing data, you can:
1. Export from WordPress/current backend
2. Use Supabase SQL Editor to import
3. Or manually re-create ceremonies in the new system

## Features Enabled

With Supabase configured, you'll have:

✅ Real-time database for all ceremony data
✅ Secure Row Level Security (RLS) policies
✅ Automatic timestamps and data validation
✅ Built-in authentication (when enabled)
✅ File storage for documents (via Supabase Storage)
✅ Realtime subscriptions for live updates

## Next Steps

1. Configure your environment variables
2. Run the SQL schema
3. Restart your dev server
4. Start adding ceremonies!

## Troubleshooting

**Issue**: "Supabase not configured" warning
- **Solution**: Check that your `.env.local` has the correct values and restart dev server

**Issue**: Database errors
- **Solution**: Make sure you ran the entire SQL schema in the SQL Editor

**Issue**: RLS policy errors
- **Solution**: For development, you can temporarily disable RLS on tables, but re-enable before production

## Production Checklist

Before deploying to production:
- [ ] Enable authentication
- [ ] Verify all RLS policies are active
- [ ] Set up backups in Supabase dashboard
- [ ] Configure Stripe webhooks for subscriptions
- [ ] Add monitoring and error tracking
- [ ] Test subscription upgrade/downgrade flows

## Cost Estimates

**Free Tier includes**:
- 500MB database
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

**Pro Plan** ($25/month):
- 8GB database
- 100GB file storage
- 50GB bandwidth
- 100,000 monthly active users

For OrdainedPro, the Free tier should work well initially!
