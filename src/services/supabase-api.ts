import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// Use simple types instead of generated Database types to avoid type errors
type Couple = any
type CoupleInsert = any
type CoupleUpdate = any

type Ceremony = any
type CeremonyInsert = any

type Message = any
type MessageInsert = any

type Payment = any
type PaymentInsert = any
type PaymentUpdate = any

type Script = any
type ScriptInsert = any
type ScriptUpdate = any

type Subscription = any

type Profile = any
type ProfileUpdate = any

type Task = {
  id: number
  couple_id: number
  user_id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">
type TaskUpdate = Partial<Omit<Task, "id" | "created_at" | "user_id" | "couple_id">>

// ===== COUPLES API =====

export async function getCouples(userId: string): Promise<Couple[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning empty array')
    return []
  }

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching couples:', error)
    throw error
  }

  return data || []
}

export async function getCouple(id: number): Promise<Couple | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching couple:', error)
    throw error
  }

  return data
}

export async function createCouple(userId: string, couple: Omit<CoupleInsert, 'user_id'>): Promise<Couple> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('couples')
    .insert({ ...couple, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('Error creating couple:', error)
    throw error
  }

  return data
}

export async function updateCouple(id: number, updates: CoupleUpdate): Promise<Couple> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('couples')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating couple:', error)
    throw error
  }

  return data
}

export async function deleteCouple(id: number): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('couples')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting couple:', error)
    throw error
  }
}

// ===== CEREMONIES API =====

export async function getCeremony(coupleId: number): Promise<Ceremony | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('ceremonies')
    .select('*')
    .eq('couple_id', coupleId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching ceremony:', error)
    throw error
  }

  return data
}

export async function createCeremony(userId: string, ceremony: Omit<CeremonyInsert, 'user_id'>): Promise<Ceremony> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('ceremonies')
    .insert({ ...ceremony, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('Error creating ceremony:', error)
    throw error
  }

  return data
}

export async function updateCeremony(coupleId: number, updates: Partial<Ceremony>): Promise<Ceremony> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('ceremonies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('couple_id', coupleId)
    .select()
    .single()

  if (error) {
    console.error('Error updating ceremony:', error)
    throw error
  }

  return data
}

// ===== MESSAGES API =====

export async function getMessages(coupleId: number): Promise<Message[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('couple_id', coupleId)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw error
  }

  return data || []
}

export async function createMessage(userId: string, message: Omit<MessageInsert, 'user_id'>): Promise<Message> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ ...message, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('Error creating message:', error)
    throw error
  }

  return data
}

// ===== PAYMENTS API =====

export async function getPayments(coupleId: number): Promise<Payment[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching payments:', error)
    throw error
  }

  return data || []
}

export async function createPayment(userId: string, payment: Omit<PaymentInsert, 'user_id'>): Promise<Payment> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({ ...payment, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('Error creating payment:', error)
    throw error
  }

  return data
}

export async function updatePayment(id: number, updates: PaymentUpdate): Promise<Payment> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('payments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating payment:', error)
    throw error
  }

  return data
}

// ===== SCRIPTS API =====

export async function getScripts(userId: string): Promise<Script[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching scripts:', error)
    throw error
  }

  return data || []
}

export async function createScript(userId: string, script: Omit<ScriptInsert, 'user_id'>): Promise<Script> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('scripts')
    .insert({ ...script, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('Error creating script:', error)
    throw error
  }

  return data
}

export async function updateScript(id: number, updates: ScriptUpdate): Promise<Script> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('scripts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating script:', error)
    throw error
  }

  return data
}

export async function deleteScript(id: number): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting script:', error)
    throw error
  }
}

// ===== SUBSCRIPTION API =====

// export async function getSubscription(userId: string): Promise<Subscription | null> {
//   if (!isSupabaseConfigured()) return null

//   const { data, error } = await supabase
//     .from('subscriptions')
//     .select('*')
//     .eq('user_id', userId)
//     .single()

//   if (error && error.code !== 'PGRST116') {
//     console.error('Error fetching subscription:', error)
//     throw error
//   }

//   return data
// }

// ===== PROFILE API =====

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}
export async function createTask(userId: string, task: Omit<TaskInsert, "user_id">): Promise<Task> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured")

  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...task, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error("❌ Error creating task:", error)
    throw error
  }

  console.log("✅ Task created:", data)
  return data
}