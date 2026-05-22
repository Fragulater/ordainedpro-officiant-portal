import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_LABEL,
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG,
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_TEXT,
  DEFAULT_CONTRACT_TEMPLATE_VERSION,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_LABEL,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_SLUG,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_TEXT,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_VERSION,
} from "@/lib/contract-legal-acknowledgment"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-nf-client-connection-ip")
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const acknowledgmentType = body?.type === "uploaded_contract" ? "uploaded_contract" : "default_contract"
  const uploadedFileName = typeof body?.fileName === "string" ? body.fileName : null
  const uploadedContractName = typeof body?.contractName === "string" ? body.contractName : null
  const acknowledgment =
    acknowledgmentType === "uploaded_contract"
      ? {
          slug: UPLOADED_CONTRACT_ACKNOWLEDGMENT_SLUG,
          version: UPLOADED_CONTRACT_ACKNOWLEDGMENT_VERSION,
          label: UPLOADED_CONTRACT_ACKNOWLEDGMENT_LABEL,
          text: UPLOADED_CONTRACT_ACKNOWLEDGMENT_TEXT,
          context: "uploaded_contract_use",
          contractTemplateVersion: uploadedFileName || uploadedContractName || UPLOADED_CONTRACT_ACKNOWLEDGMENT_VERSION,
        }
      : {
          slug: DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG,
          version: DEFAULT_CONTRACT_TEMPLATE_VERSION,
          label: DEFAULT_CONTRACT_ACKNOWLEDGMENT_LABEL,
          text: DEFAULT_CONTRACT_ACKNOWLEDGMENT_TEXT,
          context: "default_contract_use",
          contractTemplateVersion: DEFAULT_CONTRACT_TEMPLATE_VERSION,
        }

  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : ""

  if (!token) {
    return NextResponse.json({ error: "Missing user session." }, { status: 401 })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "Legal acknowledgment tracking is not configured on the server." },
      { status: 501 }
    )
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  const user = userData?.user

  if (userError || !user) {
    return NextResponse.json({ error: "Unable to verify the signed-in user." }, { status: 401 })
  }

  let existingQuery = supabase
    .from("legal_acceptances")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("document_slug", acknowledgment.slug)
    .eq("document_version", acknowledgment.version)

  if (acknowledgmentType === "uploaded_contract" && uploadedFileName) {
    existingQuery = existingQuery.contains("metadata", { uploaded_file_name: uploadedFileName })
  }

  const { count: existingCount, error: existingError } = await existingQuery
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existingCount && existingCount > 0) {
    return NextResponse.json({ ok: true, alreadyAccepted: true })
  }

  const { error: insertError } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    document_slug: acknowledgment.slug,
    document_version: acknowledgment.version,
    context: acknowledgment.context,
    ip_address: getClientIp(request),
    user_agent: request.headers.get("user-agent"),
    metadata: {
      checked: true,
      contract_template_version: acknowledgment.contractTemplateVersion,
      uploaded_file_name: uploadedFileName,
      uploaded_contract_name: uploadedContractName,
      acknowledgment_label: acknowledgment.label,
      acknowledgment_language: acknowledgment.text,
    },
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
