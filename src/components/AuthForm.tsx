"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [nextUrl, setNextUrl] = useState("/")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [legalAccepted, setLegalAccepted] = useState(false)

    // Supabase client is imported as a singleton - no need for useMemo

    // Read searchParams after component mounts
    useEffect(() => {
        const next = searchParams.get("next")
        if (next) {
            setNextUrl(next)
        }
    }, [searchParams])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        try {
            if (isLogin) {
                console.log("📧 Attempting login...")
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                })

                if (error) {
                    console.error("❌ Login error:", error.message)
                    throw error
                }

                if (!data.session) {
                    throw new Error("No session returned from login")
                }

                console.log("✅ Login successful:", {
                    hasSession: !!data.session,
                    email: data.user?.email
                })

                setMessage("Login successful! Redirecting...")

                // Use window.location for full page reload to ensure cookies are properly read
                await new Promise(resolve => setTimeout(resolve, 300))
                window.location.href = nextUrl
            } else {
                if (!legalAccepted) {
                    setMessage("Please accept the Terms of Service and Privacy Policy to create an account.")
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: email.split("@")[0],
                            full_name: email.split("@")[0],
                            user_type: "officiant",
                        },
                    },
                })

                if (error) throw error

                if (data.user) {
                    await supabase
                        .from("profiles")
                        .upsert(
                            {
                                user_id: data.user.id,
                                full_name: data.user.user_metadata?.full_name || email.split("@")[0],
                                email,
                                user_type: "officiant",
                            },
                            { onConflict: "user_id" }
                        )

                    await supabase
                        .from("legal_acceptances")
                        .insert([
                            {
                                user_id: data.user.id,
                                document_slug: "terms-of-service",
                                document_version: "1.0-placeholder",
                                context: "portal_signup",
                            },
                            {
                                user_id: data.user.id,
                                document_slug: "privacy-policy",
                                document_version: "1.0-placeholder",
                                context: "portal_signup",
                            },
                        ])
                        .then(({ error }) => {
                            if (error) console.warn("Legal acceptance tracking is not ready yet:", error.message)
                        })
                }

                setMessage("Signup successful! Please check your email to confirm your account.")
                console.log("✅ Signup result:", data)
                setLoading(false)
            }
        } catch (err: unknown) {
            console.error("Auth error:", err)
            const errorMessage = err instanceof Error ? err.message : "An error occurred"
            setMessage("❌ " + errorMessage)
            setLoading(false)
        }
    }

    return (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
            <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
                {isLogin ? "Sign In" : "Create Account"}
            </h1>

            <form onSubmit={handleAuth} className="space-y-4">
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {!isLogin && (
                    <label className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={legalAccepted}
                            onChange={(event) => setLegalAccepted(event.target.checked)}
                            className="mt-1"
                            required
                        />
                        <span>
                            I agree to the{" "}
                            <a className="text-blue-700 underline" href="/legal/terms-of-service" target="_blank" rel="noreferrer">
                                Terms of Service
                            </a>{" "}
                            and{" "}
                            <a className="text-blue-700 underline" href="/legal/privacy-policy" target="_blank" rel="noreferrer">
                                Privacy Policy
                            </a>
                            .
                        </span>
                    </label>
                )}
                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                >
                    {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 hover:underline"
                >
                    {isLogin ? "Sign Up" : "Sign In"}
                </button>
            </p>

            {message && (
                <p className={`text-center mt-4 text-sm ${
                    message.startsWith("❌") ? "text-red-600" : "text-green-600"
                }`}>
                    {message}
                </p>
            )}
        </div>
    )
}
