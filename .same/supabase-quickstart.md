# Supabase Quick Start - 5 Minutes Setup

## What's Been Done ✅

I've already set up the Supabase integration for you:

1. ✅ Supabase client library installed (`@supabase/supabase-js`)
2. ✅ TypeScript types created for all database tables
3. ✅ API service layer created with functions for all operations
4. ✅ SubscriptionContext updated to use Supabase
5. ✅ Environment variables template created

## What You Need to Do 🎯

### Quick Setup (5 minutes)

1. **Create Supabase Account**
   - Go to https://supabase.com
   - Sign up (free tier is perfect to start)
   - Create a new project called "ordained-pro-portal"

2. **Get Your API Keys**
   - In Supabase dashboard → Settings → API
   - Copy:
     - Project URL
     - anon/public key
     - service_role key

3. **Update `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key
   ```

4. **Create Database Tables**
   - In Supabase dashboard → SQL Editor
   - Create new query
   - Copy the entire SQL from `.same/supabase-setup.md`
   - Run it!

5. **Restart Dev Server**
   ```bash
   # Stop the current dev server (Ctrl+C)
   # Start it again
   bun run dev
   ```

That's it! Your app is now running on Supabase! 🎉

## What Changes for You

### Before (Mock Data)
- All ceremony data stored in browser localStorage
- Lost when clearing browser data
- Can't sync across devices

### After (Supabase)
- All data stored in cloud database
- Persists across sessions and devices
- Real-time updates
- Secure with Row Level Security
- Ready for production

## Testing It Works

1. Open browser console
2. Look for: `✅ Loaded subscription from Supabase`
3. Add a new ceremony
4. Check Supabase dashboard → Table Editor → couples table
5. You should see your data there!

## Files Created

1. `src/lib/supabase.ts` - Supabase client configuration
2. `src/types/supabase.ts` - TypeScript database types
3. `src/services/supabase-api.ts` - API functions for all operations
4. `.same/supabase-setup.md` - Complete SQL schema and documentation

## Next Steps

Once Supabase is set up, you can:

1. **Add Authentication**
   - Enable email/password auth in Supabase
   - Add Google/Facebook login
   - Protect routes with auth

2. **Enable File Storage**
   - Upload ceremony documents
   - Store script files
   - Save profile photos

3. **Real-time Features**
   - Live message updates
   - Instant payment notifications
   - Collaborative editing

4. **Deploy to Production**
   - All Supabase features work in production
   - No additional backend server needed
   - Just deploy your Next.js app!

## Cost

**Free Tier Includes:**
- 500MB database (plenty for hundreds of ceremonies)
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

Perfect for getting started! Upgrade to $25/month Pro plan when you grow.

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check `.same/supabase-setup.md` for detailed setup

## Development Without Supabase

If you haven't set up Supabase yet, the app will:
- Show a warning in console: `⚠️ Supabase not configured`
- Use default Aspirant subscription
- Continue working with localStorage for now

No errors, just a fallback mode!
