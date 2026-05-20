"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBrowserCookieOptions } from "./shared-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// SINGLETON: Single instance stored in module scope
let supabaseInstance: SupabaseClient | null = null;

// Get or create singleton Supabase client
function createSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Server-side: create a basic client (no persistence)
  if (typeof window === 'undefined') {
    console.log('Creating Supabase client (server-side, non-persistent)');
    return createBrowserClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      cookieOptions: getBrowserCookieOptions(),
    });
  }

  // Client-side: Check if already stored on window (handles module hot reload)
  const globalWindow = window as any;
  const SUPABASE_KEY = '__supabase_singleton__';

  if (globalWindow[SUPABASE_KEY]) {
    supabaseInstance = globalWindow[SUPABASE_KEY] as SupabaseClient;
    return supabaseInstance!;
  }

  console.log('Creating Supabase client (singleton)');

  // Create client with cookie persistence so portal.ordainedpro.com and
  // scripts.ordainedpro.com can share the same Supabase session.
  supabaseInstance = createBrowserClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder-key', {
    cookieOptions: getBrowserCookieOptions(),
  });

  // Store on window to survive module hot reloads
  globalWindow[SUPABASE_KEY] = supabaseInstance;

  return supabaseInstance;
}

// Export singleton getter - this is the PRIMARY way to get the client
export function getSupabaseClient(): SupabaseClient {
  return createSupabaseClient();
}

// Export for direct usage - lazy getter, NOT eager instantiation
// This prevents creating an instance at module load time
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

// Configuration check
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('https://')
  );
};

// Connection test
export async function checkConnection() {
  if (!isSupabaseConfigured()) {
    console.error("Supabase not configured");
    return { ok: false };
  }

  try {
    const client = getSupabaseClient();
    const { error } = await client.from("ceremonies").select("id").limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("Connection failed:", err);
    return { ok: false, err };
  }
}
