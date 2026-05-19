import { NextRequest, NextResponse } from "next/server"
import { createGoogleMeetEvent, isGoogleCalendarConfigured } from "@/lib/google-calendar"

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
    const body = await request.json()
    const {
      subject,
      body: description,
      date,
      time,
      duration,
      attendees,
      timeZone,
    } = body

    if (!subject || !date || !time || !duration || !timeZone) {
      return NextResponse.json(
        { error: "Missing required fields for Google Meet generation." },
        { status: 400 }
      )
    }

    const startDate = new Date(`${date}T${time}`)
    const endDate = new Date(startDate.getTime() + Number(duration) * 60_000)

    const event = await createGoogleMeetEvent({
      summary: subject,
      description: description || "",
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      timeZone,
      attendees: Array.isArray(attendees) ? attendees : [],
    })

    const meetLink =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((entry: { entryPointType?: string }) => entry.entryPointType === "video")?.uri ||
      ""

    return NextResponse.json({
      id: event.id,
      meetLink,
      calendarEventLink: event.htmlLink || "",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create Google Meet event."
    const status = message.includes("not connected") ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
