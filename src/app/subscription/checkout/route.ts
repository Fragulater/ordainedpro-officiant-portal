import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/supabase/utils/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionPlan = "aspirant" | "professional";

function getPlan(value: string | null): SubscriptionPlan {
  return value === "aspirant" ? "aspirant" : "professional";
}

function getPriceId(plan: SubscriptionPlan) {
  return plan === "professional"
    ? process.env.STRIPE_PROFESSIONAL_PRICE_ID
    : process.env.STRIPE_ASPIRANT_PRICE_ID;
}

function setupResponse(missing: string, plan: SubscriptionPlan) {
  return new NextResponse(
    `<!doctype html>
      <html>
        <head>
          <title>Subscription Checkout Setup Needed</title>
          <style>
            body { margin: 0; font-family: Arial, sans-serif; background: #f3f8ff; color: #07172f; }
            main { max-width: 720px; margin: 64px auto; background: white; border: 1px solid #d8e8ff; border-radius: 12px; padding: 32px; box-shadow: 0 12px 28px rgba(15, 39, 77, 0.08); }
            code { display: inline-block; background: #f1f5f9; border: 1px solid #dbe3ef; border-radius: 6px; padding: 3px 7px; }
            a { color: #155dfc; font-weight: 700; }
          </style>
        </head>
        <body>
          <main>
            <h1>Subscription checkout needs setup</h1>
            <p>The ${plan} checkout route is wired, but Stripe cannot create the session yet because this value is missing:</p>
            <p><code>${missing}</code></p>
            <p>Add the correct Stripe recurring Price ID in <code>.env.local</code>, then restart the dev server.</p>
            <p><a href="/ordination/offer">Return to Ordination Offer</a></p>
          </main>
        </body>
      </html>`,
    { status: 501, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function getSafeReturnTo(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  if (!returnTo) return "/ordination/next-step";

  try {
    const parsed = new URL(returnTo, request.nextUrl.origin);
    if (parsed.origin !== request.nextUrl.origin) return "/ordination/next-step";
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "/ordination/next-step";
  }
}

export async function GET(request: NextRequest) {
  const plan = getPlan(request.nextUrl.searchParams.get("plan"));
  const priceId = getPriceId(plan);
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return setupResponse("STRIPE_SECRET_KEY", plan);
  }

  if (!priceId) {
    return setupResponse(
      plan === "professional" ? "STRIPE_PROFESSIONAL_PRICE_ID" : "STRIPE_ASPIRANT_PRICE_ID",
      plan
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth", request.nextUrl.origin);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const returnTo = getSafeReturnTo(request);
  const successUrl = new URL(returnTo, siteUrl);
  successUrl.searchParams.set("subscription", "success");
  successUrl.searchParams.set("plan", plan);
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL(returnTo, siteUrl);
  cancelUrl.searchParams.set("subscription", "cancelled");
  cancelUrl.searchParams.set("plan", plan);

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("client_reference_id", user.id);
  params.set("customer_email", user.email || "");
  params.set("success_url", successUrl.toString());
  params.set("cancel_url", cancelUrl.toString());
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[userId]", user.id);
  params.set("metadata[tier]", plan);
  params.set("subscription_data[metadata][userId]", user.id);
  params.set("subscription_data[metadata][tier]", plan);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const stripeData = await stripeResponse.json().catch(() => ({}));

  if (!stripeResponse.ok || !stripeData?.url) {
    return new NextResponse(
      `Unable to create Stripe checkout session: ${stripeData?.error?.message || "Unknown Stripe error."}`,
      { status: stripeResponse.status || 500 }
    );
  }

  return NextResponse.redirect(stripeData.url);
}
