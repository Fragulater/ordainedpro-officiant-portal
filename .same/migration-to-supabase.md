# Migration Guide: localStorage → Supabase

## Overview

This guide explains how to migrate the CommunicationPortal component from localStorage to Supabase for persistent, cloud-based data storage.

## Current State

Right now, data is stored in:
- `localStorage.getItem('couples')` - All couple/ceremony data
- `localStorage.getItem('officiantProfile')` - Officiant profile
- `localStorage.getItem('officiantDocuments')` - Documents list
- Browser memory - Lost on refresh/browser clear

## After Migration

Data will be stored in:
- Supabase `couples` table - Couple information
- Supabase `ceremonies` table - Wedding details
- Supabase `profiles` table - Officiant profile
- Supabase `messages` table - Conversation history
- Supabase `payments` table - Invoice and payment tracking
- Supabase `scripts` table - Script library
- Supabase Storage - Actual file uploads

## Step-by-Step Migration

### 1. Add Supabase Imports

At the top of `CommunicationPortal.tsx`:

```typescript
import {
  getCouples,
  createCouple,
  updateCouple,
  deleteCouple,
  getCeremony,
  createCeremony,
  updateCeremony
} from '@/services/supabase-api'
```

### 2. Replace localStorage with Supabase

#### Loading Couples (useEffect)

**Before:**
```typescript
useEffect(() => {
  const stored = localStorage.getItem('couples')
  if (stored) {
    setCouples(JSON.parse(stored))
  } else {
    setCouples(defaultCouples)
  }
}, [])
```

**After:**
```typescript
useEffect(() => {
  loadCouples()
}, [])

const loadCouples = async () => {
  try {
    const userId = 'mock-user-id' // Replace with actual auth user ID
    const data = await getCouples(userId)

    if (data.length > 0) {
      setCouples(transformSupabaseCouples(data))
    } else {
      setCouples(defaultCouples)
    }
  } catch (error) {
    console.error('Error loading couples:', error)
    setCouples(defaultCouples)
  }
}
```

#### Saving Couples

**Before:**
```typescript
const handleSaveCouple = () => {
  const updatedCouples = [...couples]
  updatedCouples[selectedCoupleIndex] = editedCouple
  setCouples(updatedCouples)
  localStorage.setItem('couples', JSON.stringify(updatedCouples))
}
```

**After:**
```typescript
const handleSaveCouple = async () => {
  try {
    const userId = 'mock-user-id'

    // Update couple in database
    await updateCouple(editedCouple.id, {
      bride_name: editedCouple.brideName,
      bride_email: editedCouple.brideEmail,
      // ... map all fields
    })

    // Update ceremony details
    await updateCeremony(editedCouple.id, {
      venue_name: editedCouple.weddingDetails.venueName,
      // ... map ceremony fields
    })

    // Reload data from database
    await loadCouples()

    alert('Changes saved successfully!')
  } catch (error) {
    console.error('Error saving:', error)
    alert('Failed to save changes')
  }
}
```

#### Adding New Ceremony

**Before:**
```typescript
const handleAddNewCouple = (newCouple) => {
  const updatedCouples = [...couples, { id: Date.now(), ...newCouple }]
  setCouples(updatedCouples)
  localStorage.setItem('couples', JSON.stringify(updatedCouples))
}
```

**After:**
```typescript
const handleAddNewCouple = async (newCouple) => {
  try {
    const userId = 'mock-user-id'

    // Create couple record
    const couple = await createCouple(userId, {
      bride_name: newCouple.brideName,
      groom_name: newCouple.groomName,
      // ... all couple fields
    })

    // Create ceremony record
    await createCeremony(userId, {
      couple_id: couple.id,
      venue_name: newCouple.weddingDetails.venueName,
      // ... all ceremony fields
    })

    // Reload data
    await loadCouples()

    alert('Ceremony created successfully!')
  } catch (error) {
    console.error('Error creating ceremony:', error)
    alert('Failed to create ceremony')
  }
}
```

### 3. Add Data Transformation Functions

Since Supabase uses snake_case and your app uses camelCase:

```typescript
// Transform Supabase data to app format
const transformSupabaseCouples = (supabaseCouples) => {
  return supabaseCouples.map(couple => ({
    id: couple.id,
    brideName: couple.bride_name,
    brideEmail: couple.bride_email,
    bridePhone: couple.bride_phone,
    brideAddress: couple.bride_address,
    groomName: couple.groom_name,
    groomEmail: couple.groom_email,
    groomPhone: couple.groom_phone,
    groomAddress: couple.groom_address,
    address: couple.address,
    emergencyContact: couple.emergency_contact,
    specialRequests: couple.special_requests,
    isActive: couple.is_active,
    colors: couple.colors,
    weddingDetails: {
      // Load from ceremonies table
      venueName: '',
      venueAddress: '',
      // ... etc
    }
  }))
}

// Transform app data to Supabase format
const transformToSupabase = (couple) => ({
  bride_name: couple.brideName,
  bride_email: couple.brideEmail,
  // ... etc
})
```

### 4. Add Loading States

```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const loadCouples = async () => {
  setIsLoading(true)
  setError(null)
  try {
    // ... load data
  } catch (error) {
    setError('Failed to load ceremonies')
  } finally {
    setIsLoading(false)
  }
}

// In your JSX:
{isLoading && <div>Loading ceremonies...</div>}
{error && <div className="text-red-500">{error}</div>}
```

### 5. Handle Authentication (Future)

Replace all `'mock-user-id'` with:

```typescript
import { supabase } from '@/lib/supabase'

// Get current user
const { data: { user } } = await supabase.auth.getUser()
const userId = user?.id || 'mock-user-id'
```

## Migration Checklist

- [ ] Import Supabase API functions
- [ ] Replace localStorage reads with database queries
- [ ] Replace localStorage writes with database mutations
- [ ] Add data transformation functions
- [ ] Add loading and error states
- [ ] Test creating new ceremonies
- [ ] Test updating existing ceremonies
- [ ] Test deleting ceremonies
- [ ] Add authentication (later)

## Benefits After Migration

1. **Data Persistence** - Never lose data again
2. **Multi-device Sync** - Access from any device
3. **Real-time Updates** - See changes instantly
4. **Collaboration** - Share with assistants
5. **Backups** - Automatic daily backups
6. **Scalability** - Handle thousands of ceremonies
7. **Security** - Row Level Security policies
8. **Analytics** - Query data for insights

## Gradual Migration Strategy

You don't have to migrate everything at once:

### Phase 1: Read from Supabase, keep localStorage as backup
```typescript
const loadCouples = async () => {
  try {
    const data = await getCouples(userId)
    setCouples(data)
    // Also save to localStorage as backup
    localStorage.setItem('couples', JSON.stringify(data))
  } catch (error) {
    // Fallback to localStorage
    const stored = localStorage.getItem('couples')
    if (stored) setCouples(JSON.parse(stored))
  }
}
```

### Phase 2: Write to both Supabase and localStorage
```typescript
const saveCouples = async (couples) => {
  await updateCouple(couple.id, updates) // Supabase
  localStorage.setItem('couples', JSON.stringify(couples)) // localStorage backup
}
```

### Phase 3: Remove localStorage completely
```typescript
// Just use Supabase!
const saveCouples = async (couples) => {
  await updateCouple(couple.id, updates)
}
```

## Testing the Migration

1. **Before migration**: Export all couples from localStorage
   ```javascript
   console.log(JSON.stringify(localStorage.getItem('couples')))
   ```

2. **After migration**: Verify data in Supabase Table Editor

3. **Test operations**:
   - Create a ceremony
   - Edit ceremony details
   - Update payment status
   - Delete a ceremony
   - Check Supabase to confirm

## Rollback Plan

If something goes wrong:

1. Keep the localStorage backup code
2. Can switch back by changing the data source
3. Supabase data remains intact
4. No data loss!

## Need Help?

- Check `supabase-api.ts` for available functions
- See `supabase.ts` for database types
- Read `.same/supabase-setup.md` for schema details
- Test in Supabase Table Editor first

## Performance Tips

1. **Batch Operations**: Update multiple fields at once
2. **Selective Loading**: Only load active ceremonies initially
3. **Caching**: Keep data in React state, refresh periodically
4. **Optimistic Updates**: Update UI immediately, sync in background
5. **Pagination**: Load ceremonies in batches for large datasets

## Next Features to Build

Once migrated to Supabase:

1. **Real-time messaging** with couples
2. **File uploads** for documents
3. **Email notifications** for payment reminders
4. **Calendar sync** with Google Calendar
5. **Mobile app** using same database
6. **Team collaboration** for multi-officiant businesses

Good luck with the migration! 🚀
