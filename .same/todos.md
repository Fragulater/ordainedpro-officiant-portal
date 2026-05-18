# OrdainedPro Portal - Task Tracker

## Current Status (v437)
- ✅ Portal running and working
- ✅ Email sender updated to info@ordainedpro.com
- ✅ Outbound emails working (sending via Resend)
- ✅ Inbound email webhook working
- ✅ Meeting invite emails FIXED
- ✅ **GitHub sync working** (GitHub Desktop + PowerShell)
- ✅ **Couple-Specific Data** - All menu items isolated per couple
- ✅ **Scripts migrated to server-side** (Apr 28, 2026)
- ✅ **Auth Fix v424 - Blank Screen Fix** (Apr 28, 2026)
- ✅ **Null Safety Fix v426 - brideName error** (Apr 28, 2026)
- ✅ **Null Safety Fix v427 - brideName.split() error** (Apr 29, 2026)
- ✅ **Null Safety Fix v428 - Comprehensive editCoupleInfo safety** (Apr 29, 2026)
- ✅ **Multiple GoTrueClient Fix v429** (Apr 29, 2026)
- ✅ **TypeScript Fix v435 - Supabase singleton type safety** (Apr 29, 2026)
- ✅ **Null Safety Fix v436 - Comprehensive .split() and .brideName fixes** (Apr 29, 2026)
- ✅ **RLS Security Fix v437 - Row Level Security enabled on all tables** (Apr 30, 2026)

## RLS Security Fix (v437) - Row Level Security Enabled

### Problem
- Row Level Security (RLS) was disabled on database tables
- Users could potentially access other users' data

### Solution
1. Enabled RLS on all tables via Supabase SQL Editor
2. Verified policies exist for SELECT, INSERT, UPDATE, DELETE
3. All tables now properly secured: tasks, meetings, couple_files, contracts, payments, scripts, couples, messages

### Tables Secured
| Table | RLS Status |
|-------|-----------|
| contracts | ✅ enabled |
| couple_files | ✅ enabled |
| couples | ✅ enabled |
| meetings | ✅ enabled |
| messages | ✅ enabled |
| payments | ✅ enabled |
| scripts | ✅ enabled |
| tasks | ✅ enabled |

## Null Safety Fix (v436) - Comprehensive Split/BrideName Fixes

### Problem
- Production error: `Cannot read properties of null (reading 'brideName')`
- Error occurred after authentication when loading portal
- Multiple places accessing `editCoupleInfo.brideName.split(' ')` without null checks
- `currentCoupleId` calculation missing null safety

### Solution
1. Added `getFirstName()` helper function for null-safe first name extraction
2. Fixed `currentCoupleId` to check `editCoupleInfo?.brideName` before access
3. Replaced all direct `.brideName.split(' ')[0]` calls with `getFirstName()`:
   - Line ~1946-1947: handleUploadScript name variables
   - Line ~1985: imported script title
   - Line ~2071: shareScript email body
   - Line ~2421: payment reminder email body
   - Line ~3750: invoice content

### Files Changed
- `src/components/CommunicationPortal.tsx`
  - Added `getFirstName()` helper after imports
  - Fixed `currentCoupleId` with optional chaining
  - Fixed 6 dangerous `.split()` calls with `getFirstName()`

## TypeScript Fix (v435) - Supabase Singleton Type Safety

### Problem
- TypeScript error: `Type 'SupabaseClient | null' is not assignable to type 'SupabaseClient'`
- The singleton pattern allowed returning a potentially null value

### Solution
- Added explicit type cast when retrieving from window: `as SupabaseClient`
- Added non-null assertion on return: `return supabaseInstance!`

### Files Changed
- `src/supabase/utils/client.ts` - Fixed type assertion on line 34-35

## Multiple GoTrueClient Fix (v429)

### Problem
- Console warning: "Multiple GoTrueClient instances detected in the same browser context"
- Caused by inconsistent singleton pattern and eager module initialization
- Components using `useMemo(() => getSupabaseClient(), [])` while module also exported `supabase` eagerly

### Solution
1. **Fixed singleton pattern** in `src/supabase/utils/client.ts`:
   - Added module-level `supabaseInstance` variable
   - Made `export const supabase` use a Proxy for lazy initialization
   - This prevents creating an instance at module load time
   - Stores singleton on both module scope AND window (for hot reload)

2. **Removed unnecessary useMemo** in components:
   - `ClientAuthGuard.tsx` - now imports `supabase` directly
   - `CommunicationPortal.tsx` - now imports `supabase` directly
   - `AuthForm.tsx` - now imports `supabase` directly

### Files Changed
- `src/supabase/utils/client.ts` - Fixed singleton with Proxy lazy-loading
- `src/app/ClientAuthGuard.tsx` - Removed useMemo
- `src/components/CommunicationPortal.tsx` - Removed useMemo
- `src/components/AuthForm.tsx` - Removed useMemo

## Null Safety Fix (v428) - Comprehensive editCoupleInfo Safety

### Problem
- Error persisted: `Cannot read properties of null (reading 'brideName')`
- Multiple locations in code accessed `editCoupleInfo` directly without null checks
- Functions like `generateScriptContent` accessed `editCoupleInfo.brideName` in template strings

### Solution
1. Added `DEFAULT_COUPLE_INFO` constant as guaranteed fallback
2. Added safety wrapper: `const editCoupleInfo = editCoupleInfoRaw || DEFAULT_COUPLE_INFO`
3. Fixed ALL remaining `editCoupleInfo.brideName` accesses with optional chaining:
   - `generateScriptContent()` function (lines 1191-1215)
   - Chat message generation (line 1431)
   - Quick setup response (line 1531)
4. Added optional chaining to `couple.brideName/groomName` in OfficiantDashboardDialog

### Files Changed
- `src/components/CommunicationPortal.tsx` - Safety wrapper + multiple template string fixes
- `src/components/OfficiantDashboardDialog.tsx` - Optional chaining in ceremony transform

## Null Safety Fix (v427) - brideName.split() Error

### Problem
- `Uncaught TypeError: Cannot read properties of null (reading 'brideName')`
- Error occurred when calling `.split()` on `editCoupleInfo.brideName` without null checks
- 5 locations in `CommunicationPortal.tsx` had unsafe `.split()` calls

### Solution
- Added `getFirstName()` helper function for null-safe first name extraction
- Replaced all direct `.brideName.split(' ')[0]` calls with `getFirstName(editCoupleInfo?.brideName)`
- Falls back to 'Partner' if name is null/undefined

### Files Changed
- `src/components/CommunicationPortal.tsx`
  - Line ~42: Added `getFirstName()` helper function
  - Line ~1962: Fixed `bride1FirstName` and `groom1FirstName`
  - Line ~2001: Fixed imported script title
  - Line ~2087: Fixed share script email body
  - Line ~2437: Fixed payment reminder email body
  - Line ~3766: Fixed invoice content

## Null Safety Fix (v426) - brideName Error

### Problem
- `Uncaught TypeError: Cannot read properties of null (reading 'brideName')`
- Error occurred after authentication when loading the portal
- Properties like `.brideName.split()` crashed when value was null

### Solution
- Added `getInitials()` helper function for safe initial extraction
- Added optional chaining (`?.`) to ALL editCoupleInfo and couple accesses
- Added fallback values for all displayed names, emails, phones
- Example: `{couple?.brideName || 'Partner 1'}` instead of `{couple.brideName}`
- Example: `{getInitials(couple?.brideName)}` instead of `{couple.brideName.split(' ')...}`

### Files Changed
- `src/components/communication-portal/CeremoniesCouples/PortalOverview.tsx`
- `src/components/communication-portal/CeremoniesCouples/PortalHeader.tsx`

## Auth Fix (v424) - Blank Screen Fix

### Problem
- Blank white screen appearing in incognito/fresh browser
- Component returned `null` while redirect was in progress

### Solution
- Added `isRedirecting` state to show loading spinner during redirect
- Changed `router.push` to `router.replace` for auth redirects

### Files Changed
- `src/app/ClientAuthGuard.tsx` - Added redirect state and fallback UI

### Testing
1. Open in incognito/new browser
2. Go to portal URL
3. Should see "Loading..." then "Redirecting to login..."
4. Should redirect to /auth page
5. NO blank white screen at any point

## Previous Auth Fix (v419)

### Problem
- GoTrueClient errors in console
- Session not persisting across browsers/incognito
- Cookie-based auth from @supabase/ssr didn't work well in iframe environments

### Solution
- Replaced `@supabase/ssr` with standard `@supabase/supabase-js`
- Auth uses localStorage (iframe-compatible) instead of cookies

## Server-Side Storage Migration Status

### ✅ COMPLETED - Now using Supabase:
| Item | Table | Status |
|------|-------|--------|
| Messages | `messages` | ✅ Done |
| Tasks | `tasks` | ✅ Done |
| Files | `couple_files` | ✅ Done |
| Meetings | `meetings` | ✅ Done |
| Contracts | `contracts` | ✅ Done |
| Payments | `payments` | ✅ Done |
| **Scripts** | `scripts` | ✅ Done (Apr 28) |

## Deployment Status
- **GitHub Repo:** danieljosephsalerno-ai/ordainedpro-officiant-portal
- **Netlify:** Auto-deploys from GitHub `main` branch
- **Live Site:** portal.ordainedpro.com
- **Same.new:** Version 428

## Notes
- TypeScript `any` warnings don't block build (CI=false)
- Scripts are per-officiant (optionally linked to couple)
- Auto-save now saves to database instead of localStorage
- Auth uses localStorage (iframe-compatible) instead of cookies
