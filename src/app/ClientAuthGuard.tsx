"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import PortalClient from "./PortalClient"

export default function ClientAuthGuard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const authResolvedRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    let authTimeoutId: NodeJS.Timeout | null = null

    const redirectToLogin = (message?: string) => {
      if (!isMounted) return
      if (message) setAuthError(message)
      setUser(null)
      setIsRedirecting(true)
      setLoading(false)
      authResolvedRef.current = true
      router.replace("/auth")
    }

    const resolveAuthenticatedUser = (authenticatedUser: User) => {
      if (!isMounted) return
      setUser(authenticatedUser)
      setAuthError(null)
      setIsRedirecting(false)
      setLoading(false)
      authResolvedRef.current = true
    }

    const checkAuth = async () => {
      try {
        console.log("🔍 Checking authentication...")

        if (!supabase?.auth) {
          console.error("❌ Supabase client not available")
          redirectToLogin("Authentication service unavailable")
          return
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (sessionError) {
          console.error("❌ Session error:", sessionError.message)
        }

        if (session?.user) {
          console.log("✅ User authenticated via session:", session.user.email)
          resolveAuthenticatedUser(session.user)
          return
        }

        const {
          data: { user: validatedUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        console.log("🔍 Auth check result:", {
          hasUser: !!validatedUser,
          email: validatedUser?.email,
          error: userError?.message,
        })

        if (userError || !validatedUser) {
          console.log("❌ No user found, redirecting to /auth")
          redirectToLogin()
          return
        }

        console.log("✅ User authenticated:", validatedUser.email)
        resolveAuthenticatedUser(validatedUser)
      } catch (error) {
        console.error("Auth check error:", error)
        redirectToLogin("Authentication check failed")
      }
    }

    authTimeoutId = setTimeout(() => {
      if (!isMounted || authResolvedRef.current) return
      console.warn("⚠️ Auth check timed out after 10 seconds, redirecting to login")
      redirectToLogin("Authentication timed out")
    }, 10000)

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log("🔄 Auth state changed:", { event, hasUser: !!session?.user })

      if (event === "SIGNED_OUT" || !session?.user) {
        redirectToLogin()
      } else if (session.user) {
        resolveAuthenticatedUser(session.user)
      }
    })

    return () => {
      isMounted = false
      if (authTimeoutId) clearTimeout(authTimeoutId)
      subscription.unsubscribe()
    }
  }, [router])

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? "Redirecting to login..." : "Loading..."}
          </p>
          {authError && <p className="text-red-500 text-sm mt-2">{authError}</p>}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
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
