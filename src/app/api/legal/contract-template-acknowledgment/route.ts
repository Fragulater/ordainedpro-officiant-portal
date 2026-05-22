import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_LABEL,
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG,
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_TEXT,
  DEFAULT_CONTRACT_TEMPLATE_VERSION,
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

  const { data: existingAcceptance, error: existingError } = await supabase
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", user.id)
    .eq("document_slug", DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG)
    .eq("document_version", DEFAULT_CONTRACT_TEMPLATE_VERSION)
    .limit(1)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existingAcceptance) {
    return NextResponse.json({ ok: true, alreadyAccepted: true })
  }

  const { error: insertError } = await supabase.from("legal_acceptances").insert({
    user_id: user.id,
    document_slug: DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG,
    document_version: DEFAULT_CONTRACT_TEMPLATE_VERSION,
    context: "default_contract_use",
    ip_address: getClientIp(request),
    user_agent: request.headers.get("user-agent"),
    metadata: {
      checked: true,
      contract_template_version: DEFAULT_CONTRACT_TEMPLATE_VERSION,
      acknowledgment_label: DEFAULT_CONTRACT_ACKNOWLEDGMENT_LABEL,
      acknowledgment_language: DEFAULT_CONTRACT_ACKNOWLEDGMENT_TEXT,
    },
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
