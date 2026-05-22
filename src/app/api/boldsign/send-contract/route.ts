import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Signer = {
  name: string
  emailAddress: string
}

type PrefillField = {
  id: string
  value: string
}

const SUPPORTED_BOLDSIGN_FILE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".pptx"]

function getFileExtension(fileNameOrUrl: string) {
  const cleanValue = fileNameOrUrl.split("?")[0].toLowerCase()
  const dotIndex = cleanValue.lastIndexOf(".")
  return dotIndex >= 0 ? cleanValue.slice(dotIndex) : ""
}

function sanitizeSigners(signers: Signer[]) {
  return signers
    .map((signer) => ({
      name: signer.name?.trim(),
      emailAddress: signer.emailAddress?.trim(),
    }))
    .filter((signer) => signer.name && signer.emailAddress)
}

function sanitizePrefillFields(prefillFields: unknown): PrefillField[] {
  if (!prefillFields || typeof prefillFields !== "object" || Array.isArray(prefillFields)) return []

  return Object.entries(prefillFields as Record<string, unknown>)
    .map(([id, value]) => ({
      id: id.trim(),
      value: value == null ? "" : String(value).trim(),
    }))
    .filter((field) => field.id && field.value)
}

export async function POST(request: NextRequest) {
  const boldSignApiKey = process.env.BOLDSIGN_API_KEY

  if (!boldSignApiKey) {
    return NextResponse.json(
      { error: "BoldSign is not configured yet. Add BOLDSIGN_API_KEY in Netlify and redeploy." },
      { status: 501 }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Missing request body." }, { status: 400 })
  }

  const contractUrl = String(body.contractUrl || "")
  const contractName = String(body.contractName || "Wedding Contract")
  const contractId = String(body.contractId || "")
  const coupleId = String(body.coupleId || "")
  const officiantId = String(body.officiantId || "")
  const message = String(body.message || "")
  const signers = sanitizeSigners(Array.isArray(body.signers) ? body.signers : [])
  const prefillFields = sanitizePrefillFields(body.prefillFields)
  const fileExtension = getFileExtension(contractUrl || contractName)

  if (!contractUrl) {
    return NextResponse.json({ error: "Contract file URL is required." }, { status: 400 })
  }

  if (!SUPPORTED_BOLDSIGN_FILE_EXTENSIONS.includes(fileExtension)) {
    return NextResponse.json(
      {
        error:
          "BoldSign can send .pdf, .docx, .png, .jpg, .xlsx, and .pptx files. Please upload a PDF or DOCX contract for signature.",
      },
      { status: 400 }
    )
  }

  if (signers.length === 0) {
    return NextResponse.json({ error: "At least one signer email is required." }, { status: 400 })
  }

  const boldSignPayload = {
    Title: contractName,
    Message: message,
    FileUrls: [contractUrl],
    Signers: signers.map((signer, index) => ({
      name: signer.name,
      emailAddress: signer.emailAddress,
      signerType: "Signer",
      locale: "EN",
      signerOrder: index + 1,
    })),
    EnableSigningOrder: false,
    AutoDetectFields: true,
    UseTextTags: true,
    DisableEmails: false,
    ReminderSettings: {
      EnableAutoReminder: true,
      ReminderDays: 3,
      ReminderCount: 3,
    },
    ExpiryDateType: "Days",
    ExpiryValue: 30,
    MetaData: {
      app: "OrdainedPro",
      contractId,
      coupleId,
      officiantId,
    },
  }

  const response = await fetch("https://api.boldsign.com/v1/document/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-KEY": boldSignApiKey,
    },
    body: JSON.stringify(boldSignPayload),
  })

  const responseText = await response.text()
  let responseData: any = null
  try {
    responseData = responseText ? JSON.parse(responseText) : null
  } catch {
    responseData = { raw: responseText }
  }

  if (!response.ok) {
    console.error("BoldSign send contract error:", responseData)
    return NextResponse.json(
      { error: responseData?.message || responseData?.error || "BoldSign failed to send the contract.", details: responseData },
      { status: response.status }
    )
  }

  const documentId = responseData?.documentId || responseData?.documentID || responseData?.id
  if (!documentId) {
    console.error("BoldSign did not return a document id:", responseData)
    return NextResponse.json(
      {
        error: "BoldSign accepted the request but did not return a document id. The contract was not marked as sent.",
        details: responseData,
      },
      { status: 502 }
    )
  }

  if (prefillFields.length > 0) {
    const prefillResponse = await fetch(
      `https://api.boldsign.com/v1/document/prefillFields?documentId=${encodeURIComponent(documentId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": boldSignApiKey,
        },
        body: JSON.stringify({
          Fields: prefillFields.map((field) => ({
            Id: field.id,
            Value: field.value,
          })),
        }),
      }
    )

    if (!prefillResponse.ok) {
      const prefillText = await prefillResponse.text()
      console.error("BoldSign prefill fields failed:", prefillText)
    }
  }

  return NextResponse.json({
    documentId,
    raw: responseData,
  })
}
