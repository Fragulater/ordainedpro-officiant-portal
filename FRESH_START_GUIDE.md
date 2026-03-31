# 🚀 Fresh Start Deployment Guide - OrdainedPro Portal

**Starting from scratch - Complete step-by-step guide**

---

## ✅ What You Have

- ✅ GitHub repo created: `ordainedpro-officiant-portal`
- ✅ Clean slate - no old configs to worry about
- ✅ Code ready to deploy

---

## 📋 STEP 1: Create New Supabase Project (5 minutes)

### 1.1 Create Project

1. **Go to:** https://supabase.com
2. **Sign in** (or create account if you don't have one)
3. **Click:** "New Project"

### 1.2 Fill in Project Details

```
Organization: [Your organization or create new]
Name: ordained-pro-portal
Database Password: [Create a STRONG password - SAVE IT!]
Region: [Choose closest to you - e.g., "US East"]
Pricing Plan: Free
```

4. **Click:** "Create new project"
5. **Wait 2-3 minutes** for provisioning

---

## 📋 STEP 2: Get Supabase Credentials (2 minutes)

### 2.1 Navigate to API Settings

1. In your new Supabase project, click **Settings** (gear icon, bottom left)
2. Click **API** in the left sidebar

### 2.2 Copy These Values

You'll see:

**Project URL:**
```
https://[your-project-ref].supabase.co
```
📋 **COPY THIS** - You'll need it!

**API Keys Section:**

**anon/public key:** (starts with `eyJ...`)
```
eyJhbGc...
```
📋 **COPY THIS** - You'll need it!

**service_role key:** (starts with `eyJ...`)
⚠️ **SECRET - Never share publicly!**
```
eyJhbGc...
```
📋 **COPY THIS** - You'll need it!

### 2.3 Save Your Credentials

**Create a text file on your computer with:**
```
PROJECT_URL: https://xxxxx.supabase.co
ANON_KEY: eyJhbGc...
SERVICE_ROLE_KEY: eyJhbGc...
```

**Keep this safe!** You'll use these in multiple places.

---

## 📋 STEP 3: Create Database Tables (5 minutes)

### 3.1 Open SQL Editor

1. In Supabase dashboard, click **SQL Editor** (icon looks like `</>`)
2. Click **"+ New query"** button

### 3.2 Copy the SQL Schema

1. **In Same.new**, open the file: `ordained-pro-portal/supabase-schema.sql`
2. **Copy ALL of it** (from line 1 to the end - 389 lines)

### 3.3 Run the SQL

1. **Paste** into the Supabase SQL Editor
2. **Click the green "Run" button** (or press Ctrl+Enter)
3. **Wait ~5 seconds**
4. **Should see:** ✅ "Success. No rows returned"

### 3.4 Verify Tables Created

1. Click **Table Editor** in the left sidebar
2. **You should see 10 tables:**
   - ✅ profiles
   - ✅ couples
   - ✅ ceremonies
   - ✅ subscriptions
   - ✅ messages
   - ✅ payments
   - ✅ scripts
   - ✅ documents
   - ✅ tasks
   - ✅ meetings

**If you see all 10 tables** → Perfect! ✅

---

## 📋 STEP 4: Configure Supabase Authentication (3 minutes)

### 4.1 Enable Email Authentication

1. Click **Authentication** in the left sidebar
2. Click **Providers** tab
3. Find **Email** in the list
4. Make sure toggle is **ON** (enabled)
5. **Click "Save"** if you made changes

### 4.2 Configure URL Settings

1. Click **URL Configuration** (under Authentication section)

**Site URL:** (Enter this)
```
http://localhost:3000
```
(We'll update this after deploying)

**Redirect URLs:** (Add each line - click "Add URL" for each)
```
http://localhost:3000/**
https://*.netlify.app/**
https://app.ordainedpro.com/**
```

2. **Click "Save"**

### 4.3 Customize Email Templates (Optional but Recommended)

1. Click **Email Templates** (under Authentication)
2. Click **"Confirm signup"** template
3. Customize the email (or leave default for now)
4. **Click "Save"**

---

## 📋 STEP 5: Update Local Environment Variables (2 minutes)

### 5.1 Update `.env.local` File

**In Same.new:**

1. Open `ordained-pro-portal/.env.local`
2. **Replace with your NEW Supabase credentials:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
```

**Replace:**
- `YOUR-PROJECT-REF` with your actual project reference
- `your-anon-key` with your actual anon key
- `your-service-role-key` with your actual service role key

3. **Save the file**

---

## 📋 STEP 6: Test Locally (5 minutes)

### 6.1 Start Dev Server

**In Same.new terminal or your local terminal:**

```bash
cd ordained-pro-portal
bun install  # Install dependencies
bun run dev  # Start dev server
```

### 6.2 Test the App

1. **Visit:** http://localhost:3000
2. **Should redirect to:** http://localhost:3000/login
3. **Try to create an account:**
   - Click "Sign up"
   - Enter your email and password
   - Click "Create Account"
4. **Check your email** for verification link
5. **Click the verification link**
6. **Login** with your credentials
7. **Should see the Communication Portal!** 🎉

**If everything works locally** → Ready to deploy! ✅

---

## 📋 STEP 7: Push Code to GitHub (3 minutes)

### 7.1 Initialize Git (if not already)

```bash
cd ordained-pro-portal
git init
```

### 7.2 Add All Files

```bash
git add .
git commit -m "Initial commit - OrdainedPro Officiant Portal"
```

### 7.3 Connect to GitHub

**Replace `YOUR-USERNAME` with your actual GitHub username:**

```bash
git remote add origin https://github.com/YOUR-USERNAME/ordainedpro-officiant-portal.git
git branch -M main
git push -u origin main
```

### 7.4 Verify Upload

1. **Go to:** https://github.com/YOUR-USERNAME/ordainedpro-officiant-portal
2. **Should see all your files!** ✅

---

## 📋 STEP 8: Deploy to Netlify via GitHub (5 minutes)

### 8.1 Connect GitHub to Netlify

1. **Go to:** https://app.netlify.com
2. **Click:** "Add new site" → "Import an existing project"
3. **Click:** "Deploy with GitHub"
4. **Authorize Netlify** (if asked)
5. **Select repository:** `ordainedpro-officiant-portal`

### 8.2 Configure Build Settings

**You'll see a configuration screen:**

```
Branch to deploy: main
Base directory: [leave empty]
Build command: npm run build
Publish directory: .next
```

**Leave everything as-is** - these are correct!

### 8.3 Add Environment Variables (IMPORTANT!)

**Before clicking "Deploy site":**

1. **Click "Show advanced"** or **"Add environment variables"**
2. **Click "New variable"** and add each one:

**Variable 1:**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://YOUR-PROJECT-REF.supabase.co
```

**Variable 2:**
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc...your-anon-key...
```

**Variable 3:**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGc...your-service-role-key...
```

**Use the SAME values from Step 2!**

3. **After adding all 3 variables**, click **"Deploy site"**

### 8.4 Wait for Deployment

- **Build time:** ~3-5 minutes
- **Watch the deploy logs** (you can click on the deploy to see progress)
- **Wait for:** ✅ "Published" status

### 8.5 Get Your Site URL

**Netlify will give you a URL like:**
```
https://wonderful-cupcake-123abc.netlify.app
```

**Copy this URL!** 📋

---

## 📋 STEP 9: Update Supabase with Netlify URL (2 minutes)

### 9.1 Update Site URL

1. **Back in Supabase** → Authentication → URL Configuration
2. **Update "Site URL"** to your Netlify URL:
   ```
   https://wonderful-cupcake-123abc.netlify.app
   ```

### 9.2 Verify Redirect URLs

Make sure these are in the **Redirect URLs** list:
```
https://wonderful-cupcake-123abc.netlify.app/**
https://*.netlify.app/**
https://app.ordainedpro.com/**
http://localhost:3000/**
```

3. **Click "Save"**

---

## 📋 STEP 10: Test Your Live Site! (3 minutes)

### 10.1 Visit Your Site

**Go to:** Your Netlify URL (e.g., `https://wonderful-cupcake-123abc.netlify.app`)

### 10.2 Test Authentication

1. **Should redirect to:** `/login`
2. **Create a new account** (use a different email than local testing)
3. **Check your email** for verification
4. **Click verification link** - should redirect back to your Netlify site
5. **Login** with your credentials
6. **Should see the Communication Portal!** 🎉

**If everything works** → Congratulations! Your app is live! 🚀

---

## 📋 STEP 11: Add to WordPress (5 minutes)

### 11.1 Create Login Button

**Edit any WordPress page (in HTML mode) and add:**

```html
<div style="text-align: center; margin: 50px 0;">
  <a href="https://YOUR-NETLIFY-URL.netlify.app/login"
     style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            padding: 20px 50px;
            border-radius: 15px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            font-size: 20px;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            transition: transform 0.2s;"
     onmouseover="this.style.transform='translateY(-2px)'"
     onmouseout="this.style.transform='translateY(0)'">
    🔐 Access Your Officiant Portal
  </a>
  <p style="margin-top: 20px; color: #666; font-size: 16px;">
    Login to manage your ceremonies, scripts, and communications
  </p>
</div>
```

**Replace `YOUR-NETLIFY-URL` with your actual URL!**

### 11.2 Or Add to Menu

1. **WordPress Admin** → Appearance → Menus
2. **Custom Links** section:
   - URL: `https://YOUR-NETLIFY-URL.netlify.app/login`
   - Link Text: `Officiant Portal`
3. **Add to Menu**
4. **Save Menu**

---

## 📋 STEP 12: Set Up Custom Domain (Optional - 10 minutes)

### 12.1 In Netlify

1. **Site settings** → **Domain management**
2. **Add custom domain:** `app.ordainedpro.com`
3. **Netlify will show DNS instructions**

### 12.2 In Bluehost

1. **Login to Bluehost**
2. **Domains** → **Zone Editor**
3. **Find:** `ordainedpro.com`
4. **Add CNAME Record:**
   ```
   Type: CNAME
   Name: app
   Points to: YOUR-SITE.netlify.app
   TTL: 14400 (or Automatic)
   ```
5. **Save**

### 12.3 Wait for DNS

- **Propagation time:** 10 minutes to 48 hours (usually ~1 hour)
- **Netlify will auto-provision SSL certificate**

### 12.4 Update Supabase Again

Once `app.ordainedpro.com` works:

1. **Supabase** → Authentication → URL Configuration
2. **Update Site URL to:** `https://app.ordainedpro.com`
3. **Save**

### 12.5 Update WordPress Button

Replace Netlify URL with:
```html
https://app.ordainedpro.com/login
```

---

## ✅ Final Checklist

**Supabase:**
- [ ] Project created
- [ ] Got API credentials (saved safely)
- [ ] SQL schema executed (10 tables created)
- [ ] Email authentication enabled
- [ ] Redirect URLs configured

**GitHub:**
- [ ] Repository created: `ordainedpro-officiant-portal`
- [ ] Code pushed to GitHub

**Netlify:**
- [ ] Site deployed from GitHub
- [ ] Environment variables added (all 3)
- [ ] Site published successfully
- [ ] Got live URL

**Testing:**
- [ ] Local dev server works
- [ ] Can create account locally
- [ ] Email verification works
- [ ] Can login and access portal
- [ ] Live site works same as local
- [ ] Live email verification works

**WordPress:**
- [ ] Login button added
- [ ] Button links to correct URL
- [ ] Button works when clicked

**Optional:**
- [ ] Custom domain set up (`app.ordainedpro.com`)
- [ ] DNS propagated
- [ ] SSL certificate active
- [ ] Supabase updated with custom domain

---

## 🎉 You're Done!

Your complete stack:

```
ordainedpro.com (WordPress on Bluehost)
     ↓ [Login Button]
app.ordainedpro.com (Next.js Portal on Netlify)
     ↓ [Supabase Auth]
Supabase Database (Cloud PostgreSQL)
```

**Features working:**
✅ User authentication (signup/login/password reset)
✅ Communication portal
✅ Ceremony management
✅ Script builder
✅ Payment tracking
✅ Cloud database with automatic backups
✅ Secure with Row Level Security
✅ Free tier (0 cost to start!)

---

## 📞 Troubleshooting

### Issue: Build fails on Netlify
- Check environment variables are set
- Check build command is `npm run build`
- Check publish directory is `.next`
- Look at deploy logs for specific error

### Issue: Email verification not working
- Check Supabase redirect URLs include your site
- Check email provider (Gmail, etc.) - might be in spam
- Verify email is enabled in Supabase Auth settings

### Issue: "Page not found" on Netlify
- Check publish directory is `.next` (not `out`)
- Check environment variables are set
- Trigger a new deploy after adding variables

### Issue: Can't login
- Check environment variables in Netlify match Supabase
- Open browser console (F12) for error messages
- Verify Supabase project is active

---

## 🚀 Next Steps

1. **Test thoroughly** with multiple test accounts
2. **Invite a real user** to test the workflow
3. **Monitor** Supabase and Netlify dashboards
4. **Set up custom domain** when ready
5. **Start using** the portal for real ceremonies!

---

**Need help?** Check the error messages and:
- Browser console (F12)
- Netlify deploy logs
- Supabase logs (Database → Logs)

**Good luck! You've got a professional, production-ready app!** 🎉
