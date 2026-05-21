"use client"

import { useState } from "react"
import { CreditCard, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type InvoicePaymentButtonProps = {
  paymentId: number
  amount: number
  invoiceNumber: string
  coupleId: number
  officiantId: string
  coupleEmail?: string | null
  coupleName: string
  disabled?: boolean
}

export function InvoicePaymentButton({
  paymentId,
  amount,
  invoiceNumber,
  coupleId,
  officiantId,
  coupleEmail,
  coupleName,
  disabled,
}: InvoicePaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleCheckout = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/stripe/create-invoice-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          amount,
          invoiceNumber,
          coupleId,
          officiantId,
          coupleEmail,
          coupleName,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.url) {
        setMessage(data.error || "Online card payments are not configured yet. Please contact your officiant.")
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Unable to start invoice checkout:", error)
      setMessage("Unable to start checkout. Please contact your officiant.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={disabled || isLoading}
        onClick={handleCheckout}
      >
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
        Make a payment
      </Button>
      {message && <p className="text-sm text-amber-700">{message}</p>}
    </div>
  )
}
