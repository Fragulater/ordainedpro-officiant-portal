import { createClient } from "@supabase/supabase-js"

type AnniversarySetting = {
  user_id: string
  reminder_days: number | null
  auto_send_enabled: boolean | null
}

type CeremonyRow = {
  couple_id: number
  user_id: string
  wedding_date: string | null
}

type CoupleRow = {
  id: number
  bride_name: string | null
  groom_name: string | null
  bride_email: string | null
  groom_email: string | null
}

type ProfileRow = {
  full_name: string | null
  business_name: string | null
  email: string | null
}

type ReminderRow = {
  id: number
  contact_status: "not_contacted" | "email_sent" | "marked_contacted"
  auto_email_sent_at: string | null
}

function getEnv(name: string) {
  const netlifyEnv = (globalThis as typeof globalThis & {
    Netlify?: { env?: { get?: (key: string) => string | undefined } }
  }).Netlify?.env?.get?.(name)

  return netlifyEnv || process.env[name]
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateOnly(dateString?: string | null) {
  if (!dateString) return null
  const [year, month, day] = dateString.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function getOrdinalSuffix(value: number) {
  const tens = value % 100
  if (tens >= 11 && tens <= 13) return "th"
  switch (value % 10) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}

function getNextAnniversary(weddingDateString?: string | null) {
  const weddingDate = parseDateOnly(weddingDateString)
  if (!weddingDate) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (weddingDate >= today) return null

  let anniversaryYear = today.getFullYear() - weddingDate.getFullYear()
  let anniversaryDate = new Date(today.getFullYear(), weddingDate.getMonth(), weddingDate.getDate())

  if (anniversaryDate < today) {
    anniversaryDate = new Date(today.getFullYear() + 1, weddingDate.getMonth(), weddingDate.getDate())
    anniversaryYear += 1
  }

  return {
    anniversaryDate,
    anniversaryDateKey: getDateKey(anniversaryDate),
    anniversaryYear: Math.max(1, anniversaryYear),
  }
}

function getReminderStartDate(anniversaryDate: Date, reminderDays: number) {
  const reminderDate = new Date(anniversaryDate)
  reminderDate.setDate(reminderDate.getDate() - reminderDays)
  reminderDate.setHours(0, 0, 0, 0)
  return reminderDate
}

function uniqueEmails(emails: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      emails
        .map((email) => email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email))
    )
  )
}

function firstNames(couple: CoupleRow) {
  const partner1 = couple.bride_name?.trim().split(/\s+/)[0] || "Partner 1"
  const partner2 = couple.groom_name?.trim().split(/\s+/)[0] || "Partner 2"
  return `${partner1} and ${partner2}`
}

function coupleDisplayName(couple: CoupleRow) {
  return `${couple.bride_name || "Partner 1"} & ${couple.groom_name || "Partner 2"}`
}

function buildEmailHtml(message: string, officiantName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Happy Anniversary</h1>
      </div>
      <div style="padding: 28px; background: #fff7fb; border: 1px solid #fbcfe8; border-top: 0; border-radius: 0 0 12px 12px;">
        <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.7; font-size: 15px; margin: 0;">${message}</p>
        <p style="color: #6b7280; font-size: 13px; margin: 28px 0 0;">Sent by ${officiantName} through OrdainedPro.</p>
      </div>
    </div>
  `
}

export async function checkAndSendAnniversaryReminders() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  const resendApiKey = getEnv("RESEND_API_KEY")

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase anniversary reminder environment variables.")
  }

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.")
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = getDateKey(today)

  const { data: settings, error: settingsError } = await supabase
    .from("anniversary_settings")
    .select("user_id,reminder_days,auto_send_enabled")
    .eq("auto_send_enabled", true)

  if (settingsError) {
    throw new Error(settingsError.message)
  }

  let checked = 0
  let sent = 0
  let skipped = 0
  let errors = 0
  const results: Array<Record<string, unknown>> = []

  for (const setting of (settings || []) as AnniversarySetting[]) {
    const reminderDays = setting.reminder_days ?? 3

    const { data: ceremonies, error: ceremoniesError } = await supabase
      .from("ceremonies")
      .select("couple_id,user_id,wedding_date")
      .eq("user_id", setting.user_id)
      .not("wedding_date", "is", null)
      .lt("wedding_date", todayKey)

    if (ceremoniesError) {
      errors++
      results.push({ userId: setting.user_id, status: "error", error: ceremoniesError.message })
      continue
    }

    const ceremonyRows = (ceremonies || []) as CeremonyRow[]
    const coupleIds = ceremonyRows.map((ceremony) => ceremony.couple_id)
    if (coupleIds.length === 0) continue

    const { data: couples, error: couplesError } = await supabase
      .from("couples")
      .select("id,bride_name,groom_name,bride_email,groom_email")
      .in("id", coupleIds)

    if (couplesError) {
      errors++
      results.push({ userId: setting.user_id, status: "error", error: couplesError.message })
      continue
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,business_name,email")
      .eq("user_id", setting.user_id)
      .maybeSingle()

    const profileRow = profile as ProfileRow | null
    const officiantName = profileRow?.business_name || profileRow?.full_name || "your wedding officiant"
    const replyTo = profileRow?.email || "info@ordainedpro.com"
    const coupleById = new Map(((couples || []) as CoupleRow[]).map((couple) => [couple.id, couple]))

    for (const ceremony of ceremonyRows) {
      checked++
      const couple = coupleById.get(ceremony.couple_id)
      const anniversary = getNextAnniversary(ceremony.wedding_date)

      if (!couple || !anniversary) {
        skipped++
        continue
      }

      await supabase.from("anniversary_reminders").upsert(
        {
          user_id: setting.user_id,
          couple_id: ceremony.couple_id,
          wedding_date: ceremony.wedding_date,
          anniversary_year: anniversary.anniversaryYear,
          anniversary_date: anniversary.anniversaryDateKey,
        },
        {
          onConflict: "user_id,couple_id,anniversary_year",
          ignoreDuplicates: true,
        }
      )

      const reminderStartDate = getReminderStartDate(anniversary.anniversaryDate, reminderDays)
      if (reminderStartDate > today) {
        skipped++
        continue
      }

      const { data: reminder, error: reminderError } = await supabase
        .from("anniversary_reminders")
        .select("id,contact_status,auto_email_sent_at")
        .eq("user_id", setting.user_id)
        .eq("couple_id", ceremony.couple_id)
        .eq("anniversary_year", anniversary.anniversaryYear)
        .maybeSingle()

      if (reminderError) {
        errors++
        results.push({ coupleId: ceremony.couple_id, status: "error", error: reminderError.message })
        continue
      }

      const reminderRow = reminder as ReminderRow | null
      if (!reminderRow || reminderRow.contact_status !== "not_contacted" || reminderRow.auto_email_sent_at) {
        skipped++
        continue
      }

      const recipients = uniqueEmails([couple.bride_email, couple.groom_email])
      if (recipients.length === 0) {
        skipped++
        results.push({ coupleId: ceremony.couple_id, status: "skipped", reason: "no couple emails" })
        continue
      }

      const suffix = getOrdinalSuffix(anniversary.anniversaryYear)
      const message = `Happy ${anniversary.anniversaryYear}${suffix} anniversary, ${firstNames(couple)}!\n\nI hope this anniversary finds you both happy, healthy, and enjoying the life you are building together. It was an honor to be part of your wedding day, and I wanted to send my warm congratulations as you celebrate another year of marriage.\n\nWishing you many more wonderful years together,\n${officiantName}`

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${officiantName} <info@ordainedpro.com>`,
            reply_to: replyTo,
            to: recipients,
            subject: `Happy ${anniversary.anniversaryYear}${suffix} Anniversary`,
            html: buildEmailHtml(message, officiantName),
            text: message,
          }),
        })

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json()
          errors++
          results.push({ coupleId: ceremony.couple_id, status: "error", error: emailError })
          continue
        }

        await supabase
          .from("anniversary_reminders")
          .update({
            contact_status: "email_sent",
            email_sent_at: new Date().toISOString(),
            auto_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", reminderRow.id)

        sent++
        results.push({
          coupleId: ceremony.couple_id,
          couple: coupleDisplayName(couple),
          status: "sent",
          recipients,
        })
      } catch (error) {
        errors++
        results.push({
          coupleId: ceremony.couple_id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

  return { checked, sent, skipped, errors, results }
}
