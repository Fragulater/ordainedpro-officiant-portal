import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STRIPE_API_BASE = "https://api.stripe.com/v1"
const REFUND_FEE_RATE = 0.05

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || ""
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : ""
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function dollarsFromStripeAmount(amount?: number | null) {
  if (!amount || !Number.isFinite(amount)) return 0
  return Math.round(amount) / 100
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

async function stripeRequest(path: string, body: URLSearchParams) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return {
      ok: false,
      status: 501,
      data: { error: { message: "Stripe is not configured yet. Add STRIPE_SECRET_KEY in Netlify." } },
    }
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request)
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => ({}))
  const paymentId = Number(body.paymentId)
  const amount = Number(body.amount)
  const refundDate = String(body.refundDate || new Date().toISOString().slice(0, 10))
  const notes = String(body.notes || "").trim()

  if (!Number.isFinite(paymentId) || paymentId <= 0 || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Missing required refund information." }, { status: 400 })
  }

  const { data: payment, error: paymentError } = await auth.supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (paymentError) return NextResponse.json({ error: paymentError.message }, { status: 500 })
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 })
  if (!payment.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "This payment does not have a Stripe payment intent saved, so it cannot be refunded through Stripe." },
      { status: 400 }
    )
  }

  const { data: existingRefunds, error: refundsError } = await auth.supabase
    .from("payments")
    .select("amount")
    .eq("user_id", auth.user.id)
    .eq("refunded_payment_id", paymentId)
    .eq("payment_method", "refund")

  if (refundsError) return NextResponse.json({ error: refundsError.message }, { status: 500 })

  const alreadyRefunded = (existingRefunds || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
  const remainingRefundable = roundCurrency(Number(payment.amount || 0) - alreadyRefunded)

  if (amount > remainingRefundable) {
    return NextResponse.json(
      { error: `Refund amount cannot exceed the remaining Stripe-refundable amount of $${remainingRefundable.toFixed(2)}.` },
      { status: 400 }
    )
  }

  const params = new URLSearchParams()
  params.set("payment_intent", String(payment.stripe_payment_intent_id))
  params.set("amount", String(Math.round(amount * 100)))
  params.set("reverse_transfer", "true")
  params.set("refund_application_fee", "false")
  params.set("metadata[paymentId]", String(paymentId))
  params.set("metadata[coupleId]", String(payment.couple_id))
  params.set("metadata[officiantId]", auth.user.id)
  params.set("metadata[refundFeeRate]", String(REFUND_FEE_RATE))
  if (notes) params.set("metadata[notes]", notes.slice(0, 500))

  const stripeRefund = await stripeRequest("/refunds", params)
  if (!stripeRefund.ok) {
    console.error("Stripe refund error:", stripeRefund.data)
    return NextResponse.json(
      { error: stripeRefund.data?.error?.message || "Unable to create Stripe refund." },
      { status: stripeRefund.status }
    )
  }

  const refundedAmount = dollarsFromStripeAmount(stripeRefund.data.amount) || amount
  const refundFeeAmount = roundCurrency(refundedAmount * REFUND_FEE_RATE)
  const totalOfficiantCharge = roundCurrency(refundedAmount + refundFeeAmount)

  const { data: refundRow, error: insertError } = await auth.supabase
    .from("payments")
    .insert({
      user_id: auth.user.id,
      couple_id: payment.couple_id,
      invoice_number: `REF-${stripeRefund.data.id}`,
      amount: refundedAmount,
      status: "paid",
      due_date: refundDate || null,
      payment_method: "refund",
      notes: `Stripe refund - ${payment.invoice_number || `Payment ${payment.id}`}${notes ? `: ${notes}` : ""}`,
      refund_fee_rate: REFUND_FEE_RATE,
      refund_fee_amount: refundFeeAmount,
      total_officiant_charge: totalOfficiantCharge,
      stripe_refund_id: stripeRefund.data.id,
      refunded_payment_id: paymentId,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (insertError) {
    console.error("Stripe refund created but refund row insert failed:", {
      refundId: stripeRefund.data.id,
      error: insertError,
    })
    return NextResponse.json(
      {
        error: "Stripe refund was created, but OrdainedPro could not save the refund record. Please refresh before trying again.",
        stripeRefundId: stripeRefund.data.id,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    stripeRefundId: stripeRefund.data.id,
    refund: refundRow,
    refundFeeAmount,
    totalOfficiantCharge,
    note: "Stripe refunded the customer and reversed the connected-account transfer. The platform application fee was not refunded.",
  })
}
