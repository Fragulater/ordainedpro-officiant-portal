"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type PublicReview = {
  id: string;
  reviewer_name: string | null;
  rating: number;
  review_text: string;
  created_at: string | null;
};

type PublicOfficiantReviewsProps = {
  rating: number;
  totalReviews: number;
  reviews: PublicReview[];
};

function ReviewStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} star rating`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSize} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function formatReviewDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <div className="rounded-lg border border-yellow-100 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-950">
            {review.reviewer_name || "Wedding Couple"}
          </p>
          {formatReviewDate(review.created_at) ? (
            <p className="text-xs text-gray-500">{formatReviewDate(review.created_at)}</p>
          ) : null}
        </div>
        <ReviewStars rating={Number(review.rating || 0)} />
      </div>
      <p className="line-clamp-4 text-sm leading-6 text-gray-700">{review.review_text}</p>
    </div>
  );
}

export function PublicOfficiantReviews({
  rating,
  totalReviews,
  reviews,
}: PublicOfficiantReviewsProps) {
  const hasReviews = totalReviews > 0;
  const visibleReviews = reviews.slice(0, 3);

  return (
    <section className="rounded-lg border border-yellow-100 bg-yellow-50/70 p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold uppercase tracking-wide text-gray-600">
          Reviews
        </h2>
      </div>

      <div className="rounded-lg bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-gray-950">
              {hasReviews ? rating.toFixed(1) : "No rating"}
            </p>
            <p className="text-xs text-gray-500">
              {hasReviews
                ? `${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}`
                : "No reviews yet"}
            </p>
          </div>
          <ReviewStars rating={hasReviews ? rating : 0} size="md" />
        </div>
      </div>

      {hasReviews ? (
        <div className="mt-3 space-y-3">
          {visibleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-yellow-200 bg-white text-yellow-800 hover:bg-yellow-100">
                View all reviews
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Couple Reviews</DialogTitle>
                <DialogDescription>
                  {rating.toFixed(1)} average from {totalReviews}{" "}
                  {totalReviews === 1 ? "review" : "reviews"}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-yellow-200 bg-white p-3 text-sm leading-6 text-gray-600">
          This officiant has not received public reviews yet.
        </p>
      )}
    </section>
  );
}
