# Marketplace Deployment & Integration Guide

## 📋 Overview

This guide walks you through deploying your marketplace project and integrating it with the Officiant Portal for real-time script synchronization.

---

## 🎯 Marketplace Current State

Your marketplace project is **LIVE and RUNNING** on preview! ✅

**Preview URL:** `https://3000-loeocbplxsodhjfbzatcyyksahayytin.preview.same-app.com`

**Current Features:**
- ✅ Script browsing with categories (Christian, Catholic, Jewish, Muslim, Hindu, etc.)
- ✅ Multi-language support (English, Spanish, Punjabi, Hindi, French, Chinese)
- ✅ Advanced filtering (price range, ratings, languages)
- ✅ Featured authors section
- ✅ Script cards with pricing ($19.99 - $39.99)
- ✅ Reviews and ratings system
- ✅ Shopping cart functionality
- ✅ Signup/Login interface

**What the marketplace needs:**
- Verify it's using the **same Supabase database** as the portal
- Deploy to get a permanent URL (not preview)
- Ensure `user_files` table queries for published scripts

---

## ✅ Step 1: Portal Preparation (COMPLETE)

Your officiant portal is ready for marketplace integration:

- ✓ Marketplace tab added to Scripts section
- ✓ "Browse Marketplace" button configured
- ✓ Environment variable `NEXT_PUBLIC_MARKETPLACE_URL` set to preview URL
- ✓ Portal sharing Supabase credentials for real-time sync

**Current Portal Version:** 305

---

## 🚀 Step 2: Deploy Marketplace Project

### 2.1 Open Your Marketplace Project

1. Open a new tab/window in Same.new
2. Navigate to your marketplace project URL
3. Or find it in your Same.new projects dashboard

### 2.2 Verify Supabase Credentials ⚠️ CRITICAL

The marketplace **MUST** use the exact same Supabase credentials as the portal for real-time sync:

**Check marketplace `.env.local` or environment configuration:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://ailrvrxibpizbvyroonp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJ2cnhpYnBpemJ2eXJvb25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg3OTQsImV4cCI6MjA3NzU5NDc5NH0.p12BTatmPgMoUCQZMg04YXJsgMbAe87DhB9CNbVTMsk
```

**⚠️ CRITICAL:** Both projects must point to the same Supabase database!

**Expected marketplace database queries:**
- Should query `user_files` table where `is_published = true`
- Should filter by `file_type = 'script'` or similar
- Should display `price`, `file_name`, author info, ratings
- Should allow browsing without authentication (open to all users)

### 2.3 Deploy the Marketplace

1. In the marketplace project, create a version to capture current state
2. Run the deploy command or use the Same.new deploy button
3. Choose deployment type:
   - **Static deployment** (faster) if marketplace is purely frontend
   - **Dynamic deployment** if marketplace has API routes or backend

4. Copy the deployed marketplace URL (e.g., `https://your-marketplace.netlify.app`)

### 2.4 Update Portal Environment

Come back to this portal project and update `.env.local`:

```env
NEXT_PUBLIC_MARKETPLACE_URL=https://your-deployed-marketplace.netlify.app
```

Replace the preview URL with your deployed marketplace URL.

**Then restart the portal dev server:**
```bash
cd ordainedpro-officiant-portal
bun run dev
```

---

## 🔄 Step 3: Test Real-Time Sync

### 3.1 Verify Database Table

Both projects should use the same `user_files` table in Supabase:

**Table:** `user_files`

**Key columns:**
- `id` - unique identifier
- `user_id` - creator's Supabase auth user ID
- `file_name` - script title/name
- `file_url` - storage URL or content
- `file_type` - e.g., "script", "ceremony_script"
- `is_published` - boolean (published to marketplace)
- `price` - decimal (price for marketplace scripts)
- `created_at` - timestamp
- `updated_at` - timestamp

### 3.2 Test Script Publishing

1. **In Portal:** Go to Scripts tab
2. Upload or create a new wedding script
3. Set a price (e.g., $10)
4. Click "Publish to Marketplace"
5. **In Marketplace:** Refresh and verify script appears in browse view

### 3.3 Test Marketplace Browsing

1. **In Portal:** Click "Browse Marketplace" button
2. Verify it opens the deployed marketplace URL
3. Confirm all published scripts are visible
4. Test script purchase/download flow (if implemented)

---

## 🎯 Integration Checklist

Use this checklist to ensure complete integration:

- [ ] Marketplace project opened in Same.new
- [ ] Marketplace `.env.local` has correct Supabase credentials
- [ ] Marketplace uses same `user_files` table structure
- [ ] Marketplace deployed successfully
- [ ] Portal `.env.local` updated with deployed marketplace URL
- [ ] Portal restarted to pick up new environment variable
- [ ] "Browse Marketplace" button opens deployed marketplace
- [ ] Script published in portal appears in marketplace
- [ ] Marketplace shows all published scripts in real-time
- [ ] Purchase/download flow works (if applicable)

---

## 🔧 Troubleshooting

### Issue: Scripts don't appear in marketplace

**Solutions:**
1. Verify both projects use the same Supabase URL and anon key
2. Check `is_published` column is set to `true` in database
3. Ensure marketplace filters/queries include published scripts
4. Check browser console for errors

### Issue: "Marketplace URL not configured" alert

**Solutions:**
1. Verify `.env.local` has `NEXT_PUBLIC_MARKETPLACE_URL` set
2. Restart the dev server after updating `.env.local`
3. Clear browser cache and reload

### Issue: Marketplace shows 404 or doesn't load

**Solutions:**
1. Verify deployment was successful
2. Check deployment URL is correct (no trailing slash issues)
3. Ensure marketplace build completed without errors
4. Check Netlify deployment logs for issues

---

## 📞 Need Help?

If you encounter issues during deployment or integration:

1. Check the dev server logs in both projects
2. Verify Supabase database connection in both projects
3. Test each project independently before integration
4. Contact Same support at support@same.new if deployment fails

---

## ✨ Success Indicators

You'll know the integration is successful when:

1. ✅ "Browse Marketplace" button opens deployed marketplace
2. ✅ Scripts published in portal appear instantly in marketplace
3. ✅ Marketplace displays all published scripts with prices
4. ✅ Users can browse marketplace without portal login
5. ✅ Real-time updates work (publish → appears immediately)

---

**Current Status:** Portal ready, awaiting marketplace deployment.

**Next Action:** Open marketplace project in Same.new and follow Section 2 above.
