import { NextRequest, NextResponse } from "next/server"
import {
  StripeEvent,
  expandStripeEventObject,
  getSupabaseAdmin,
  mapStripeSubscriptionStatus,
  unixToIso,
  verifyStripeWebhookSignature,
} from "@/lib/stripe-webhook"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.")
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 })
  }

  if (!verifyStripeWebhookSignature(payload, signature, webhookSecret)) {
    console.error("Rejected Stripe platform webhook with invalid signature.")
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
      await handleCheckoutSessionCompleted(eventObject)
    } else if (event.type.startsWith("customer.subscription.")) {
      await handleSubscriptionEvent(eventObject, event.type)
    } else if (event.type.startsWith("invoice.")) {
      await handleInvoiceEvent(eventObject, event.type)
    }

    return NextResponse.json({ received: true, type: event.type })
  } catch (error: any) {
    console.error("Stripe platform webhook error:", error)
    return NextResponse.json(
      { error: error?.message || "Unable to process Stripe webhook." },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Record<string, any>) {
  if (session.mode === "subscription" && session.subscription) {
    await upsertSubscriptionFromStripe({
      subscriptionId: String(session.subscription),
      customerId: session.customer ? String(session.customer) : null,
      userId: session.metadata?.userId || session.client_reference_id,
      tier: session.metadata?.tier,
      status: "active",
    })
  }

  if (session.mode === "payment" && session.client_reference_id) {
    await markPaymentPaid(String(session.client_reference_id), "Stripe Checkout", {
      stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : null,
    })
  }
}

async function handleSubscriptionEvent(subscription: Record<string, any>, eventType: string) {
  const status = eventType === "customer.subscription.deleted"
    ? "canceled"
    : mapStripeSubscriptionStatus(subscription.status)

  await upsertSubscriptionFromStripe({
    subscriptionId: String(subscription.id),
    customerId: subscription.customer ? String(subscription.customer) : null,
    userId: subscription.metadata?.userId,
    tier: subscription.metadata?.tier,
    status,
    currentPeriodStart: unixToIso(subscription.current_period_start),
    currentPeriodEnd: unixToIso(subscription.current_period_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  })
}

async function handleInvoiceEvent(invoice: Record<string, any>, eventType: string) {
  const paymentId = invoice.metadata?.paymentId || invoice.parent?.subscription_details?.metadata?.paymentId
  const subscriptionId =
    invoice.subscription ||
    invoice.parent?.subscription_details?.subscription ||
    invoice.lines?.data?.[0]?.subscription

  if (paymentId && eventType === "invoice.paid") {
    await markPaymentPaid(String(paymentId), "Stripe Invoice")
  }

  if (paymentId && (eventType === "invoice.payment_failed" || eventType === "invoice.payment_action_required")) {
    await markPaymentOverdue(String(paymentId))
  }

  if (subscriptionId) {
    const subscription = await fetchStripeSubscription(String(subscriptionId))
    if (subscription) {
      await handleSubscriptionEvent(subscription, "customer.subscription.updated")
    }
  }
}

async function fetchStripeSubscription(subscriptionId: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return null

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
    },
    cache: "no-store",
  })

  if (!response.ok) return null
  return response.json()
}

async function upsertSubscriptionFromStripe(input: {
  subscriptionId: string
  customerId: string | null
  userId?: string | null
  tier?: string | null
  status: "active" | "canceled" | "past_due"
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
}) {
  const supabase = getSupabaseAdmin()
  let userId = input.userId || null

  if (!userId) {
    const { data } = await supabase
      .from("subscriptions")
      .select("user_id")
      .or(`stripe_subscription_id.eq.${input.subscriptionId},stripe_customer_id.eq.${input.customerId || ""}`)
      .maybeSingle()

    userId = data?.user_id || null
  }

  if (!userId) {
    console.warn("Stripe subscription event missing user metadata; skipping subscription upsert.", {
      subscriptionId: input.subscriptionId,
      customerId: input.customerId,
    })
    return
  }

  const tier = input.tier === "professional" ? "professional" : "aspirant"

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        tier,
        status: input.status,
        stripe_subscription_id: input.subscriptionId,
        stripe_customer_id: input.customerId,
        current_period_start: input.currentPeriodStart || null,
        current_period_end: input.currentPeriodEnd || null,
        cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) throw error
}

async function markPaymentPaid(
  paymentId: string,
  paymentMethod: string,
  options: { stripePaymentIntentId?: string | null } = {}
) {
  const numericPaymentId = Number(paymentId)
  if (!Number.isFinite(numericPaymentId)) return

  const updates: Record<string, any> = {
    status: "paid",
    paid_date: new Date().toISOString().slice(0, 10),
    payment_method: paymentMethod,
    updated_at: new Date().toISOString(),
  }

  if (options.stripePaymentIntentId) {
    updates.stripe_payment_intent_id = options.stripePaymentIntentId
  }

  const { error } = await getSupabaseAdmin()
    .from("payments")
    .update(updates)
    .eq("id", numericPaymentId)

  if (error) throw error
}

async function markPaymentOverdue(paymentId: string) {
  const numericPaymentId = Number(paymentId)
  if (!Number.isFinite(numericPaymentId)) return

  const { error } = await getSupabaseAdmin()
    .from("payments")
    .update({
      status: "overdue",
      updated_at: new Date().toISOString(),
    })
    .eq("id", numericPaymentId)

  if (error) throw error
}
