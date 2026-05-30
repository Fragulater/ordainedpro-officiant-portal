import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STRIPE_API_BASE = "https://api.stripe.com/v1"

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
}

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : ""
}

async function stripeRequest(path: string, body?: URLSearchParams) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return {
      ok: false,
      status: 501,
      data: { error: { message: "Stripe is not configured yet. Add STRIPE_SECRET_KEY in Netlify." } },
    }
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

async function getAuthenticatedUser(request: NextRequest) {
  const token = getToken(request)
  if (!token) return { error: "Missing user session.", status: 401 as const }

  const supabase = getServiceClient()
  if (!supabase) return { error: "Supabase service credentials are not configured.", status: 501 as const }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { error: "Unable to verify the signed-in user.", status: 401 as const }

  return { supabase, user: data.user }
}

async function saveConnectAccount(supabase: any, userId: string, account: Record<string, any>) {
  const { error } = await supabase.from("stripe_connect_accounts").upsert(
    {
      user_id: userId,
      stripe_account_id: account.id,
      country: account.country || null,
      default_currency: account.default_currency || null,
      charges_enabled: Boolean(account.charges_enabled),
      payouts_enabled: Boolean(account.payouts_enabled),
      details_submitted: Boolean(account.details_submitted),
      onboarding_complete: Boolean(account.charges_enabled && account.payouts_enabled && account.details_submitted),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) throw error
}

async function loadConnectAccount(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("stripe_connect_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const row = await loadConnectAccount(auth.supabase, auth.user.id)
    if (!row?.stripe_account_id) {
      return NextResponse.json({ connected: false, account: null })
    }

    const stripe = await stripeRequest(`/accounts/${row.stripe_account_id}`)
    if (!stripe.ok) {
      return NextResponse.json({
        connected: true,
        account: row,
        warning: stripe.data?.error?.message || "Unable to refresh Stripe account status.",
      })
    }

    await saveConnectAccount(auth.supabase, auth.user.id, stripe.data)
    const refreshed = await loadConnectAccount(auth.supabase, auth.user.id)

    return NextResponse.json({ connected: true, account: refreshed })
  } catch (error: any) {
    console.error("Unable to load Stripe Connect account:", error)
    return NextResponse.json(
      { error: error?.message || "Unable to load Stripe Connect account." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    let row = await loadConnectAccount(auth.supabase, auth.user.id)
    let accountId = row?.stripe_account_id

    if (!accountId) {
      const { data: profile } = await auth.supabase
        .from("profiles")
        .select("email,business_name,full_name")
        .eq("user_id", auth.user.id)
        .maybeSingle()

      const params = new URLSearchParams()
      params.set("type", "express")
      params.set("country", "US")
      params.set("email", profile?.email || auth.user.email || "")
      params.set("business_type", "individual")
      params.set("capabilities[card_payments][requested]", "true")
      params.set("capabilities[transfers][requested]", "true")
      params.set("metadata[user_id]", auth.user.id)
      if (profile?.business_name) params.set("business_profile[name]", profile.business_name)

      const accountResponse = await stripeRequest("/accounts", params)
      if (!accountResponse.ok) {
        return NextResponse.json(
          { error: accountResponse.data?.error?.message || "Unable to create Stripe connected account." },
          { status: accountResponse.status }
        )
      }

      accountId = accountResponse.data.id
      await saveConnectAccount(auth.supabase, auth.user.id, accountResponse.data)
      row = await loadConnectAccount(auth.supabase, auth.user.id)
    }

    const baseUrl = getBaseUrl(request)
    const linkParams = new URLSearchParams()
    linkParams.set("account", accountId)
    linkParams.set("refresh_url", `${baseUrl}/api/stripe/connect/return?status=refresh`)
    linkParams.set("return_url", `${baseUrl}/api/stripe/connect/return?status=complete`)
    linkParams.set("type", "account_onboarding")

    const linkResponse = await stripeRequest("/account_links", linkParams)
    if (!linkResponse.ok) {
      return NextResponse.json(
        { error: linkResponse.data?.error?.message || "Unable to create Stripe onboarding link." },
        { status: linkResponse.status }
      )
    }

    return NextResponse.json({
      connected: Boolean(row),
      account: row,
      url: linkResponse.data.url,
    })
  } catch (error: any) {
    console.error("Unable to create Stripe Connect onboarding link:", error)
    return NextResponse.json(
      { error: error?.message || "Unable to start Stripe Connect onboarding." },
      { status: 500 }
    )
  }
}
