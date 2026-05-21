import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const officiantId = String(body.officiantId || "").trim()
    const coupleName = String(body.coupleName || "").trim()
    const email = String(body.email || "").trim()
    const phone = String(body.phone || "").trim()
    const weddingDate = String(body.weddingDate || "").trim()
    const bestTimeToContact = String(body.bestTimeToContact || "").trim()
    const message = String(body.message || "").trim()

    if (!officiantId || !coupleName || !email || !phone || !weddingDate || !bestTimeToContact) {
      return NextResponse.json(
        { error: "Please complete name, email, phone, wedding date, and best time to contact." },
        { status: 400 }
      )
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Quote requests are not configured yet." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,user_id,full_name,business_name,email")
      .or(`id.eq.${officiantId},user_id.eq.${officiantId}`)
      .maybeSingle()

    if (profileError) {
      console.error("Unable to load quote recipient:", profileError)
      return NextResponse.json({ error: "Unable to load this officiant." }, { status: 500 })
    }

    if (!profile?.email) {
      return NextResponse.json({ error: "This officiant is not available for quote requests." }, { status: 404 })
    }

    const officiantName = profile.business_name || profile.full_name || "Wedding Officiant"
    const subject = `Wedding quote request from ${coupleName}`
    const textMessage = [
      `New quote request for ${officiantName}`,
      "",
      `Name: ${coupleName}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Wedding date: ${weddingDate}`,
      `Best time to call/contact: ${bestTimeToContact}`,
      "",
      "Message:",
      message || "No additional message provided.",
    ].join("\n")

    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      const html = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin: 0 0 12px;">New wedding quote request</h2>
          <p>A couple requested a quote from your public OrdainedPro profile.</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
            <tr><td style="padding: 8px; font-weight: 700;">Name</td><td style="padding: 8px;">${escapeHtml(coupleName)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Email</td><td style="padding: 8px;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Phone</td><td style="padding: 8px;">${escapeHtml(phone)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Wedding Date</td><td style="padding: 8px;">${escapeHtml(weddingDate)}</td></tr>
            <tr><td style="padding: 8px; font-weight: 700;">Best Time</td><td style="padding: 8px;">${escapeHtml(bestTimeToContact)}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px;">
            ${escapeHtml(message || "No additional message provided.").replace(/\n/g, "<br>")}
          </div>
        </div>
      `

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "OrdainedPro Quotes <info@ordainedpro.com>",
          reply_to: email,
          to: [profile.email],
          subject,
          html,
          text: textMessage,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error("Quote email failed:", error)
        return NextResponse.json({ error: "Unable to send the quote request." }, { status: 500 })
      }

      const data = await response.json().catch(() => ({}))
      return NextResponse.json({ success: true, messageId: data.id })
    }

    console.log("[QUOTE REQUEST] Would send email:", {
      to: profile.email,
      subject,
      message: textMessage,
    })

    return NextResponse.json({
      success: true,
      note: "Quote request logged. Add RESEND_API_KEY to enable email delivery.",
    })
  } catch (error) {
    console.error("Quote request error:", error)
    return NextResponse.json({ error: "Unable to send quote request." }, { status: 500 })
  }
}
