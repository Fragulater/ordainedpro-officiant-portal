import { NextRequest, NextResponse } from "next/server"
import { exchangeGoogleCode, persistGoogleTokens, getBaseUrl } from "@/lib/google-calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state") || "/"
  const error = request.nextUrl.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(new URL(`${state}?google_calendar_error=${encodeURIComponent(error)}`, getBaseUrl()))
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${state}?google_calendar_error=missing_code`, getBaseUrl()))
  }

  try {
    const tokenResponse = await exchangeGoogleCode(code)
    await persistGoogleTokens(tokenResponse)
    return NextResponse.redirect(new URL(`${state}?google_calendar_connected=1`, getBaseUrl()))
  } catch (err) {
    const message = err instanceof Error ? err.message : "google_callback_failed"
    return NextResponse.redirect(
      new URL(`${state}?google_calendar_error=${encodeURIComponent(message)}`, getBaseUrl())
    )
  }
}
