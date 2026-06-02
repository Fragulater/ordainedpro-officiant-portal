import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/supabase/utils/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const USER_DOCUMENTS_BUCKET = "user-documents"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase service credentials are not configured.")
  }

  return createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function sanitizeFileName(name: string) {
  const cleanName = name.trim() || "document.txt"
  return cleanName.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-")
}

async function ensureUserDocumentsBucket(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const bucketExists = buckets?.some((bucket) => bucket.id === USER_DOCUMENTS_BUCKET)

  if (!bucketExists) {
    const { error } = await supabaseAdmin.storage.createBucket(USER_DOCUMENTS_BUCKET, {
      public: true,
    })

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Unable to create document storage bucket: ${error.message}`)
    }
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Please log in before viewing saved documents." }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from("user_files")
      .select("id, name, type, size, url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Unable to load saved documents: ${error.message}`)
    }

    return NextResponse.json({ ok: true, files: data || [] })
  } catch (error) {
    console.error("User files load error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load saved documents." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Please log in before saving a document." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const requestedName = String(formData.get("name") || "")
    const folder = sanitizeFileName(String(formData.get("folder") || "dashboard")).replace(/\./g, "")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing document file." }, { status: 400 })
    }

    const savedName = requestedName.trim() || file.name || "document.txt"
    const safeFileName = sanitizeFileName(savedName)
    const contentType = file.type || "application/octet-stream"
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const storagePath = `${user.id}/${folder}/${Date.now()}-${safeFileName}`
    const supabaseAdmin = getSupabaseAdmin()

    await ensureUserDocumentsBucket(supabaseAdmin)

    const { error: uploadError } = await supabaseAdmin.storage
      .from(USER_DOCUMENTS_BUCKET)
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(USER_DOCUMENTS_BUCKET)
      .getPublicUrl(storagePath)

    const { data, error: insertError } = await supabaseAdmin
      .from("user_files")
      .insert({
        user_id: user.id,
        name: savedName,
        type: contentType,
        size: fileBuffer.byteLength,
        url: urlData.publicUrl,
        created_at: new Date().toISOString(),
      })
      .select("id, name, type, size, url, created_at")
      .single()

    if (insertError) {
      throw new Error(`Document save failed: ${insertError.message}`)
    }

    return NextResponse.json({ ok: true, file: data })
  } catch (error) {
    console.error("User file save error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save this document." },
      { status: 500 }
    )
  }
}
