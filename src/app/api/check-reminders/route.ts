import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force Node.js runtime for Netlify compatibility
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendApiKey = process.env.RESEND_API_KEY!

export async function POST(request: Request) {
  try {
    console.log("[REMINDERS] Starting reminder check...")

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Query for pending reminders
    const today = new Date().toISOString().split("T")[0]

    const { data: tasks, error: queryError } = await supabase
      .from("tasks")
      .select(`
        id,
        task,
        due_date,
        due_time,
        priority,
        category,
        details,
        reminder_days,
        user_id,
        couple_id,
        couples (
          bride_name,
          groom_name,
          bride_email,
          groom_email
        ),
        officiant_profiles!tasks_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq("email_reminder", true)
      .eq("reminder_sent", false)
      .eq("completed", false)
      .not("due_date", "is", null)

    if (queryError) {
      console.error("[REMINDERS] Query error:", queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    console.log(`[REMINDERS] Found ${tasks?.length || 0} tasks with reminders enabled`)

    // Filter to tasks that need reminders today
    const tasksNeedingReminders = (tasks || []).filter((task: any) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      const reminderDate = new Date(dueDate)
      reminderDate.setDate(reminderDate.getDate() - (task.reminder_days || 1))
      const todayDate = new Date(today)
      return reminderDate <= todayDate
    })

    console.log(`[REMINDERS] ${tasksNeedingReminders.length} tasks need reminders today`)

    let sentCount = 0
    let errorCount = 0
    const results: any[] = []

    for (const task of tasksNeedingReminders) {
      try {
        const couple = task.couples as any
        const officiant = task.officiant_profiles as any

        // Build recipient list
        const recipients = [
          couple?.bride_email,
          couple?.groom_email,
          officiant?.email
        ].filter(Boolean)

        if (recipients.length === 0) {
          console.log(`[REMINDERS] Skipping task ${task.id} - no recipients`)
          continue
        }

        // Format due date
        const dueDate = new Date(task.due_date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        })

        // Priority label
        const priorityLabel: Record<string, string> = {
          low: "Low",
          medium: "Medium",
          high: "High",
          urgent: "Urgent"
        }

        // Send email via Resend API
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: "OrdainedPro <info@ordainedpro.com>",
            to: recipients,
            subject: `Task Reminder: ${task.task}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Task Reminder</h1>
              </div>

              <div style="padding: 30px; background: #f8fafc;">
                <p style="font-size: 16px; color: #374151;">
                  Hello! This is a reminder about an upcoming task for the wedding of
                  <strong>${couple?.bride_name || "Partner 1"} & ${couple?.groom_name || "Partner 2"}</strong>.
                </p>

                <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <h2 style="margin: 0 0 10px 0; color: #1e3a8a;">${task.task}</h2>

                  <p style="margin: 8px 0; color: #6b7280;">
                    <strong>Due Date:</strong> ${dueDate}
                    ${task.due_time ? ` at ${task.due_time}` : ""}
                  </p>

                  <p style="margin: 8px 0; color: #6b7280;">
                    <strong>Priority:</strong> ${priorityLabel[task.priority] || "Medium"}
                  </p>

                  ${task.category ? `
                  <p style="margin: 8px 0; color: #6b7280;">
                    <strong>Category:</strong> ${task.category}
                  </p>
                  ` : ""}

                  ${task.details ? `
                  <p style="margin: 8px 0; color: #6b7280;">
                    <strong>Details:</strong> ${task.details}
                  </p>
                  ` : ""}
                </div>

                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  This reminder was sent by ${officiant?.full_name || "Your Wedding Officiant"}
                </p>
              </div>

              <div style="background: #1e3a8a; padding: 15px; text-align: center;">
                <p style="color: #93c5fd; margin: 0; font-size: 12px;">
                  OrdainedPro Wedding Portal
                </p>
              </div>
            </div>
          `
          })
        })

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json()
          console.error(`[REMINDERS] Email error for task ${task.id}:`, emailError)
          errorCount++
          results.push({ taskId: task.id, status: "error", error: emailError.message || "Email send failed" })
        } else {
          // Mark reminder as sent
          await supabase
            .from("tasks")
            .update({
              reminder_sent: true,
              reminder_sent_at: new Date().toISOString()
            })
            .eq("id", task.id)

          sentCount++
          results.push({ taskId: task.id, status: "sent", recipients })
          console.log(`[REMINDERS] Sent reminder for task ${task.id} to ${recipients.join(", ")}`)
        }
      } catch (err: any) {
        console.error(`[REMINDERS] Error processing task ${task.id}:`, err)
        errorCount++
        results.push({ taskId: task.id, status: "error", error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      checked: tasks?.length || 0,
      needingReminders: tasksNeedingReminders.length,
      sent: sentCount,
      errors: errorCount,
      results
    })
  } catch (error: any) {
    console.error("[REMINDERS] Fatal error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Also allow GET for simple health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Task Reminders",
    usage: "POST to check and send pending reminders"
  })
}
