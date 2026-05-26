import { NextRequest, NextResponse } from "next/server"
import {
  StripeEvent,
  dollarsFromStripeAmount,
  expandStripeEventObject,
  getSupabaseAdmin,
  verifyStripeWebhookSignature,
} from "@/lib/stripe-webhook"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_CONNECT_WEBHOOK_SECRET is not configured.")
    return NextResponse.json({ error: "Stripe Connect webhook is not configured." }, { status: 500 })
  }

  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    console.error("Rejected Stripe Connect webhook with invalid signature.")
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 })
  }

  try {
    const eventObject = await expandStripeEventObject(event)

    if (event.type === "checkout.session.completed") {
      await handleMarketplaceCheckout(eventObject, event.account)
    } else if (event.type === "payment_intent.succeeded") {
      await handleMarketplacePaymentIntent(eventObject, event.account)
    } else if (event.type === "charge.refunded" || event.type === "refund.created") {
      console.log("Stripe Connect refund event received:", {
        type: event.type,
        connectedAccountId: event.account,
        objectId: eventObject.id,
      })
    } else if (event.type.startsWith("account.")) {
      console.log("Stripe Connect account event received:", {
        type: event.type,
        connectedAccountId: event.account,
        objectId: eventObject.id,
      })
    }

    return NextResponse.json({ received: true, type: event.type, account: event.account || null })
  } catch (error: any) {
    console.error("Stripe Connect webhook error:", error)
    return NextResponse.json(
      { error: error?.message || "Unable to process Stripe Connect webhook." },
      { status: 500 }
    )
  }
}

async function handleMarketplaceCheckout(session: Record<string, any>, connectedAccountId?: string) {
  if (session.mode !== "payment") return

  const paymentIntentId = session.payment_intent ? String(session.payment_intent) : null
  const metadata = session.metadata || {}

  await recordMarketplaceSale({
    sellerUserId: metadata.sellerUserId || metadata.userId,
    scriptId: metadata.scriptId,
    buyerEmail: session.customer_details?.email || session.customer_email || metadata.buyerEmail,
    amount: dollarsFromStripeAmount(session.amount_total),
    platformFee: dollarsFromStripeAmount(session.application_fee_amount) || Number(metadata.platformFee || 0),
    paymentIntentId,
    connectedAccountId,
  })
}

async function handleMarketplacePaymentIntent(paymentIntent: Record<string, any>, connectedAccountId?: string) {
  const metadata = paymentIntent.metadata || {}

  await recordMarketplaceSale({
    sellerUserId: metadata.sellerUserId || metadata.userId,
    scriptId: metadata.scriptId,
    buyerEmail: metadata.buyerEmail || paymentIntent.receipt_email,
    amount: dollarsFromStripeAmount(paymentIntent.amount_received || paymentIntent.amount),
    platformFee: Number(metadata.platformFee || 0),
    paymentIntentId: paymentIntent.id ? String(paymentIntent.id) : null,
    connectedAccountId,
  })
}

async function recordMarketplaceSale(input: {
  sellerUserId?: string | null
  scriptId?: string | number | null
  buyerEmail?: string | null
  amount: number
  platformFee: number
  paymentIntentId?: string | null
  connectedAccountId?: string
}) {
  const scriptId = Number(input.scriptId)
  if (!input.sellerUserId || !Number.isFinite(scriptId) || !input.paymentIntentId) {
    console.warn("Marketplace sale webhook missing metadata; skipping sale record.", {
      sellerUserId: input.sellerUserId,
      scriptId: input.scriptId,
      paymentIntentId: input.paymentIntentId,
      connectedAccountId: input.connectedAccountId,
    })
    return
  }

  const supabase = getSupabaseAdmin()

  const { data: existingSale, error: existingError } = await supabase
    .from("script_sales")
    .select("id")
    .eq("stripe_payment_intent_id", input.paymentIntentId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existingSale) return

  const platformFee = Number.isFinite(input.platformFee) ? input.platformFee : 0
  const netAmount = Math.max(input.amount - platformFee, 0)

  const { error: insertError } = await supabase
    .from("script_sales")
    .insert({
      user_id: input.sellerUserId,
      script_id: scriptId,
      buyer_email: input.buyerEmail || null,
      amount: input.amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      stripe_payment_intent_id: input.paymentIntentId,
    })

  if (insertError) throw insertError

  const { data: script, error: scriptError } = await supabase
    .from("scripts")
    .select("sales_count, earnings_total")
    .eq("id", scriptId)
    .maybeSingle()

  if (scriptError) throw scriptError

  const { error: updateError } = await supabase
    .from("scripts")
    .update({
      sales_count: Number(script?.sales_count || 0) + 1,
      earnings_total: Number(script?.earnings_total || 0) + netAmount,
      last_sale_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", scriptId)

  if (updateError) throw updateError
}

