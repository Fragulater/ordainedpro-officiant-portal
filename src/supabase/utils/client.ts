"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate that the URL is actually valid (starts with http:// or https://)
const isValidUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const validSupabaseUrl = isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder.supabase.co";
const validSupabaseKey = supabaseKey && !supabaseKey.includes('your-') ? supabaseKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";

if (!isValidUrl(supabaseUrl) || !supabaseKey || supabaseKey.includes('your-')) {
  console.warn("⚠️ Supabase environment variables are not properly configured. Using placeholder values.");
  console.warn("Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}

// Custom storage adapter - use localStorage (works better in iframes)
const customStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      console.log('🔍 getItem called on server side, returning null')
      return null
    }

    console.log('🔍 Supabase getItem called:', key)

    // Try localStorage first (works better in iframes)
    try {
      const value = window.localStorage.getItem(key)
      if (value) {
        console.log('✅ Found in localStorage:', { length: value.length })
        return value
      }
    } catch (e) {
      console.warn('⚠️ localStorage.getItem failed:', e)
    }

    // Fallback to sessionStorage
    try {
      const value = window.sessionStorage.getItem(key)
      if (value) {
        console.log('✅ Found in sessionStorage:', { length: value.length })
        return value
      }
    } catch (e) {
      console.warn('⚠️ sessionStorage.getItem failed:', e)
    }

    console.log('❌ Not found in any storage')
    return null
  },

  setItem: (key: string, value: string) => {
    console.log('🚨🚨🚨 STORAGE ADAPTER setItem CALLED!!! 🚨🚨🚨')
    console.log('Key:', key)
    console.log('Value length:', value?.length || 0)
    console.log('Timestamp:', new Date().toISOString())
    console.log('Stack trace:', new Error().stack)

    if (typeof window === 'undefined') {
      console.error('❌ setItem called on server side, cannot save!')
      return
    }

    let saved = false

    // Try localStorage first (works better in iframes)
    try {
      console.log('💾 Attempting to save to localStorage...')
      window.localStorage.setItem(key, value)
      const verify = window.localStorage.getItem(key)
      if (verify) {
        console.log('✅✅✅ SUCCESS! Saved to localStorage and verified!')
        saved = true
      } else {
        console.error('❌ localStorage.setItem executed but verification failed!')
      }
    } catch (e) {
      console.error('❌ localStorage.setItem EXCEPTION:', e)
    }

    // Also try sessionStorage as backup
    try {
      console.log('💾 Attempting to save to sessionStorage...')
      window.sessionStorage.setItem(key, value)
      const verify = window.sessionStorage.getItem(key)
      if (verify) {
        console.log('✅✅✅ SUCCESS! Saved to sessionStorage and verified!')
        saved = true
      } else {
        console.error('❌ sessionStorage.setItem executed but verification failed!')
      }
    } catch (e) {
      console.error('❌ sessionStorage.setItem EXCEPTION:', e)
    }

    if (!saved) {
      console.error('❌❌❌ CRITICAL FAILURE: Could not save to ANY storage!')
      console.error('This means the session will be lost on page reload!')
    } else {
      console.log('✅ Session persistence successful!')
    }
  },

  removeItem: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
      console.log('🗑️ Removed from both storages:', key)
    } catch (e) {
      console.warn('Failed to remove session:', e)
    }
  }
}

// Test storage availability
function testStorage() {
  if (typeof window === 'undefined') return { session: false, local: false }

  const testKey = 'storage-test'
  const testValue = 'test'

  let sessionWorks = false
  let localWorks = false

  try {
    window.sessionStorage.setItem(testKey, testValue)
    sessionWorks = window.sessionStorage.getItem(testKey) === testValue
    window.sessionStorage.removeItem(testKey)
  } catch (e) {
    console.warn('⚠️ sessionStorage not available:', e)
  }

  try {
    window.localStorage.setItem(testKey, testValue)
    localWorks = window.localStorage.getItem(testKey) === testValue
    window.localStorage.removeItem(testKey)
  } catch (e) {
    console.warn('⚠️ localStorage not available:', e)
  }

  console.log('📦 Storage test:', { sessionStorage: sessionWorks, localStorage: localWorks })
  return { session: sessionWorks, local: localWorks }
}

// ✅ Simple browser-only client - no SSR complexity
if (typeof window !== 'undefined' && !(window as any).__supabase) {
  console.log('🆕 Creating NEW Supabase client (first time)');
  testStorage();

  (window as any).__supabase = createClient(
    validSupabaseUrl,
    validSupabaseKey,
    {
      auth: {
        persistSession: true,
        storage: customStorageAdapter,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-ailrvrxibpizbvyroonp-auth-token'
      }
    }
  );
  console.log('✅ Supabase client created with CUSTOM STORAGE ADAPTER');
  console.log('✅ Verifying storage adapter:', {
    hasGetItem: typeof customStorageAdapter.getItem === 'function',
    hasSetItem: typeof customStorageAdapter.setItem === 'function',
    hasRemoveItem: typeof customStorageAdapter.removeItem === 'function'
  });
} else if (typeof window !== 'undefined') {
  console.log('♻️ Reusing existing Supabase client from window');
}

// Export the global instance (or create server-side dummy)
export const supabase = typeof window !== 'undefined'
  ? (window as any).__supabase
  : createClient(validSupabaseUrl, validSupabaseKey, {
      auth: { persistSession: false }
    });
