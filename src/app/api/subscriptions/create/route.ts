import { NextRequest, NextResponse } from "next/server";
import { squareClient, SQUARE_PLANS, isSquareConfigured } from "@/lib/square";
import { supabase } from "@/supabase/utils/client";

export async function POST(request: NextRequest) {
  try {
    // Check if Square is configured
    if (!isSquareConfigured()) {
      return NextResponse.json(
        { error: "Square is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, planType, cardNonce, email, fullName } = body;

    if (!userId || !planType || !cardNonce) {
      return NextResponse.json(
        { error: "Missing required fields: userId, planType, cardNonce" },
        { status: 400 }
      );
    }

    const plan = SQUARE_PLANS[planType as keyof typeof SQUARE_PLANS];
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    // Step 1: Create or get Square customer
    let customerId: string;

    // Check if customer already exists in our database
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("square_customer_id")
      .eq("user_id", userId)
      .single();

    if (existingProfile?.square_customer_id) {
      customerId = existingProfile.square_customer_id;
    } else {
      // Create new Square customer
      const customerResponse = await squareClient.customers.create({
        idempotencyKey: `customer_${userId}_${Date.now()}`,
        emailAddress: email,
        givenName: fullName?.split(" ")[0] || "",
        familyName: fullName?.split(" ").slice(1).join(" ") || "",
        referenceId: userId,
      });

      if (!customerResponse.customer?.id) {
        console.error("Square customer creation failed:", customerResponse);
        return NextResponse.json(
          { error: "Failed to create customer" },
          { status: 500 }
        );
      }

      customerId = customerResponse.customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ square_customer_id: customerId })
        .eq("user_id", userId);
    }

    // Step 2: Create card on file
    const cardResponse = await squareClient.cards.create({
      idempotencyKey: `card_${userId}_${Date.now()}`,
      sourceId: cardNonce,
      card: {
        customerId: customerId,
      },
    });

    if (!cardResponse.card?.id) {
      console.error("Square card creation failed:", cardResponse);
      return NextResponse.json(
        { error: "Failed to save payment method" },
        { status: 500 }
      );
    }

    const cardId = cardResponse.card.id;

    // Step 3: Create subscription
    const startDate = new Date();
    const subscriptionResponse = await squareClient.subscriptions.create({
      idempotencyKey: `subscription_${userId}_${Date.now()}`,
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: customerId,
      planVariationId: plan.id,
      cardId: cardId,
      startDate: startDate.toISOString().split("T")[0],
    });

    if (!subscriptionResponse.subscription?.id) {
      console.error("Square subscription creation failed:", subscriptionResponse);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    const subscription = subscriptionResponse.subscription;

    // Step 4: Save subscription to Supabase
    const billingCycleEnd = new Date();
    billingCycleEnd.setDate(billingCycleEnd.getDate() + 30);

    const { error: dbError } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: userId,
        square_subscription_id: subscription.id,
        square_customer_id: customerId,
        plan_type: planType.toLowerCase(),
        status: "active",
        billing_cycle_start: startDate.toISOString(),
        billing_cycle_end: billingCycleEnd.toISOString(),
        price_cents: plan.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (dbError) {
      console.error("Database error saving subscription:", dbError);
      // Don't fail the request, subscription was created in Square
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planType: planType,
        billingCycleEnd: billingCycleEnd.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription", details: error.message },
      { status: 500 }
    );
  }
}
