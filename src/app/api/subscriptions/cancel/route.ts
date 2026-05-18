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
    const { userId, keepDataRetention = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    // Get current subscription from database
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const squareSubscriptionId = subscription.square_subscription_id;
    const customerId = subscription.square_customer_id;

    if (keepDataRetention) {
      // Switch to data retention plan instead of full cancellation
      // First, cancel current subscription
      if (squareSubscriptionId) {
        await squareClient.subscriptions.cancel(squareSubscriptionId);
      }

      // Create new data retention subscription
      const dataRetentionPlan = SQUARE_PLANS.DATA_RETENTION;
      const startDate = new Date(subscription.billing_cycle_end);

      const newSubscriptionResponse = await squareClient.subscriptions.create({
        idempotencyKey: `data_retention_${userId}_${Date.now()}`,
        locationId: process.env.SQUARE_LOCATION_ID!,
        customerId: customerId,
        planVariationId: dataRetentionPlan.id,
        startDate: startDate.toISOString().split("T")[0],
      });

      if (!newSubscriptionResponse.subscription?.id) {
        console.error("Data retention subscription error:", newSubscriptionResponse);
        return NextResponse.json(
          { error: "Failed to create data retention plan" },
          { status: 500 }
        );
      }

      const newSubscription = newSubscriptionResponse.subscription;
      const newBillingCycleEnd = new Date(startDate);
      newBillingCycleEnd.setDate(newBillingCycleEnd.getDate() + 30);

      // Update database
      await supabase
        .from("subscriptions")
        .update({
          square_subscription_id: newSubscription.id,
          plan_type: "data_retention",
          status: "data_retention",
          billing_cycle_start: startDate.toISOString(),
          billing_cycle_end: newBillingCycleEnd.toISOString(),
          price_cents: dataRetentionPlan.price,
          canceled_at: null,
          data_deletion_scheduled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return NextResponse.json({
        success: true,
        status: "data_retention",
        message: "Switched to data retention plan ($1.00/month)",
        billingCycleEnd: newBillingCycleEnd.toISOString(),
      });
    } else {
      // Full cancellation
      if (squareSubscriptionId) {
        const cancelResponse = await squareClient.subscriptions.cancel(squareSubscriptionId);

        if (!cancelResponse.subscription) {
          console.error("Square cancellation error:", cancelResponse);
          return NextResponse.json(
            { error: "Failed to cancel subscription" },
            { status: 500 }
          );
        }
      }

      // Calculate data deletion date (30 days after billing cycle ends)
      const billingCycleEnd = new Date(subscription.billing_cycle_end);
      const dataDeletionDate = new Date(billingCycleEnd);
      dataDeletionDate.setDate(dataDeletionDate.getDate() + 30);

      // Update database
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
          data_deletion_scheduled_at: dataDeletionDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return NextResponse.json({
        success: true,
        status: "canceled",
        message: "Subscription canceled",
        accessEndsAt: billingCycleEnd.toISOString(),
        dataDeletionAt: dataDeletionDate.toISOString(),
        daysRemaining: Math.ceil((billingCycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      });
    }
  } catch (error: any) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription", details: error.message },
      { status: 500 }
    );
  }
}
