import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  if (!paymentId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Missing required invoice payment information." },
      { status: 400 }
    )
  }

  const requestOrigin = request.nextUrl.origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin
  const params = new URLSearchParams()
  params.set("mode", "payment")
  params.set("client_reference_id", paymentId)
  params.set("success_url", `${siteUrl}/pay/invoice/${paymentId}?status=success`)
  params.set("cancel_url", `${siteUrl}/pay/invoice/${paymentId}?status=cancelled`)
  params.set("line_items[0][quantity]", "1")
  params.set("line_items[0][price_data][currency]", "usd")
  params.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)))
  params.set("line_items[0][price_data][product_data][name]", `Wedding Invoice ${invoiceNumber}`)
  params.set(
    "line_items[0][price_data][product_data][description]",
    body.coupleName ? `Ceremony services for ${body.coupleName}` : "Wedding ceremony services"
  )
  params.set("metadata[paymentId]", paymentId)
  params.set("metadata[invoiceNumber]", invoiceNumber)
  if (body.coupleId) params.set("metadata[coupleId]", String(body.coupleId))
  if (body.officiantId) params.set("metadata[officiantId]", String(body.officiantId))
  if (body.coupleEmail) params.set("customer_email", String(body.coupleEmail))

  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  }

  if (body.stripeAccountId) {
    headers["Stripe-Account"] = String(body.stripeAccountId)
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
