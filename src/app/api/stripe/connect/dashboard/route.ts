import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : ""

  if (!token) {
    return NextResponse.json({ error: "Missing user session." }, { status: 401 })
  }

  const supabase = getServiceClient()
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!supabase) {
    return NextResponse.json({ error: "Supabase service credentials are not configured." }, { status: 501 })
  }

  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 501 })
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData?.user

  if (userError || !user) {
    return NextResponse.json({ error: "Unable to verify the signed-in user." }, { status: 401 })
  }

  const { data: account, error: accountError } = await supabase
    .from("stripe_connect_accounts")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 })
  }

  if (!account?.stripe_account_id) {
    return NextResponse.json({ error: "Stripe payouts are not connected yet." }, { status: 400 })
  }

  const response = await fetch(
    `https://api.stripe.com/v1/accounts/${account.stripe_account_id}/login_links`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    }
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error?.message || "Unable to open Stripe Express dashboard." },
      { status: response.status }
    )
  }

  return NextResponse.json({ url: data.url })
}
