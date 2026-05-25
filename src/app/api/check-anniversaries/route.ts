import { NextResponse } from "next/server"
import { checkAndSendAnniversaryReminders } from "@/lib/anniversary-reminders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("[ANNIVERSARIES] Starting anniversary reminder check...")
    const result = await checkAndSendAnniversaryReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[ANNIVERSARIES] Fatal error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Anniversary Reminders",
    usage: "POST to check and send pending anniversary congratulations",
  })
}
