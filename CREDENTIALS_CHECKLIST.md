# 📋 Credentials Checklist - Keep This Handy!

**Save this information as you collect it:**

---

## 🔵 Supabase Credentials

### From: https://supabase.com → Your Project → Settings → API

```
✅ Project URL:
https://_____________________________.supabase.co

✅ Anon/Public Key:
eyJhbGc_________________________________________________
_________________________________________________________
_________________________________________________________

✅ Service Role Key (SECRET!):
eyJhbGc_________________________________________________
_________________________________________________________
_________________________________________________________
```

---

## 🟢 GitHub Repository

```
✅ Repository Name:
ordainedpro-officiant-portal

✅ Repository URL:
https://github.com/_____________/ordainedpro-officiant-portal
```

---

## 🟣 Netlify Site

### From: https://app.netlify.com → Your Site

```
✅ Site Name:
_______________________________

✅ Site URL:
https://_____________________________.netlify.app

✅ Site ID (if needed):
_______________________________
```

---

## 🔴 Custom Domain (Optional)

```
✅ Custom Domain:
https://app.ordainedpro.com

CNAME Record:
Name: app
Points to: _________________.netlify.app
```

---

## ⚙️ Where to Use These

### `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=[Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Service Role Key]
```

### Netlify Environment Variables:
- Same 3 variables as above
- Add in: Site settings → Environment variables

### Supabase URL Configuration:
- Site URL: [Your Netlify URL or Custom Domain]
- Redirect URLs: [Your Netlify URL]/**

---

## ✅ Setup Progress

**Step 1: Supabase**
- [ ] Project created
- [ ] Credentials copied
- [ ] SQL schema run
- [ ] Authentication enabled

**Step 2: GitHub**
- [ ] Repository created
- [ ] Code pushed

**Step 3: Netlify**
- [ ] Site deployed
- [ ] Environment variables added
- [ ] Site live

**Step 4: Testing**
- [ ] Can signup
- [ ] Email verification works
- [ ] Can login
- [ ] Portal accessible

---

**Follow the complete guide in:** `FRESH_START_GUIDE.md`
