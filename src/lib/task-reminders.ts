import { createClient } from "@supabase/supabase-js"

type ReminderTask = {
  id: number
  task: string
  due_date: string | null
  due_time: string | null
  priority: string | null
  category: string | null
  details: string | null
  reminder_days: number | null
  couples:
    | {
        bride_name?: string | null
        groom_name?: string | null
      }
    | null
  officiant_profiles:
    | {
        full_name?: string | null
        email?: string | null
      }
    | null
}

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

function getEnv(name: string) {
  const netlifyEnv = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (key: string) => string | undefined } }
  }).Netlify?.env?.get?.(name)

  return netlifyEnv || process.env[name]
}

export async function checkAndSendTaskReminders() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  const resendApiKey = getEnv("RESEND_API_KEY")

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase reminder environment variables.")
  }

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.")
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
        groom_name
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
    throw new Error(queryError.message)
  }

  const tasksNeedingReminders = ((tasks || []) as ReminderTask[]).filter((task) => {
    if (!task.due_date) return false

    const dueDate = new Date(task.due_date)
    dueDate.setHours(0, 0, 0, 0)

    const reminderDate = new Date(dueDate)
    reminderDate.setDate(reminderDate.getDate() - (task.reminder_days || 1))

    return reminderDate <= today
  })

  let sentCount = 0
  let errorCount = 0
  const results: Array<Record<string, unknown>> = []

  for (const task of tasksNeedingReminders) {
    try {
      const couple = task.couples
      const officiant = task.officiant_profiles
      const recipients = [officiant?.email].filter(Boolean) as string[]

      if (recipients.length === 0) {
        results.push({ taskId: task.id, status: "skipped", reason: "no officiant email" })
        continue
      }

      const dueDate = new Date(task.due_date || "").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
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
                  Hello! This is your private reminder about an upcoming task for
                  <strong>${couple?.bride_name || "Partner 1"} & ${couple?.groom_name || "Partner 2"}</strong>.
                </p>
                <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <h2 style="margin: 0 0 10px 0; color: #1e3a8a;">${task.task}</h2>
                  <p style="margin: 8px 0; color: #6b7280;"><strong>Due Date:</strong> ${dueDate}${task.due_time ? ` at ${task.due_time}` : ""}</p>
                  <p style="margin: 8px 0; color: #6b7280;"><strong>Priority:</strong> ${priorityLabel[task.priority || "medium"] || "Medium"}</p>
                  ${task.category ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Category:</strong> ${task.category}</p>` : ""}
                  ${task.details ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Details:</strong> ${task.details}</p>` : ""}
                </div>
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  This task reminder is only sent to the officiant and is not sent to the couple or client.
                </p>
              </div>
            </div>
          `,
        }),
      })

      if (!emailResponse.ok) {
        const emailError = await emailResponse.json()
        errorCount++
        results.push({ taskId: task.id, status: "error", error: emailError })
        continue
      }

      await supabase
        .from("tasks")
        .update({
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString(),
        })
        .eq("id", task.id)

      sentCount++
      results.push({ taskId: task.id, status: "sent", recipients })
    } catch (error) {
      errorCount++
      results.push({
        taskId: task.id,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return {
    checked: tasks?.length || 0,
    needingReminders: tasksNeedingReminders.length,
    sent: sentCount,
    errors: errorCount,
    results,
  }
}
