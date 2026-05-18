# OrdainedPro Wedding Portal - Todos

## Completed Tasks
- [x] Fix emoji encoding issues
- [x] Fix file attachment handling in emails
- [x] Remove success popup after sharing drafts
- [x] Push to GitHub and deploy to Netlify
- [x] Fix Netlify build failures (secrets scanning)
- [x] Support multi-file attachments (up to 5)
- [x] Connect correct GitHub repo to custom domain
- [x] Move archived weddings out of "Switch between ceremonies" popup
- [x] Direct archived ceremonies to Officiant Dashboard
- [x] Enhanced Calendar view with all couples info
- [x] Profile persistence - auto-save to Supabase after uploads
- [x] Documents upload to Supabase Storage
- [x] Welcome message shows officiant's first name
- [x] Remove character count from notes button
- [x] Move Dashboard button into avatar dropdown with logout
- [x] Email notification to officiant when couple sends message

## Current Session - Square Billing Integration

### Phase 1: Backend APIs (v465) - COMPLETED
- [x] Installed Square SDK
- [x] Created Square client config (`src/lib/square.ts`)
- [x] Created plan constants (Aspirant, Professional, Data Retention)
- [x] API route: POST `/api/subscriptions/create` - Create subscription with Square
- [x] API route: POST `/api/subscriptions/cancel` - Cancel or switch to data retention
- [x] API route: GET `/api/subscriptions/status` - Get subscription status
- [x] API route: POST `/api/subscriptions/reactivate` - Reactivate/upgrade
- [x] Supabase subscriptions table schema with Square fields
- [x] Updated SubscriptionContext with new status types
- [x] Created CancelSubscriptionDialog component

### Phase 2: Square Web Payments SDK (v466) - COMPLETED
- [x] Created `SquarePaymentForm.tsx` component
  - Loads Square Web Payments SDK dynamically
  - Renders card input form
  - Tokenizes card information
  - Shows plan info, loading states, errors
- [x] Created `UpgradeSubscriptionDialog.tsx` component
  - Plan selection step (Aspirant, Professional)
  - Payment step with SquarePaymentForm
  - Success step with feature list
  - Integrates with create subscription API
- [x] Updated `OfficiantDashboardDialog.tsx`
  - Added showUpgradeDialog state
  - Connected "Upgrade Now" button to dialog
  - Connected "Upgrade to Professional" button to dialog
  - Connected "Reactivate Subscription" button to dialog
  - Connected "Upgrade to Full Plan" button (data retention) to dialog
- [x] Fixed Square SDK v44 imports (SquareClient, SquareEnvironment)
- [x] Updated all API routes for SDK v44 method signatures

### Phase 3: Wedding Details Notes Feature (v468-470) - COMPLETED
- [x] Created backup files before modifications
- [x] Implemented Notes button in PortalOverview.tsx
  - Button shows green when notes exist, gray when empty
  - Character count badge ("100+" or exact count)
  - Opens popup dialog with full notes view
- [x] Server-side wedding details storage
  - `saveWeddingDetails()` saves to Supabase couples table
  - `loadWeddingDetails()` loads from Supabase couples table
  - No client-side/localStorage storage used
- [x] Integration in CommunicationPortal.tsx
  - `handleOpenEditWeddingDialog()` loads from server before opening
  - `handleEditWeddingDetails()` saves to server (Supabase)
- [x] Notes popup dialog with:
  - Scrollable view for long notes
  - Empty state when no notes
  - "Edit Notes" button to open full dialog

## Next Steps
- [ ] Add Square environment variables to .env.local and Netlify
- [ ] Create Square subscription plans in Square Dashboard (sandbox)
- [ ] Test full subscription flow in sandbox mode
- [ ] Add payment method update functionality
- [ ] Deploy updated version to Netlify

## Environment Variables Needed
```
SQUARE_ACCESS_TOKEN=your_sandbox_access_token
SQUARE_LOCATION_ID=your_location_id
SQUARE_ENVIRONMENT=sandbox
SQUARE_ASPIRANT_PLAN_ID=aspirant_monthly
SQUARE_PROFESSIONAL_PLAN_ID=professional_monthly
SQUARE_DATA_RETENTION_PLAN_ID=data_retention_monthly
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxx
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_location_id
```

## Backup Management
- Created backup before changes: `.backups/OfficiantDashboardDialog.tsx.backup_20260514_*`
- Always create backups before modifying critical files

## Notes
- Latest version: 472 (Email notification to officiant feature)
- Project deployed at: https://ordainedpro2.netlify.app/
- Custom domain: portal.ordainedpro.com
- Storage buckets in Supabase:
  - `headshots` - Profile headshots
  - `gallery` - Portfolio photos
  - `videos` - Introduction videos
  - `documents` - Contracts, templates, etc.
