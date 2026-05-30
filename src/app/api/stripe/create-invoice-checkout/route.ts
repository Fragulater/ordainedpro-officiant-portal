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

function calculateApplicationFee(amount: number) {
  const percent = Number(process.env.STRIPE_PLATFORM_INVOICE_FEE_PERCENT || 0)
  const fixed = Number(process.env.STRIPE_PLATFORM_INVOICE_FEE_FIXED_CENTS || 0)
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
        nextStep: "Add STRIPE_SECRET_KEY and connected-account details when the Stripe payment flow is ready.",
        invoice: {
          invoiceNumber: body.invoiceNumber,
          amount: body.amount,
          coupleId: body.coupleId,
          officiantId: body.officiantId,
        },
      },
      { status: 501 }
    )
  }

  const amount = Number(body.amount || 0)
  const paymentId = String(body.paymentId || "")
  const invoiceNumber = String(body.invoiceNumber || "Invoice")
  const officiantId = String(body.officiantId || "")

  if (!paymentId || !officiantId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Missing required invoice payment information." },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "Server payment records are not configured." },
      { status: 501 }
    )
  }

  const { data: connectAccount, error: connectError } = await supabase
    .from("stripe_connect_accounts")
    .select("stripe_account_id,charges_enabled,onboarding_complete")
    .eq("user_id", officiantId)
    .maybeSingle()

  if (connectError) {
    return NextResponse.json({ error: connectError.message }, { status: 500 })
  }

  if (!connectAccount?.stripe_account_id || !connectAccount.charges_enabled) {
    return NextResponse.json(
      {
        error:
          "This officiant has not finished Stripe payout setup yet. Please contact the officiant before paying online.",
      },
      { status: 400 }
    )
  }

  const requestOrigin = request.nextUrl.origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin
  const params = new URLSearchParams()
  params.set("mode", "payment")
  params.set("client_reference_id", paymentId)
  params.set("success_url", `${siteUrl}/pay/invoice/${paymentId}?status=success&session_id={CHECKOUT_SESSION_ID}`)
  params.set("cancel_url", `${siteUrl}/pay/invoice/${paymentId}?status=cancelled`)
  params.set("line_items[0][quantity]", "1")
  params.set("line_items[0][price_data][currency]", "usd")
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)))
  params.set("line_items[0][price_data][product_data][name]", `Ceremony Invoice ${invoiceNumber}`)
  params.set(
    "line_items[0][price_data][product_data][description]",
    body.coupleName ? `Ceremony services for ${body.coupleName}` : "Ceremony services"
  )
  params.set("metadata[paymentId]", paymentId)
  params.set("metadata[invoiceNumber]", invoiceNumber)
  if (body.coupleId) params.set("metadata[coupleId]", String(body.coupleId))
  if (body.officiantId) params.set("metadata[officiantId]", String(body.officiantId))
  if (body.coupleEmail) params.set("customer_email", String(body.coupleEmail))

  const applicationFeeAmount = calculateApplicationFee(amount)
  params.set("payment_intent_data[transfer_data][destination]", connectAccount.stripe_account_id)
  if (applicationFeeAmount > 0) {
    params.set("payment_intent_data[application_fee_amount]", String(applicationFeeAmount))
    params.set("metadata[platformFeeCents]", String(applicationFeeAmount))
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body: params,
  })

  const stripeData = await stripeResponse.json().catch(() => ({}))

  if (!stripeResponse.ok) {
    console.error("Stripe invoice checkout error:", stripeData)
    return NextResponse.json(
      { error: stripeData?.error?.message || "Unable to create Stripe checkout session." },
      { status: stripeResponse.status }
    )
  }

  return NextResponse.json({
    id: stripeData.id,
    url: stripeData.url,
  })
}
