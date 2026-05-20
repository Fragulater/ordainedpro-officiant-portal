import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))

  if (!process.env.STRIPE_SECRET_KEY) {
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

  return NextResponse.json(
    {
      error: "Stripe checkout creation is reserved for the upcoming connected-account implementation.",
      placeholder: true,
    },
    { status: 501 }
  )
}
