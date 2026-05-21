/**
 * Couple Data Service
 *
 * Handles all Supabase operations for couple-specific data.
 * Everything is isolated per couple_id - no data commingling.
 *
 * Data stored per couple:
 * - Messages (already working)
 * - Tasks
 * - Meetings/Schedule
 * - Files
 * - Contracts
 * - Payments
 * - Ceremony details
 *
 * Data stored per officiant (not per couple):
 * - Scripts (user_files with is_template = true)
 */

import { supabase } from "@/supabase/utils/client"

// ============================================
// TYPES
// ============================================

export interface Couple {
  id: number
  user_id: string
  bride_name: string
  groom_name: string
  bride_email?: string | null
  groom_email?: string | null
  bride_phone?: string | null
  groom_phone?: string | null
  bride_address?: string | null
  groom_address?: string | null
  emergency_contact?: string | null
  special_requests?: string | null
  venue_name?: string | null
  venue_address?: string | null
  wedding_date?: string | null
  start_time?: string | null
  end_time?: string | null
  expected_guests?: number | null
  notes?: string | null
  is_active?: boolean
  created_at?: string
}

export interface Task {
  id: number
  couple_id: number
  user_id: string
  task: string
  completed: boolean
  due_date?: string
  due_time?: string
  priority?: string
  category?: string
  details?: string
  email_reminder?: boolean
  reminder_days?: number
  reminder_sent?: boolean
  reminder_sent_at?: string
  created_at?: string
}

export interface Meeting {
  id: number
  couple_id: number
  user_id: string
  subject: string
  title?: string
  body?: string
  date: string
  time: string
  duration?: number
  meeting_type?: string
  location?: string
  notes?: string
  status?: string
  response_deadline?: string
  responseDeadline?: string
  canceled_at?: string
  canceled_by?: string
  google_event_id?: string
  googleEventId?: string
  created_at?: string
}

export interface CoupleFile {
  id: number
  couple_id: number
  user_id: string
  file_name: string
  file_url: string
  file_type?: string
  file_size?: number
  category?: string
  created_at?: string
}

export interface Contract {
  id: number
  couple_id: number
  user_id: string
  name: string
  description?: string | null
  type?: string | null
  expiry_date?: string | null
  file_url?: string
  file_type?: string | null
  file_size?: number | null
  status?: string
  sent_date?: string
  signed_date?: string
  created_at?: string
  updated_at?: string
}

export interface Payment {
  id: number
  couple_id: number
  user_id: string
  invoice_number?: string
  description?: string
  amount: number
  payment_type?: string
  status?: string
  due_date?: string
  paid_date?: string
  payment_method?: string | null
  notes?: string | null
  created_at?: string
}

export interface InvoiceServiceItem {
  id: number
  user_id: string
  service: string
  description?: string | null
  category?: string | null
  quantity?: number
  rate?: number
  created_at?: string
}

// ============================================
// CEREMONIES / COUPLES
// ============================================

export async function addCeremony(userId: string, ceremonyData: {
  brideName: string
  groomName: string
  brideEmail?: string
  groomEmail?: string
  bridePhone?: string
  groomPhone?: string
  brideAddress?: string
  groomAddress?: string
  venueName?: string
  venueAddress?: string
  ceremonyDate?: string
  ceremonyTime?: string
  expectedGuests?: string
  notes?: string
}): Promise<{ ok: boolean; data?: Couple; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("couples")
      .insert({
        user_id: userId,
        bride_name: ceremonyData.brideName,
        groom_name: ceremonyData.groomName,
        bride_email: ceremonyData.brideEmail || null,
        groom_email: ceremonyData.groomEmail || null,
        bride_phone: ceremonyData.bridePhone || null,
        groom_phone: ceremonyData.groomPhone || null,
        bride_address: ceremonyData.brideAddress || null,
        groom_address: ceremonyData.groomAddress || null,
        venue_name: ceremonyData.venueName || null,
        venue_address: ceremonyData.venueAddress || null,
        wedding_date: ceremonyData.ceremonyDate || null,
        start_time: ceremonyData.ceremonyTime || null,
        expected_guests: ceremonyData.expectedGuests ? parseInt(ceremonyData.expectedGuests) : null,
        notes: ceremonyData.notes || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding ceremony:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Ceremony added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding ceremony:", err)
    return { ok: false, error: err.message }
  }
}

export async function loadCouples(userId: string): Promise<{ ok: boolean; data?: Couple[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("couples")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading couples:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "couples")
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading couples:", err)
    return { ok: false, error: err.message }
  }
}

export async function updateCouple(coupleId: number, updates: Partial<Couple>): Promise<{ ok: boolean; data?: Couple; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("couples")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", coupleId)
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error updating couple:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Couple updated:", coupleId)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception updating couple:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// TASKS (per couple)
// ============================================

export async function loadTasks(userId: string, coupleId: number): Promise<{ ok: boolean; data?: Task[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading tasks:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "tasks for couple", coupleId)
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading tasks:", err)
    return { ok: false, error: err.message }
  }
}

export async function addTask(userId: string, coupleId: number, taskData: {
  task: string
  dueDate?: string
  dueTime?: string
  priority?: string
  category?: string
  details?: string
  emailReminder?: boolean
  reminderDays?: number
}): Promise<{ ok: boolean; data?: Task; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        task: taskData.task,
        completed: false,
        due_date: taskData.dueDate || null,
        due_time: taskData.dueTime || null,
        priority: taskData.priority || "medium",
        category: taskData.category || null,
        details: taskData.details || null,
        email_reminder: taskData.emailReminder || false,
        reminder_days: taskData.reminderDays || 1,
        reminder_sent: false,
        reminder_sent_at: null
      })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding task:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Task added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding task:", err)
    return { ok: false, error: err.message }
  }
}

export async function updateTask(taskId: number, updates: Partial<Task>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)

    if (error) {
      console.error("[ERROR] Error updating task:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Task updated:", taskId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception updating task:", err)
    return { ok: false, error: err.message }
  }
}

export async function deleteTask(taskId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)

    if (error) {
      console.error("[ERROR] Error deleting task:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Task deleted:", taskId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception deleting task:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// MEETINGS (per couple)
// ============================================

export async function loadMeetings(userId: string, coupleId: number): Promise<{ ok: boolean; data?: Meeting[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", userId)
      .eq("couple_id", coupleId)
      .order("date", { ascending: true })

    if (error) {
      console.error("[ERROR] Error loading meetings:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "meetings for couple", coupleId)
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading meetings:", err)
    return { ok: false, error: err.message }
  }
}

export async function addMeeting(userId: string, coupleId: number, meetingData: {
  subject: string
  date: string
  time: string
  duration?: number
  meetingType?: string
  location?: string
  notes?: string
}): Promise<{ ok: boolean; data?: Meeting; error?: string }> {
  try {
    const baseInsert = {
      user_id: userId,
      couple_id: coupleId,
      title: meetingData.subject,
      date: meetingData.date,
      time: meetingData.time,
      location: meetingData.location || null,
      notes: meetingData.notes || null
    }

    const fullInsert = {
      ...baseInsert,
      duration: meetingData.duration || 60,
      meeting_type: meetingData.meetingType || "in-person",
      status: "pending"
    }

    let { data, error } = await supabase
      .from("meetings")
      .insert(fullInsert)
      .select()
      .single()

    if (error && /schema cache|column .* does not exist|Could not find/i.test(error.message)) {
      const retry = await supabase
        .from("meetings")
        .insert(baseInsert)
        .select()
        .single()

      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error("[ERROR] Error adding meeting:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Meeting added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding meeting:", err)
    return { ok: false, error: err.message }
  }
}

export async function updateMeeting(meetingId: number, updates: Partial<Meeting>): Promise<{ ok: boolean; error?: string }> {
  try {
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    const baseUpdates: Record<string, unknown> = {
      updated_at: dbUpdates.updated_at,
    }

    if (updates.subject !== undefined) dbUpdates.title = baseUpdates.title = updates.subject
    if (updates.title !== undefined) dbUpdates.title = baseUpdates.title = updates.title
    if (updates.date !== undefined) dbUpdates.date = baseUpdates.date = updates.date
    if (updates.time !== undefined) dbUpdates.time = baseUpdates.time = updates.time
    if (updates.location !== undefined) dbUpdates.location = baseUpdates.location = updates.location
    if (updates.body !== undefined) dbUpdates.notes = baseUpdates.notes = updates.body
    if (updates.notes !== undefined) dbUpdates.notes = baseUpdates.notes = updates.notes
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration
    if (updates.meeting_type !== undefined) dbUpdates.meeting_type = updates.meeting_type
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.response_deadline !== undefined) dbUpdates.response_deadline = updates.response_deadline
    if (updates.responseDeadline !== undefined) dbUpdates.response_deadline = updates.responseDeadline
    if (updates.canceled_at !== undefined) dbUpdates.canceled_at = updates.canceled_at
    if (updates.canceled_by !== undefined) dbUpdates.canceled_by = updates.canceled_by
    if (updates.google_event_id !== undefined) dbUpdates.google_event_id = updates.google_event_id
    if (updates.googleEventId !== undefined) dbUpdates.google_event_id = updates.googleEventId

    let { error } = await supabase
      .from("meetings")
      .update(dbUpdates)
      .eq("id", meetingId)

    if (error && /schema cache|column .* does not exist|Could not find/i.test(error.message)) {
      const retry = await supabase
        .from("meetings")
        .update(baseUpdates)
        .eq("id", meetingId)

      error = retry.error
    }

    if (error) {
      console.error("[ERROR] Error updating meeting:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Meeting updated:", meetingId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception updating meeting:", err)
    return { ok: false, error: err.message }
  }
}

export async function deleteMeeting(meetingId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId)

    if (error) {
      console.error("[ERROR] Error deleting meeting:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Meeting deleted:", meetingId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception deleting meeting:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// FILES (per couple)
// ============================================

export async function loadFiles(userId: string, coupleId: number): Promise<{ ok: boolean; data?: CoupleFile[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("couple_files")
      .select("*")
      .eq("user_id", userId)
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading files:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "files for couple", coupleId)
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading files:", err)
    return { ok: false, error: err.message }
  }
}

export async function addFile(userId: string, coupleId: number, fileData: {
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  category?: string
}): Promise<{ ok: boolean; data?: CoupleFile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("couple_files")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        file_name: fileData.fileName,
        file_url: fileData.fileUrl,
        file_type: fileData.fileType || null,
        file_size: fileData.fileSize || null,
        category: fileData.category || null
      })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding file:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] File added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding file:", err)
    return { ok: false, error: err.message }
  }
}

export async function deleteFile(fileId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("couple_files")
      .delete()
      .eq("id", fileId)

    if (error) {
      console.error("[ERROR] Error deleting file:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] File deleted:", fileId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception deleting file:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// CONTRACTS (per couple)
// ============================================

export async function loadContracts(userId: string, coupleId: number): Promise<{ ok: boolean; data?: Contract[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("user_id", userId)
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading contracts:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "contracts for couple", coupleId)
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading contracts:", err)
    return { ok: false, error: err.message }
  }
}

export async function addContract(userId: string, coupleId: number, contractData: {
  name: string
  description?: string
  type?: string
  expiryDate?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
  status?: string
}): Promise<{ ok: boolean; data?: Contract; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        name: contractData.name,
        description: contractData.description || null,
        type: contractData.type || "Custom Contract",
        expiry_date: contractData.expiryDate || null,
        file_url: contractData.fileUrl || null,
        file_type: contractData.fileType || null,
        file_size: contractData.fileSize || null,
        status: contractData.status || "draft"
      })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding contract:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Contract added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding contract:", err)
    return { ok: false, error: err.message }
  }
}

export async function updateContract(contractId: number, updates: Partial<Contract>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", contractId)

    if (error) {
      console.error("[ERROR] Error updating contract:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Contract updated:", contractId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception updating contract:", err)
    return { ok: false, error: err.message }
  }
}

export async function deleteContract(contractId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId)

    if (error) {
      console.error("[ERROR] Error deleting contract:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Contract deleted:", contractId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception deleting contract:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// PAYMENTS (per couple)
// ============================================

export async function loadPayments(userId: string, coupleId: number): Promise<{ ok: boolean; data?: Payment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading payments:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "payments for couple", coupleId)
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading payments:", err)
    return { ok: false, error: err.message }
  }
}

export async function loadAllPayments(userId: string): Promise<{ ok: boolean; data?: Payment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading all payments:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading all payments:", err)
    return { ok: false, error: err.message }
  }
}

export async function addPayment(userId: string, coupleId: number, paymentData: {
  description: string
  invoiceNumber?: string
  amount: number
  paymentType?: string
  status?: string
  dueDate?: string
}): Promise<{ ok: boolean; data?: Payment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        invoice_number: paymentData.invoiceNumber || paymentData.description,
        amount: paymentData.amount,
        status: paymentData.status || "pending",
        due_date: paymentData.dueDate || null,
        payment_method: paymentData.paymentType || "invoice",
        notes: paymentData.description,
      })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding payment:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Payment added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding payment:", err)
    return { ok: false, error: err.message }
  }
}

export async function updatePayment(paymentId: number, updates: Partial<Payment>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("payments")
      .update(updates)
      .eq("id", paymentId)

    if (error) {
      console.error("[ERROR] Error updating payment:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Payment updated:", paymentId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception updating payment:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// INVOICE SERVICE ITEMS (per officiant)
// ============================================

export async function loadInvoiceServices(userId: string): Promise<{ ok: boolean; data?: InvoiceServiceItem[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("invoice_service_items")
      .select("*")
      .eq("user_id", userId)
      .order("service", { ascending: true })

    if (error) {
      console.error("[ERROR] Error loading invoice services:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading invoice services:", err)
    return { ok: false, error: err.message }
  }
}

export async function addInvoiceService(userId: string, serviceData: {
  service: string
  description?: string
  category?: string
  quantity?: number
  rate?: number
}): Promise<{ ok: boolean; data?: InvoiceServiceItem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("invoice_service_items")
      .upsert({
        user_id: userId,
        service: serviceData.service.trim(),
        description: serviceData.description || null,
        category: serviceData.category || "Ceremony Services",
        quantity: serviceData.quantity || 1,
        rate: serviceData.rate || 0,
      }, { onConflict: "user_id,service" })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding invoice service:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding invoice service:", err)
    return { ok: false, error: err.message }
  }
}

export async function deleteInvoiceService(serviceId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("invoice_service_items")
      .delete()
      .eq("id", serviceId)

    if (error) {
      console.error("[ERROR] Error deleting invoice service:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception deleting invoice service:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// SCRIPTS (per officiant, optionally per couple)
// ============================================

export interface Script {
  id: number
  user_id: string
  couple_id?: number | null
  title: string
  type: string
  status: string
  content: string
  description?: string
  is_published?: boolean
  price?: number | null
  sales_count?: number
  earnings_total?: number
  rating?: number
  marketplace_languages?: string[]
  marketplace_categories?: string[]
  marketplace_ceremony_types?: string[]
  marketplace_visibility?: string
  marketplace_published_at?: string | null
  marketplace_url?: string | null
  stripe_product_id?: string | null
  stripe_price_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface ScriptSale {
  id: number
  user_id: string
  script_id: number
  buyer_email?: string | null
  amount: number
  platform_fee?: number
  net_amount: number
  stripe_payment_intent_id?: string | null
  created_at?: string
}

export async function loadScripts(userId: string, coupleId?: number): Promise<{ ok: boolean; data?: Script[]; error?: string }> {
  try {
    let query = supabase
      .from("scripts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    // If coupleId is provided, filter by it (or null for templates)
    if (coupleId !== undefined) {
      query = query.or(`couple_id.eq.${coupleId},couple_id.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[ERROR] Error loading scripts:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Loaded", data?.length || 0, "scripts")
    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading scripts:", err)
    return { ok: false, error: err.message }
  }
}

export async function addScript(userId: string, scriptData: {
  title: string
  type: string
  status: string
  content: string
  description?: string
  coupleId?: number | null
  isPublished?: boolean
  price?: number
  marketplaceLanguages?: string[]
  marketplaceCategories?: string[]
  marketplaceCeremonyTypes?: string[]
  marketplaceVisibility?: string
}): Promise<{ ok: boolean; data?: Script; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("scripts")
      .insert({
        user_id: userId,
        couple_id: scriptData.coupleId || null,
        title: scriptData.title,
        type: scriptData.type,
        status: scriptData.status,
        content: scriptData.content,
        description: scriptData.description || null,
        is_published: scriptData.isPublished || false,
        price: scriptData.price || null,
        marketplace_languages: scriptData.marketplaceLanguages || [],
        marketplace_categories: scriptData.marketplaceCategories || [],
        marketplace_ceremony_types: scriptData.marketplaceCeremonyTypes || [],
        marketplace_visibility: scriptData.marketplaceVisibility || "main_marketplace",
        marketplace_published_at: scriptData.isPublished ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error adding script:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Script added:", data)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception adding script:", err)
    return { ok: false, error: err.message }
  }
}

export async function loadScriptSales(userId: string): Promise<{ ok: boolean; data?: ScriptSale[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("script_sales")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[ERROR] Error loading script sales:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (err: any) {
    console.error("[ERROR] Exception loading script sales:", err)
    return { ok: false, error: err.message }
  }
}

export async function updateScript(scriptId: number, updates: Partial<Script>): Promise<{ ok: boolean; data?: Script; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("scripts")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", scriptId)
      .select()
      .single()

    if (error) {
      console.error("[ERROR] Error updating script:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Script updated:", scriptId)
    return { ok: true, data }
  } catch (err: any) {
    console.error("[ERROR] Exception updating script:", err)
    return { ok: false, error: err.message }
  }
}

export async function deleteScript(scriptId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("scripts")
      .delete()
      .eq("id", scriptId)

    if (error) {
      console.error("[ERROR] Error deleting script:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Script deleted:", scriptId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception deleting script:", err)
    return { ok: false, error: err.message }
  }
}

// Auto-save script (debounced save for editor)
export async function autoSaveScript(scriptId: number, content: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("scripts")
      .update({
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq("id", scriptId)

    if (error) {
      console.error("[ERROR] Error auto-saving script:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Script auto-saved:", scriptId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception auto-saving script:", err)
    return { ok: false, error: err.message }
  }
}
