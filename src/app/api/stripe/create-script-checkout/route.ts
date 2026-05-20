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

  return NextResponse.json(
    {
      error: "Script checkout is reserved for the upcoming Stripe Connect marketplace implementation.",
      placeholder: true,
    },
    { status: 501 }
  )
}
