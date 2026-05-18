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
    const { userId, planType, cardNonce } = body;

    if (!userId || !planType) {
      return NextResponse.json(
        { error: "Missing required fields: userId, planType" },
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

    // Get current subscription and customer info
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: "No subscription record found. Please create a new subscription." },
        { status: 404 }
      );
    }

    const customerId = subscription.square_customer_id;

    // Cancel existing subscription if any
    if (subscription.square_subscription_id && subscription.status !== "canceled") {
      try {
        await squareClient.subscriptions.cancel(subscription.square_subscription_id);
      } catch (cancelError) {
        console.warn("Could not cancel existing subscription:", cancelError);
        // Continue anyway - might already be canceled
      }
    }

    // Create new card if nonce provided
    let cardId: string | undefined;
    if (cardNonce) {
      const cardResponse = await squareClient.cards.create({
        idempotencyKey: `card_${userId}_${Date.now()}`,
        sourceId: cardNonce,
        card: {
          customerId: customerId,
        },
      });

      if (!cardResponse.card?.id) {
        console.error("Square card creation error:", cardResponse);
        return NextResponse.json(
          { error: "Failed to save payment method" },
          { status: 500 }
        );
      }

      cardId = cardResponse.card.id;
    }

    // Create new subscription
    const startDate = new Date();
    const subscriptionResponse = await squareClient.subscriptions.create({
      idempotencyKey: `reactivate_${userId}_${Date.now()}`,
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: customerId,
      planVariationId: plan.id,
      cardId: cardId,
      startDate: startDate.toISOString().split("T")[0],
    });

    if (!subscriptionResponse.subscription?.id) {
      console.error("Square subscription creation error:", subscriptionResponse);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    const newSubscription = subscriptionResponse.subscription;

    // Update database
    const billingCycleEnd = new Date();
    billingCycleEnd.setDate(billingCycleEnd.getDate() + 30);

    await supabase
      .from("subscriptions")
      .update({
        square_subscription_id: newSubscription.id,
        plan_type: planType.toLowerCase(),
        status: "active",
        billing_cycle_start: startDate.toISOString(),
        billing_cycle_end: billingCycleEnd.toISOString(),
        price_cents: plan.price,
        canceled_at: null,
        data_deletion_scheduled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return NextResponse.json({
      success: true,
      subscription: {
        id: newSubscription.id,
        status: "active",
        planType: planType,
        billingCycleEnd: billingCycleEnd.toISOString(),
      },
      message: `Successfully upgraded to ${plan.name} plan`,
    });
  } catch (error: any) {
    console.error("Subscription reactivation error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription", details: error.message },
      { status: 500 }
    );
  }
}
