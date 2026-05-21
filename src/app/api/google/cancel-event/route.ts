import { NextRequest, NextResponse } from "next/server"
import { cancelGoogleCalendarEvent, isGoogleCalendarConfigured } from "@/lib/google-calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar is not configured on the server." },
      { status: 500 }
    )
  }

  try {
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing Google Calendar event ID." },
        { status: 400 }
      )
    }

    await cancelGoogleCalendarEvent(eventId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel Google Calendar event."
    const status = message.includes("not connected") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

