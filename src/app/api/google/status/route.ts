import { NextResponse } from "next/server"
import { getGoogleAccessToken, isGoogleCalendarConfigured } from "@/lib/google-calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json({ configured: false, connected: false })
  }

  try {
    const accessToken = await getGoogleAccessToken()
    return NextResponse.json({
      configured: true,
      connected: Boolean(accessToken),
    })
  } catch {
    return NextResponse.json({
      configured: true,
      connected: false,
    })
  }
}
