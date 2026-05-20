import type { Config } from "@netlify/functions"
import { checkAndSendTaskReminders } from "../../src/lib/task-reminders"

export default async () => {
  try {
    const result = await checkAndSendTaskReminders()
    return Response.json({ success: true, ...result })
  } catch (error) {
    console.error("[REMINDERS] Scheduled reminder check failed:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export const config: Config = {
  schedule: "@daily",
}
