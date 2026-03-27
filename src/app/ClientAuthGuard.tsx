"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import PortalClient from "./PortalClient"

export default function ClientAuthGuard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    const checkAuth = async () => {
      try {
        // Use getSession instead of getUser - it reads from storage
        const { data: { session }, error } = await supabase.auth.getSession()

        // Check both storages directly
        const storageKey = 'sb-ailrvrxibpizbvyroonp-auth-token'
        const storedSessionS = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null
        const storedSessionL = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null

        console.log("🔍 Client session check:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          email: session?.user?.email,
          accessToken: session?.access_token ? "present" : "missing",
          error: error?.message,
          inSessionStorage: !!storedSessionS,
          inLocalStorage: !!storedSessionL,
          sessionStorageLength: storedSessionS?.length || 0,
          localStorageLength: storedSessionL?.length || 0,
          storageKey: storageKey,
          allSessionKeys: typeof window !== 'undefined' ? Object.keys(sessionStorage) : [],
          allLocalKeys: typeof window !== 'undefined' ? Object.keys(localStorage) : []
        })

        if (!session?.user) {
          console.log("❌ No session found, redirecting to /auth")
          setLoading(false)
          router.push("/auth")
        } else {
          console.log("✅ User authenticated:", session.user.email)
          setUser(session.user)
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setLoading(false)
        router.push("/auth")
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Auth state changed:", { event: _event, hasUser: !!session?.user })
      if (!session?.user) {
        router.push("/auth")
      } else {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <PortalClient
      user={{
        id: user.id,
        email: user.email || "",
      }}
    />
  )
}
