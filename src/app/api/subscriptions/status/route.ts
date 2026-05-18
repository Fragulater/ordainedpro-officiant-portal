import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/supabase/utils/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    // Get subscription from database
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !subscription) {
      // No subscription found - user is on free tier or not subscribed
      return NextResponse.json({
        status: "none",
        planType: null,
        isActive: false,
        canAccessFeatures: false,
        message: "No active subscription",
      });
    }

    // Calculate days remaining
    const now = new Date();
    const billingCycleEnd = new Date(subscription.billing_cycle_end);
    const daysRemaining = Math.max(
      0,
      Math.ceil((billingCycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Determine if user can still access features
    const canAccessFeatures =
      subscription.status === "active" ||
      subscription.status === "data_retention" ||
      (subscription.status === "canceled" && billingCycleEnd > now);

    // Build response
    const response: any = {
      status: subscription.status,
      planType: subscription.plan_type,
      isActive: subscription.status === "active",
      isDataRetention: subscription.status === "data_retention",
      isCanceled: subscription.status === "canceled",
      canAccessFeatures,
      billingCycleEnd: subscription.billing_cycle_end,
      daysRemaining,
      priceCents: subscription.price_cents,
    };

    // Add cancellation info if applicable
    if (subscription.status === "canceled") {
      response.canceledAt = subscription.canceled_at;
      response.dataDeletionScheduledAt = subscription.data_deletion_scheduled_at;

      if (subscription.data_deletion_scheduled_at) {
        const deletionDate = new Date(subscription.data_deletion_scheduled_at);
        response.daysUntilDataDeletion = Math.max(
          0,
          Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status", details: error.message },
      { status: 500 }
    );
  }
}
