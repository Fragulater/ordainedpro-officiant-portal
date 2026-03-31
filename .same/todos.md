# OrdainedPro Officiant Portal - TODO Tracker

## Completed Tasks ✅

### Messaging System Fix (Latest)
- [x] Separated couple-officiant messaging from Mr. Script AI chat
- [x] Created proper `coupleMessages` state for real messages
- [x] Added Supabase integration for message storage
- [x] Added real-time message subscription
- [x] Created email notification API route (`/api/send-email`)
- [x] Updated Messages tab UI to show proper couple messages
- [x] Added "Send + Email Notify" button for email notifications
- [x] Added loading states and empty message state

### Script Generation Fix
- [x] Fixed API route export issue (CEREMONY_SEGMENTS was breaking the route)
- [x] Switched to gpt-4o-mini for better API key compatibility
- [x] Added improved error handling and logging

### Previous Fixes
- [x] Supabase integration for data storage
- [x] Avatar CORS fixes for iframe environment
- [x] Server-side profile storage (removed localStorage)
- [x] Safe marketplace schema for database

## Pending Tasks 📋

### Email Configuration
- [ ] Add RESEND_API_KEY to Netlify environment variables
- [ ] Configure custom "from" email domain in Resend
- [ ] Test email delivery in production

### Marketplace Integration
- [ ] Deploy marketplace project
- [ ] Add NEXT_PUBLIC_MARKETPLACE_URL to Netlify
- [ ] Test real-time script sync between portal and marketplace

### TypeScript Cleanup
- [ ] Fix implicit 'any' type warnings
- [ ] Fix type mismatches in Task and Contract interfaces

## Notes

### Email Service Setup
To enable email notifications:
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Get your API key from the dashboard
3. Add `RESEND_API_KEY` to Netlify environment variables
4. Redeploy the site

### Messages Table Schema
The messages table should have:
- id (uuid)
- user_id (uuid) - officiant's user ID
- couple_id (uuid) - optional link to couple
- sender (text) - "officiant" or "couple"
- sender_name (text)
- recipient_email (text)
- content (text)
- read (boolean)
- email_sent (boolean)
- created_at (timestamp)
