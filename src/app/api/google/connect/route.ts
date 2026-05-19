import { NextRequest, NextResponse } from "next/server"
import { buildGoogleAuthUrl, isGoogleCalendarConfigured } from "@/lib/google-calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Google Calendar is not configured on the server." },
      { status: 500 }
    )
  }

  const next = request.nextUrl.searchParams.get("next") || "/"
  const authUrl = buildGoogleAuthUrl(next)
  return NextResponse.redirect(authUrl)
}
