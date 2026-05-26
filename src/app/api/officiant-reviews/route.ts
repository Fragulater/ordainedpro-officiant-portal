import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  user_id: string;
  rating: number | null;
  total_reviews: number | null;
};

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Review service is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const officiantId = cleanText(body.officiantId, 80);
    const reviewerName = cleanText(body.reviewerName, 160);
    const reviewerEmail = cleanText(body.reviewerEmail, 240);
    const reviewText = cleanText(body.reviewText, 1200);
    const rating = Number(body.rating);
    const coupleId =
      body.coupleId && Number.isFinite(Number(body.coupleId))
        ? Number(body.coupleId)
        : null;

    if (!officiantId) {
      return NextResponse.json(
        { error: "Missing officiant profile." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please choose a rating from 1 to 5 stars." },
        { status: 400 }
      );
    }

    if (reviewText.length < 10) {
      return NextResponse.json(
        { error: "Please write a short review before submitting." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,user_id,rating,total_reviews")
      .or(`id.eq.${officiantId},user_id.eq.${officiantId}`)
      .maybeSingle<ProfileRow>();

    if (profileError) {
      console.error("Unable to load review profile:", profileError);
      return NextResponse.json(
        { error: "Unable to find the officiant profile." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Unable to find the officiant profile." },
        { status: 404 }
      );
    }

    const { error: insertError } = await supabase
      .from("officiant_reviews")
      .insert({
        profile_id: profile.id,
        officiant_user_id: profile.user_id,
        couple_id: coupleId,
        reviewer_name: reviewerName || null,
        reviewer_email: reviewerEmail || null,
        rating,
        review_text: reviewText,
        status: "published",
      });

    if (insertError) {
      console.error("Unable to insert officiant review:", insertError);
      if (insertError.code === "PGRST205" || insertError.message?.includes("officiant_reviews")) {
        return NextResponse.json(
          {
            error:
              "Review storage is not installed yet. Run supabase-officiant-reviews.sql in Supabase, then try again.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Unable to save your review right now." },
        { status: 500 }
      );
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from("officiant_reviews")
      .select("rating")
      .eq("officiant_user_id", profile.user_id)
      .eq("status", "published");

    if (reviewsError) {
      console.error("Unable to recalculate reviews:", reviewsError);
      return NextResponse.json(
        { error: "Review saved, but the rating summary could not be updated." },
        { status: 500 }
      );
    }

    const totalReviews = reviews?.length || 0;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        rating: averageRating,
        total_reviews: totalReviews,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Unable to update profile rating summary:", updateError);
      return NextResponse.json(
        { error: "Review saved, but the profile summary could not be updated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rating: averageRating,
      totalReviews,
    });
  } catch (error) {
    console.error("Review submission failed:", error);
    return NextResponse.json(
      { error: "Unable to submit the review." },
      { status: 500 }
    );
  }
}
