import { NextResponse } from "next/server"
import { checkAndSendTaskReminders } from "@/lib/task-reminders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("[REMINDERS] Starting reminder check...")
    const result = await checkAndSendTaskReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[REMINDERS] Fatal error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Task Reminders",
    usage: "POST to check and send pending reminders",
  })
}
