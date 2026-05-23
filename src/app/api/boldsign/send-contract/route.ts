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

const SUPPORTED_BOLDSIGN_FILE_EXTENSIONS = [".pdf"]

function getFileExtension(fileNameOrUrl: string) {
  const cleanValue = fileNameOrUrl.split("?")[0].toLowerCase()
  const dotIndex = cleanValue.lastIndexOf(".")
  return dotIndex >= 0 ? cleanValue.slice(dotIndex) : ""
}

function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/$/, "")
}

function normalizeContractUrl(contractUrl: string) {
  const publicSiteUrl = getPublicSiteUrl()

  if (contractUrl.startsWith("/contracts/") && publicSiteUrl) {
    return `${publicSiteUrl}${contractUrl}`
  }

  try {
    const parsedUrl = new URL(contractUrl)
    const isLocalUrl = ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsedUrl.hostname)

    if (isLocalUrl && publicSiteUrl && parsedUrl.pathname.startsWith("/contracts/")) {
      return `${publicSiteUrl}${parsedUrl.pathname}${parsedUrl.search}`
    }
  } catch {
    return contractUrl
  }

  return contractUrl
}

function isLocalContractUrl(contractUrl: string) {
  try {
    const parsedUrl = new URL(contractUrl)
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsedUrl.hostname)
  } catch {
    return false
  }
}

function sanitizeSigners(signers: Signer[]) {
  return signers
    .map((signer) => ({
      name: signer.name?.trim(),
      emailAddress: signer.emailAddress?.trim(),
    }))
    .filter((signer) => signer.name && signer.emailAddress)
}

function getDuplicateSignerEmails(signers: Array<{ emailAddress: string }>) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  signers.forEach((signer) => {
    const emailKey = signer.emailAddress.toLowerCase()
    if (seen.has(emailKey)) duplicates.add(emailKey)
    seen.add(emailKey)
  })

  return Array.from(duplicates)
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

function extractBoldSignErrorMessages(details: any): string[] {
  const messages = new Set<string>()

  const visit = (value: any) => {
    if (!value) return

    if (typeof value === "string") {
      messages.add(value)
      return
    }

    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }

    if (typeof value === "object") {
      ;["message", "Message", "error", "Error", "title", "Title", "detail", "Detail"].forEach((key) => {
        if (typeof value[key] === "string") {
          messages.add(value[key])
        }
      })

      if (value.errors || value.Errors || value.validationErrors || value.ValidationErrors) {
        visit(value.errors || value.Errors || value.validationErrors || value.ValidationErrors)
      }

      Object.values(value).forEach((nestedValue) => {
        if (nestedValue && typeof nestedValue === "object") {
          visit(nestedValue)
        }
      })
    }
  }

  visit(details)
  return Array.from(messages).filter(Boolean)
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

  const originalContractUrl = String(body.contractUrl || "")
  const contractUrl = normalizeContractUrl(originalContractUrl)
  const contractName = String(body.contractName || "Wedding Contract")
  const contractId = String(body.contractId || "")
  const coupleId = String(body.coupleId || "")
  const officiantId = String(body.officiantId || "")
  const message = String(body.message || "")
  const signers = sanitizeSigners(Array.isArray(body.signers) ? body.signers : [])
  const prefillFields = sanitizePrefillFields(body.prefillFields)
  const fileExtension = getFileExtension(contractUrl || contractName)

  if (!originalContractUrl) {
    return NextResponse.json({ error: "Contract file URL is required." }, { status: 400 })
  }

  if (isLocalContractUrl(contractUrl)) {
    return NextResponse.json(
      {
        error:
          "BoldSign cannot access a contract file from localhost. Test this from the deployed portal or set NEXT_PUBLIC_SITE_URL to https://portal.ordainedpro.com and redeploy.",
      },
      { status: 400 }
    )
  }

  if (!SUPPORTED_BOLDSIGN_FILE_EXTENSIONS.includes(fileExtension)) {
    return NextResponse.json(
      {
        error:
          "BoldSign contract sending is PDF-only. Please upload or use a PDF contract for signature.",
      },
      { status: 400 }
    )
  }

  if (signers.length === 0) {
    return NextResponse.json({ error: "At least one signer email is required." }, { status: 400 })
  }

  const duplicateSignerEmails = getDuplicateSignerEmails(signers)
  if (duplicateSignerEmails.length > 0) {
    return NextResponse.json(
      {
        error: `Each BoldSign signer needs a unique email address. Duplicate email(s): ${duplicateSignerEmails.join(", ")}`,
      },
      { status: 400 }
    )
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
    const boldSignMessages = extractBoldSignErrorMessages(responseData)
    return NextResponse.json(
      {
        error:
          boldSignMessages.join(" ") ||
          responseData?.message ||
          responseData?.error ||
          "BoldSign failed to send the contract.",
        details: responseData,
      },
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
    console.log("BoldSign prefill skipped while send flow is being validated.", {
      documentId,
      fieldCount: prefillFields.length,
    })
  }

  return NextResponse.json({
    documentId,
    boldSignStatus: responseData?.status || "accepted",
    statusCheck: null,
    prefillSkipped: prefillFields.length > 0,
    raw: responseData,
  })
}
