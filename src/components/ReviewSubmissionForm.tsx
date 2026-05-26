"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ReviewSubmissionFormProps = {
  officiantId: string
  coupleId?: string
  suggestedName?: string
  officiantName: string
}

export function ReviewSubmissionForm({
  officiantId,
  coupleId,
  suggestedName,
  officiantName,
}: ReviewSubmissionFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewerName, setReviewerName] = useState(suggestedName || "")
  const [reviewerEmail, setReviewerEmail] = useState("")
  const [reviewText, setReviewText] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const visibleRating = hoverRating || rating

  const handleSubmit = async () => {
    setStatus("idle")
    setErrorMessage("")

    if (rating < 1) {
      setStatus("error")
      setErrorMessage("Please choose a star rating.")
      return
    }

    if (!reviewerName.trim()) {
      setStatus("error")
      setErrorMessage("Please enter your name.")
      return
    }

    if (!reviewText.trim()) {
      setStatus("error")
      setErrorMessage("Please write a short review.")
      return
    }

    setStatus("saving")

    try {
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
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to submit review.")
      }

      setStatus("saved")
    } catch (error) {
      console.error("Unable to submit officiant review:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit review.")
    }
  }

  if (status === "saved") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-7 w-7 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <h2 className="text-xl font-bold text-green-950">Thank you for your review.</h2>
          <p className="mt-2 text-sm leading-6 text-green-800">
            Your feedback has been saved and will help future couples learn more about {officiantName}.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Rating</Label>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="rounded-md p-1 transition hover:bg-yellow-50"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
            >
              <Star
                className={`h-9 w-9 ${
                  star <= visibleRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="reviewer-name">Your name</Label>
          <Input
            id="reviewer-name"
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reviewer-email">Email optional</Label>
          <Input
            id="reviewer-email"
            type="email"
            value={reviewerEmail}
            onChange={(event) => setReviewerEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">Review</Label>
        <Textarea
          id="review-text"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="Share a few words about your ceremony experience."
          className="min-h-[150px]"
        />
      </div>

      {status === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={status === "saving"}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {status === "saving" ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  )
}
