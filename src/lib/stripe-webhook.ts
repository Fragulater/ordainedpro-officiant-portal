import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

export type StripeEvent = {
  id: string
  type: string
  account?: string
  data?: {
    object?: Record<string, any>
  }
}

const STRIPE_API_BASE = "https://api.stripe.com/v1"

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase service credentials are not configured.")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false

  const parts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=")
    if (!key || !value) return acc
    acc[key] = acc[key] || []
    acc[key].push(value)
    return acc
  }, {})

  const timestamp = parts.t?.[0]
  const signatures = parts.v1 || []

  if (!timestamp || signatures.length === 0) return false

  const timestampSeconds = Number(timestamp)
  if (!Number.isFinite(timestampSeconds)) return false

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds)
  if (ageSeconds > 300) return false

  const signedPayload = `${timestamp}.${payload}`
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex")

  return signatures.some((signature) => safeCompare(signature, expected))
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export async function retrieveStripeObject<T = Record<string, any>>(
  path: string,
  stripeAccountId?: string
): Promise<T | null> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) return null

  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
  }

  if (stripeAccountId) {
    headers["Stripe-Account"] = stripeAccountId
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    console.warn(`Unable to retrieve Stripe object ${path}:`, response.status, errorBody)
    return null
  }

  return response.json() as Promise<T>
}

export async function expandStripeEventObject(event: StripeEvent): Promise<Record<string, any>> {
  const eventObject = event.data?.object || {}
  const objectId = eventObject.id

  if (event.type.startsWith("checkout.session.") && objectId) {
    return (await retrieveStripeObject(`/checkout/sessions/${objectId}`, event.account)) || eventObject
  }

  if (event.type.startsWith("customer.subscription.") && objectId) {
    return (await retrieveStripeObject(`/subscriptions/${objectId}`, event.account)) || eventObject
  }

  if (event.type.startsWith("invoice.") && objectId) {
    return (await retrieveStripeObject(`/invoices/${objectId}`, event.account)) || eventObject
  }

  if (event.type.startsWith("payment_intent.") && objectId) {
    return (await retrieveStripeObject(`/payment_intents/${objectId}`, event.account)) || eventObject
  }

  if (event.type.startsWith("account.") && (objectId || event.account)) {
    return (await retrieveStripeObject(`/accounts/${objectId || event.account}`, event.account)) || eventObject
  }

  return eventObject
}

export function mapStripeSubscriptionStatus(status?: string): "active" | "canceled" | "past_due" {
  if (status === "active" || status === "trialing") return "active"
  if (status === "canceled") return "canceled"
  return "past_due"
}

export function unixToIso(value?: number | null) {
  if (!value) return null
  return new Date(value * 1000).toISOString()
}

export function dollarsFromStripeAmount(amount?: number | null) {
  if (!amount || !Number.isFinite(amount)) return 0
  return Math.round(amount) / 100
}
