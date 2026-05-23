import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseSignatureHeader(header: string | null) {
  if (!header) return null

  return header.split(",").reduce(
    (parsed, part) => {
      const [key, value] = part.trim().split("=")
      if (key === "t") parsed.timestamp = Number.parseInt(value, 10)
      if ((key === "s0" || key === "s1") && value) parsed.signatures.push(value)
      return parsed
    },
    { timestamp: -1, signatures: [] as string[] }
  )
}

function secureCompare(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function verifyBoldSignSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  const parsed = parseSignatureHeader(signatureHeader)
  if (!parsed || !parsed.timestamp || parsed.signatures.length === 0) {
    return false
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.timestamp}.${rawBody}`, "utf8")
    .digest("hex")

  const timestampAgeSeconds = Math.floor(Date.now() / 1000) - parsed.timestamp
  const withinTolerance = timestampAgeSeconds <= 300
  const signatureMatches = parsed.signatures.some((signature) => secureCompare(expectedSignature, signature))

  return withinTolerance && signatureMatches
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function findValueByKey(value: any, key: string): string | null {
  if (!value || typeof value !== "object") return null
  if (Object.prototype.hasOwnProperty.call(value, key) && value[key] != null) {
    return String(value[key])
  }

  for (const nested of Object.values(value)) {
    const result = findValueByKey(nested, key)
    if (result) return result
  }

  return null
}

function getContractStatusFromEvent(eventType: string) {
  const normalizedEvent = eventType.toLowerCase()
  if (normalizedEvent.includes("sendfailed") || normalizedEvent.includes("send failed")) return "failed"
  if (normalizedEvent.includes("completed") || normalizedEvent.includes("signed")) return "signed"
  if (normalizedEvent.includes("expired")) return "expired"
  if (
    normalizedEvent.includes("sent") ||
    normalizedEvent.includes("viewed") ||
    normalizedEvent.includes("declined") ||
    normalizedEvent.includes("revoked")
  ) {
    return "sent"
  }
  return null
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const boldSignEventHeader = request.headers.get("x-boldsign-event")

  let payload: any = null
  try {
    payload = rawBody ? JSON.parse(rawBody) : null
  } catch (error) {
    console.error("Invalid BoldSign webhook payload:", error)
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const eventType = boldSignEventHeader || payload?.event?.eventType || ""

  if (eventType === "Verification") {
    return NextResponse.json({ ok: true })
  }

  const webhookSecret = process.env.BOLDSIGN_WEBHOOK_SECRET
  if (webhookSecret) {
    const isVerified = verifyBoldSignSignature(
      rawBody,
      request.headers.get("x-boldsign-signature"),
      webhookSecret
    )

    if (!isVerified) {
      console.error("Rejected BoldSign webhook with invalid signature.")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }
  } else {
    console.warn("BOLDSIGN_WEBHOOK_SECRET is not set. BoldSign webhook accepted without signature verification.")
  }

  console.log("BoldSign webhook received:", {
    eventType,
    documentId: payload?.data?.documentId,
    environment: payload?.event?.environment,
    errorMessage: findValueByKey(payload, "errorMessage") || findValueByKey(payload, "message"),
  })

  const contractId = findValueByKey(payload, "contractId")
  const nextStatus = getContractStatusFromEvent(eventType)

  if (contractId && nextStatus) {
    const supabase = getServiceClient()
    if (!supabase) {
      console.error("Cannot update BoldSign contract status: Supabase service env vars are missing.")
    } else {
      const { error } = await supabase
        .from("contracts")
        .update({ status: nextStatus })
        .eq("id", Number(contractId))

      if (error) {
        console.error("Failed to update contract status from BoldSign webhook:", error)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
