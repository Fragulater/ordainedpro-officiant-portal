"use client"

import { useState } from "react"
import { Calendar, Loader2, Mail, Phone, Send, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PublicOfficiantQuoteFormProps {
  officiantId: string
  officiantName: string
}

const initialForm = {
  coupleName: "",
  email: "",
  phone: "",
  weddingDate: "",
  bestTimeToContact: "",
  message: "",
}

export function PublicOfficiantQuoteForm({ officiantId, officiantName }: PublicOfficiantQuoteFormProps) {
  const [form, setForm] = useState(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (status !== "idle") {
      setStatus("idle")
      setErrorMessage("")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus("idle")
    setErrorMessage("")

    try {
      const response = await fetch("/api/officiant-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officiantId, ...form }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || "Unable to send quote request right now.")
      }

      setForm(initialForm)
      setStatus("success")
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unable to send quote request right now.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-gray-950">Ask for a Quote</CardTitle>
        <CardDescription>Send your wedding details directly to {officiantName}.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="couple-name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="couple-name"
                required
                value={form.coupleName}
                onChange={(event) => updateField("coupleName", event.target.value)}
                className="pl-9"
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quote-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="quote-email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="pl-9"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="quote-phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="pl-9"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wedding-date">Wedding Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="wedding-date"
                  required
                  type="date"
                  value={form.weddingDate}
                  onChange={(event) => updateField("weddingDate", event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="best-time">Best Time to Call/Contact</Label>
              <Input
                id="best-time"
                required
                value={form.bestTimeToContact}
                onChange={(event) => updateField("bestTimeToContact", event.target.value)}
                placeholder="Weekdays after 5 PM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quote-message">Message</Label>
            <Textarea
              id="quote-message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Tell the officiant about your ceremony style, venue, guest count, or any questions."
              rows={4}
            />
          </div>

          {status === "success" && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Your quote request was sent. The officiant can reply directly to your email.
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Quote Request
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
