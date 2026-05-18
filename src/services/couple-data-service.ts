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
  bride_email?: string
  groom_email?: string
  bride_phone?: string
  groom_phone?: string
  venue_name?: string
  venue_address?: string
  wedding_date?: string
  start_time?: string
  end_time?: string
  expected_guests?: number
  notes?: string
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
  created_at?: string
}

export interface Meeting {
  id: number
  couple_id: number
  user_id: string
  subject: string
  date: string
  time: string
  duration?: number
  meeting_type?: string
  location?: string
  notes?: string
  status?: string
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
  file_url?: string
  status?: string
  sent_date?: string
  signed_date?: string
  created_at?: string
}

export interface Payment {
  id: number
  couple_id: number
  user_id: string
  description: string
  amount: number
  payment_type?: string
  status?: string
  due_date?: string
  paid_date?: string
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

export async function updateCouple(coupleId: number, updates: Partial<Couple>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("couples")
      .update(updates)
      .eq("id", coupleId)

    if (error) {
      console.error("[ERROR] Error updating couple:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Couple updated:", coupleId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception updating couple:", err)
    return { ok: false, error: err.message }
  }
}

// ============================================
// WEDDING DETAILS (server-side only)
// ============================================

export interface WeddingDetails {
  venueName: string
  venueAddress: string
  weddingDate: string
  startTime: string
  endTime: string
  expectedGuests: string
  officiantNotes: string
}

export async function saveWeddingDetails(
  coupleId: number,
  details: WeddingDetails
): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log("[WEDDING] Saving wedding details for couple:", coupleId, details)

    const { error } = await supabase
      .from("couples")
      .update({
        venue_name: details.venueName || null,
        venue_address: details.venueAddress || null,
        wedding_date: details.weddingDate || null,
        start_time: details.startTime || null,
        end_time: details.endTime || null,
        expected_guests: details.expectedGuests ? parseInt(details.expectedGuests) : null,
        notes: details.officiantNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", coupleId)

    if (error) {
      console.error("[ERROR] Error saving wedding details:", error)
      return { ok: false, error: error.message }
    }

    console.log("[OK] Wedding details saved for couple:", coupleId)
    return { ok: true }
  } catch (err: any) {
    console.error("[ERROR] Exception saving wedding details:", err)
    return { ok: false, error: err.message }
  }
}

export async function loadWeddingDetails(
  coupleId: number
): Promise<{ ok: boolean; data?: WeddingDetails; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("couples")
      .select("venue_name, venue_address, wedding_date, start_time, end_time, expected_guests, notes")
      .eq("id", coupleId)
      .single()

    if (error) {
      console.error("[ERROR] Error loading wedding details:", error)
      return { ok: false, error: error.message }
    }

    const weddingDetails: WeddingDetails = {
      venueName: data.venue_name || "",
      venueAddress: data.venue_address || "",
      weddingDate: data.wedding_date || "",
      startTime: data.start_time || "",
      endTime: data.end_time || "",
      expectedGuests: data.expected_guests?.toString() || "",
      officiantNotes: data.notes || ""
    }

    console.log("[OK] Loaded wedding details for couple:", coupleId)
    return { ok: true, data: weddingDetails }
  } catch (err: any) {
    console.error("[ERROR] Exception loading wedding details:", err)
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
        details: taskData.details || null
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
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        subject: meetingData.subject,
        date: meetingData.date,
        time: meetingData.time,
        duration: meetingData.duration || 60,
        meeting_type: meetingData.meetingType || "in-person",
        location: meetingData.location || null,
        notes: meetingData.notes || null,
        status: "scheduled"
      })
      .select()
      .single()

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
    const { error } = await supabase
      .from("meetings")
      .update(updates)
      .eq("id", meetingId)

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
  fileUrl?: string
  status?: string
}): Promise<{ ok: boolean; data?: Contract; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        name: contractData.name,
        file_url: contractData.fileUrl || null,
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

export async function addPayment(userId: string, coupleId: number, paymentData: {
  description: string
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
        description: paymentData.description,
        amount: paymentData.amount,
        payment_type: paymentData.paymentType || "service",
        status: paymentData.status || "pending",
        due_date: paymentData.dueDate || null
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
  created_at?: string
  updated_at?: string
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
        description: scriptData.description || null
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
