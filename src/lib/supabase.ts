"use client"

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"

// ✅ Explicitly provide env vars
export const supabase = createPagesBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
})

// ✅ Optional: Configuration checks
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  return Boolean(url && key)
}

// ✅ Optional: Connection test
export async function checkConnection() {
  if (!isSupabaseConfigured()) {
    console.error("❌ Supabase not configured — please check your .env.local file.")
    return { ok: false }
  }

  try {
    const { data, error } = await supabase.from("ceremonies").select("id").limit(1)
    if (error) throw error
    console.log("✅ Supabase connected successfully!")
    return { ok: true, data }
  } catch (err) {
    console.error("❌ Connection test failed:", err)
    return { ok: false, err }
  }
}
