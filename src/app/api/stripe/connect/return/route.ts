import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status")
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const url = new URL("/", baseUrl)
  url.searchParams.set("dashboard", "subscription")
  url.searchParams.set("stripe_connect", status === "complete" ? "complete" : "refresh")

  return NextResponse.redirect(url)
}
