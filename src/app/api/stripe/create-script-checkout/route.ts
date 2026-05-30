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

function calculateScriptPlatformFee(amount: number) {
  const percent = Number(process.env.STRIPE_PLATFORM_SCRIPT_FEE_PERCENT || 10)
  const fixed = Number(process.env.STRIPE_PLATFORM_SCRIPT_FEE_FIXED_CENTS || 0)
  const percentFee = Number.isFinite(percent) && percent > 0 ? Math.round(amount * 100 * (percent / 100)) : 0
  const fixedFee = Number.isFinite(fixed) && fixed > 0 ? Math.round(fixed) : 0
  return Math.max(percentFee + fixedFee, 0)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        error: "Stripe is not configured yet.",
        placeholder: true,
        nextStep: "Add STRIPE_SECRET_KEY plus connected-account onboarding before charging cards for marketplace scripts.",
        script: {
          scriptId: body.scriptId,
          price: body.price,
          sellerUserId: body.sellerUserId,
        },
      },
      { status: 501 }
    )
  }

  const scriptId = Number(body.scriptId)
  const sellerUserId = String(body.sellerUserId || "")
  const buyerEmail = body.buyerEmail ? String(body.buyerEmail) : ""

  if (!Number.isFinite(scriptId) || !sellerUserId) {
    return NextResponse.json({ error: "Missing required script checkout information." }, { status: 400 })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json({ error: "Server payment records are not configured." }, { status: 501 })
  }

  const [{ data: script, error: scriptError }, { data: connectAccount, error: connectError }] = await Promise.all([
    supabase
      .from("scripts")
      .select("id,title,price,is_published,user_id")
      .eq("id", scriptId)
      .eq("user_id", sellerUserId)
      .maybeSingle(),
    supabase
      .from("stripe_connect_accounts")
      .select("stripe_account_id,charges_enabled,onboarding_complete")
      .eq("user_id", sellerUserId)
      .maybeSingle(),
  ])

  if (scriptError) return NextResponse.json({ error: scriptError.message }, { status: 500 })
  if (connectError) return NextResponse.json({ error: connectError.message }, { status: 500 })
  if (!script || !script.is_published) {
    return NextResponse.json({ error: "This script is not available for purchase." }, { status: 404 })
  }
  if (!connectAccount?.stripe_account_id || !connectAccount.charges_enabled) {
    return NextResponse.json(
      { error: "This seller has not finished Stripe payout setup yet." },
      { status: 400 }
    )
  }

  const amount = Number(script.price || body.price || 0)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "This script does not have a valid price." }, { status: 400 })
  }

  const requestOrigin = request.nextUrl.origin
  const marketplaceUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://scripts.ordainedpro.com"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin
  const applicationFeeAmount = calculateScriptPlatformFee(amount)
  const params = new URLSearchParams()
  params.set("mode", "payment")
  params.set("client_reference_id", String(scriptId))
  params.set("success_url", `${marketplaceUrl}/purchase/success?script=${scriptId}&session_id={CHECKOUT_SESSION_ID}`)
  params.set("cancel_url", `${marketplaceUrl}/script/${scriptId}?checkout=cancelled`)
  params.set("line_items[0][quantity]", "1")
  params.set("line_items[0][price_data][currency]", "usd")
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)))
  params.set("line_items[0][price_data][product_data][name]", String(script.title || "OrdainedPro Script"))
  params.set("line_items[0][price_data][product_data][description]", "Digital ceremony script from OrdainedPro")
  params.set("payment_intent_data[transfer_data][destination]", connectAccount.stripe_account_id)
  if (applicationFeeAmount > 0) {
    params.set("payment_intent_data[application_fee_amount]", String(applicationFeeAmount))
  }
  params.set("metadata[scriptId]", String(scriptId))
  params.set("metadata[scriptIds]", JSON.stringify([String(scriptId)]))
  params.set("metadata[sellerUserId]", sellerUserId)
  params.set("metadata[platformFee]", String(applicationFeeAmount / 100))
  params.set("metadata[source]", "script_marketplace")
  params.set("metadata[siteUrl]", siteUrl)
  if (buyerEmail) {
    params.set("customer_email", buyerEmail)
    params.set("metadata[buyerEmail]", buyerEmail)
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })

  const stripeData = await stripeResponse.json().catch(() => ({}))

  if (!stripeResponse.ok) {
    console.error("Stripe script checkout error:", stripeData)
    return NextResponse.json(
      { error: stripeData?.error?.message || "Unable to create script checkout session." },
      { status: stripeResponse.status }
    )
  }

  return NextResponse.json({
    id: stripeData.id,
    url: stripeData.url,
    applicationFeeAmount,
  })
}
