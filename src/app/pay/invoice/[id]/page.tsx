import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { CalendarDays, CheckCircle2, FileText, Mail, MapPin } from "lucide-react"

import { InvoicePaymentButton } from "@/components/InvoicePaymentButton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

type PaymentRow = {
  id: number
  couple_id: number
  user_id: string
  invoice_number: string
  amount: number
  status: "pending" | "paid" | "overdue"
  due_date: string | null
  paid_date: string | null
  notes: string | null
  created_at: string
}

type CoupleRow = {
  bride_name: string
  bride_email: string | null
  groom_name: string
  groom_email: string | null
  address: string | null
}

type ProfileRow = {
  full_name: string | null
  business_name: string | null
  email: string | null
  phone: string | null
  website: string | null
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0))
}

function formatDate(value: string | null) {
  if (!value) return "No due date"
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

async function getInvoice(id: string) {
  const supabase = getServiceClient()
  if (!supabase) return null

  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle()

  if (error || !payment) {
    if (error) console.error("Unable to load invoice payment:", error)
    return null
  }

  const [{ data: couple }, { data: profile }] = await Promise.all([
    supabase
      .from("couples")
      .select("bride_name,bride_email,groom_name,groom_email,address")
      .eq("id", payment.couple_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name,business_name,email,phone,website")
      .eq("user_id", payment.user_id)
      .maybeSingle(),
  ])

  return {
    payment: payment as PaymentRow,
    couple: couple as CoupleRow | null,
    profile: profile as ProfileRow | null,
  }
}

export default async function InvoicePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const invoice = await getInvoice(id)

  if (!invoice) notFound()

  const { payment, couple, profile } = invoice
  const coupleName = [couple?.bride_name, couple?.groom_name].filter(Boolean).join(" & ") || "Wedding couple"
  const coupleEmail = couple?.bride_email || couple?.groom_email || null
  const officiantName = profile?.business_name || profile?.full_name || "Your wedding officiant"
  const isPaid = payment.status === "paid" || query.status === "success"

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl bg-blue-600 px-6 py-8 text-center text-white shadow-lg">
          <FileText className="mx-auto mb-3 h-10 w-10" />
          <h1 className="text-3xl font-bold">Wedding Invoice</h1>
          <p className="mt-2 text-blue-100">Secure payment portal from {officiantName}</p>
        </div>

        {query.status === "success" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 p-4 text-green-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Thank you. Stripe received your checkout session successfully.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{payment.invoice_number}</CardTitle>
                <CardDescription>{coupleName}</CardDescription>
              </div>
              <Badge className={isPaid ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                {isPaid ? "Paid" : payment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-slate-500">Amount Due</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{formatCurrency(payment.amount)}</p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="mt-1 font-semibold text-slate-950">{formatDate(payment.due_date)}</p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-1 font-semibold capitalize text-slate-950">{isPaid ? "paid" : payment.status}</p>
              </div>
            </div>

            {payment.notes && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Invoice note</p>
                <p className="mt-1 text-sm text-blue-800">{payment.notes}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Officiant</p>
                <p>{officiantName}</p>
                {profile?.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{profile.email}</p>}
                {profile?.phone && <p>{profile.phone}</p>}
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Wedding Couple</p>
                <p>{coupleName}</p>
                {couple?.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{couple.address}</p>}
                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Invoice created {formatDate(payment.created_at)}</p>
              </div>
            </div>

            <InvoicePaymentButton
              paymentId={payment.id}
              amount={Number(payment.amount)}
              invoiceNumber={payment.invoice_number}
              coupleId={payment.couple_id}
              officiantId={payment.user_id}
              coupleEmail={coupleEmail}
              coupleName={coupleName}
              disabled={isPaid || Number(payment.amount) <= 0}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
