"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type OfficiantReviewFormProps = {
  officiantId: string;
  officiantName: string;
  coupleId?: string;
  suggestedName?: string;
};

export function OfficiantReviewForm({
  officiantId,
  officiantName,
  coupleId,
  suggestedName = "",
}: OfficiantReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(suggestedName);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const activeRating = hoverRating || rating;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }

    if (reviewText.trim().length < 10) {
      setError("Please write a short review before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/officiant-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officiantId,
          coupleId,
          reviewerName,
          reviewerEmail,
          rating,
          reviewText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit review");
      }

      setSubmitted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-3 flex justify-center">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className="h-6 w-6 fill-yellow-400 text-yellow-400"
            />
          ))}
        </div>
        <h2 className="text-xl font-bold text-green-900">Thank you</h2>
        <p className="mt-2 text-sm leading-6 text-green-800">
          Your review has been shared with {officiantName}. It will help future
          couples feel more confident choosing their officiant.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label>Star Rating</Label>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= activeRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="reviewer-name">Name</Label>
          <Input
            id="reviewer-name"
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            placeholder="Your name"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="reviewer-email">Email (optional)</Label>
          <Input
            id="reviewer-email"
            type="email"
            value={reviewerEmail}
            onChange={(event) => setReviewerEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="review-text">Review</Label>
        <Textarea
          id="review-text"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="Share a few words about your experience..."
          className="mt-1 min-h-32"
          maxLength={1200}
        />
        <p className="mt-1 text-xs text-gray-500">
          {reviewText.length}/1,200 characters
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting Review..." : "Submit Review"}
      </Button>
    </form>
  );
}
