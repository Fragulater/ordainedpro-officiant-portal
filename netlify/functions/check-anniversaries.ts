import type { Config, Context } from "@netlify/functions"
import { checkAndSendAnniversaryReminders } from "../../src/lib/anniversary-reminders"

export default async (_request: Request, _context: Context) => {
  try {
    console.log("[ANNIVERSARIES] Scheduled anniversary reminder check started.")
    const result = await checkAndSendAnniversaryReminders()

    return Response.json({ success: true, ...result })
  } catch (error) {
    console.error("[ANNIVERSARIES] Scheduled check failed:", error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export const config: Config = {
  schedule: "@daily",
}
