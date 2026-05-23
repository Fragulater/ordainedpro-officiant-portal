import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Signer = {
  name: string
  emailAddress: string
  roleIndices?: number[]
}

type PrefillField = {
  id: string
  value: string
}

type PrefillMap = Record<string, string>

const SUPPORTED_BOLDSIGN_FILE_EXTENSIONS = [".pdf"]
const CUSTOM_CONTRACT_PREFILL_FIELD_IDS = new Set([
  "agreement_date",
  "officiant_business_name",
  "officiant_name",
  "couple_names",
  "partner_1_name",
  "partner_2_name",
  "wedding_date",
  "wedding_time",
  "venue_name",
  "venue_address",
  "total_fee",
  "deposit_amount",
  "balance_due",
  "balance_due_date",
  "included_travel_radius",
  "travel_mileage_fees",
  "travel_origin_or_service_area",
  "additional_travel_terms",
  "couple_email",
  "couple_mailing_address",
  "bride_phone",
  "groom_phone",
  "bride_email",
  "groom_email",
  "mailing_addr",
])

const CUSTOM_CONTRACT_TAG_GUIDANCE =
  "Uploaded PDFs must contain BoldSign text tags with matching field IDs, such as partner_1_name, partner_2_name, wedding_date, venue_name, total_fee, deposit_amount, partner_1_signature, partner_2_signature, and officiant_signature."

function getFileExtension(fileNameOrUrl: string) {
  const cleanValue = fileNameOrUrl.split("?")[0].toLowerCase()
  const dotIndex = cleanValue.lastIndexOf(".")
  return dotIndex >= 0 ? cleanValue.slice(dotIndex) : ""
}

function truncateForPdf(text: string, maxLength = 80) {
  const cleanText = text.replace(/\s+/g, " ").trim()
  return cleanText.length > maxLength ? `${cleanText.slice(0, maxLength - 3)}...` : cleanText
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

function isDefaultContractUrl(contractUrl: string) {
  try {
    return new URL(contractUrl).pathname.endsWith("/contracts/ordainedpro-default-contract.pdf")
  } catch {
    return contractUrl.endsWith("/contracts/ordainedpro-default-contract.pdf")
  }
}

const DEFAULT_CONTRACT_SIGNATURE_PAGE = 5

function getDefaultContractFormFields(roleIndices: number[]) {
  const rows = [
    { signatureY: 236, dateY: 236 },
    { signatureY: 336, dateY: 336 },
    { signatureY: 436, dateY: 436 },
  ]

  return roleIndices.flatMap((roleIndex) => {
    const row = rows[roleIndex] || rows[rows.length - 1]
    const roleNumber = roleIndex + 1

    return [
      {
        id: `signature_${roleNumber}`,
        name: `Signature ${roleNumber}`,
        fieldType: "Signature",
        pageNumber: DEFAULT_CONTRACT_SIGNATURE_PAGE,
        bounds: {
          x: 168,
          y: row.signatureY,
          width: 245,
          height: 20,
        },
        isRequired: true,
      },
      {
        id: `signed_date_${roleNumber}`,
        name: `Signed Date ${roleNumber}`,
        fieldType: "DateSigned",
        pageNumber: DEFAULT_CONTRACT_SIGNATURE_PAGE,
        bounds: {
          x: 455,
          y: row.dateY,
          width: 95,
          height: 18,
        },
        isRequired: true,
      },
    ]
  })
}

function sanitizeSigners(signers: Signer[]) {
  return signers
    .map((signer) => ({
      name: signer.name?.trim(),
      emailAddress: signer.emailAddress?.trim(),
    }))
    .filter((signer) => signer.name && signer.emailAddress)
}

function mergeSignerRolesByEmail(signers: Signer[]) {
  const merged = new Map<string, Signer & { roleIndices: number[] }>()

  signers.forEach((signer, index) => {
    const key = signer.emailAddress.toLowerCase()
    const existing = merged.get(key)

    if (existing) {
      return
    }

    merged.set(key, {
      ...signer,
      roleIndices: [index],
    })
  })

  return Array.from(merged.values())
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

function getCustomContractPrefillFields(prefillFields: PrefillField[]) {
  return prefillFields.filter((field) => CUSTOM_CONTRACT_PREFILL_FIELD_IDS.has(field.id))
}

function prefillFieldsToMap(prefillFields: PrefillField[]): PrefillMap {
  return prefillFields.reduce<PrefillMap>((acc, field) => {
    acc[field.id] = field.value
    return acc
  }, {})
}

function getPrefillValue(prefillValues: PrefillMap, ...keys: string[]) {
  for (const key of keys) {
    const value = prefillValues[key]
    if (value) return value
  }

  return ""
}

function drawPrefillValue(
  page: any,
  font: any,
  value: string,
  options: { x: number; y: number; width: number; fontSize?: number; clearWidth?: number; clearHeight?: number }
) {
  if (!value.trim()) return

  const fontSize = options.fontSize || 8.5
  const text = truncateForPdf(value, Math.max(12, Math.floor(options.width / (fontSize * 0.45))))
  const clearWidth = options.clearWidth || options.width
  const clearHeight = options.clearHeight || fontSize + 5

  page.drawRectangle({
    x: options.x - 1,
    y: options.y - 3,
    width: clearWidth + 2,
    height: clearHeight,
    color: rgb(1, 1, 1),
  })
  page.drawLine({
    start: { x: options.x, y: options.y - 1.5 },
    end: { x: options.x + clearWidth, y: options.y - 1.5 },
    thickness: 0.45,
    color: rgb(0.15, 0.15, 0.15),
  })
  page.drawText(text, {
    x: options.x,
    y: options.y + 1.2,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  })
}

async function getDefaultContractTemplateBytes(contractUrl: string) {
  try {
    return await readFile(path.join(process.cwd(), "public", "contracts", "ordainedpro-default-contract.pdf"))
  } catch {
    const response = await fetch(contractUrl)
    if (!response.ok) {
      throw new Error("Unable to load the default contract PDF for personalization.")
    }

    return Buffer.from(await response.arrayBuffer())
  }
}

async function createPersonalizedDefaultContractBase64(contractUrl: string, prefillFields: PrefillField[]) {
  const templateBytes = await getDefaultContractTemplateBytes(contractUrl)
  const pdfDocument = await PDFDocument.load(templateBytes)
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica)
  const prefillValues = prefillFieldsToMap(prefillFields)
  const pages = pdfDocument.getPages()

  const draw = (pageIndex: number, key: string | string[], x: number, y: number, width: number, fontSize?: number, clearWidth?: number) => {
    const keys = Array.isArray(key) ? key : [key]
    const value = getPrefillValue(prefillValues, ...keys)
    const page = pages[pageIndex]
    if (!page) return
    drawPrefillValue(page, font, value, { x, y, width, fontSize, clearWidth })
  }

  draw(0, ["agreement_date", "wed_date"], 391, 689, 88, 8.5, 105)
  draw(0, ["comp_name", "officiant_business_name"], 135, 677, 260, 8.5, 250)
  draw(0, ["bride_name", "partner_1_name"], 95, 666, 145, 8.5, 145)
  draw(0, ["groom_name", "partner_2_name"], 292, 666, 145, 8.5, 145)
  draw(0, ["wed_date", "wedding_date"], 315, 589, 95, 8.5, 105)
  draw(0, ["wed_time", "wedding_time"], 54, 577, 95, 8.5, 105)
  draw(0, ["venue", "venue_name"], 84, 544, 250, 8.5, 250)
  draw(0, ["venue_addr", "venue_address"], 118, 532, 350, 8.5, 350)

  draw(1, ["ceremony_fee", "total_fee"], 159, 689, 80, 8.5, 75)
  draw(1, "deposit_amount", 107, 661, 80, 8.5, 75)
  draw(1, "arrival_minutes", 201, 344, 34, 8.5, 28)
  draw(1, "late_grace_minutes", 182, 328, 34, 8.5, 28)
  draw(1, "late_grace_minutes", 225, 300, 34, 8.5, 28)
  draw(1, "late_fee_half_hour", 135, 288, 55, 8.5, 50)
  draw(1, "full_day_fee", 360, 215, 70, 8.5, 54)
  draw(1, "included_miles", 105, 178, 40, 8.5, 28)
  draw(1, ["officiant_addr", "travel_origin_or_service_area"], 54, 145, 350, 8.5, 350)
  draw(1, "mileage_rate", 268, 128, 55, 8.5, 50)

  draw(2, "rehearsal_arrival_minutes", 484, 583, 34, 8.5, 28)

  draw(3, ["ceremony_fee", "total_fee"], 143, 598, 80, 8.5, 75)
  draw(3, "deposit_amount", 153, 586, 80, 8.5, 75)

  draw(4, ["bride_name", "partner_1_name"], 180, 642, 205)
  draw(4, ["groom_name", "partner_2_name"], 180, 542, 205)
  draw(4, ["comp_name", "officiant_business_name"], 180, 442, 205)
  draw(4, "bride_phone", 127, 340, 95, 8.2, 96)
  draw(4, "groom_phone", 314, 340, 95, 8.2, 96)
  draw(4, "bride_email", 123, 322, 115, 7.5, 100)
  draw(4, "groom_email", 306, 322, 115, 7.5, 100)
  draw(4, ["mailing_addr", "couple_mailing_address"], 125, 304, 390, 8)

  const personalizedBytes = await pdfDocument.save()
  return `data:application/pdf;base64,${Buffer.from(personalizedBytes).toString("base64")}`
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function prefillBoldSignDocumentFields(
  documentId: string,
  fields: PrefillField[],
  boldSignApiKey: string
) {
  if (!fields.length) {
    return { ok: true, skipped: true, fieldCount: 0 }
  }

  let lastResponseData: any = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(
      `https://api.boldsign.com/v1/document/prefillFields?documentId=${encodeURIComponent(documentId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": boldSignApiKey,
        },
        body: JSON.stringify({
          Fields: fields.map((field) => ({
            Id: field.id,
            Value: field.value,
          })),
        }),
      }
    )

    const responseText = await response.text()
    try {
      lastResponseData = responseText ? JSON.parse(responseText) : null
    } catch {
      lastResponseData = { raw: responseText }
    }

    if (response.ok) {
      return { ok: true, skipped: false, fieldCount: fields.length, details: lastResponseData }
    }

    if (attempt < 3) {
      await sleep(750 * attempt)
    }
  }

  return {
    ok: false,
    skipped: false,
    fieldCount: fields.length,
    error: extractBoldSignErrorMessages(lastResponseData).join(" ") || "BoldSign could not prefill custom contract tags.",
    details: lastResponseData,
  }
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
  const signers = mergeSignerRolesByEmail(sanitizeSigners(Array.isArray(body.signers) ? body.signers : []))
  const prefillFields = sanitizePrefillFields(body.prefillFields)
  const fileExtension = getFileExtension(contractUrl || contractName)
  const shouldUseManualFields = isDefaultContractUrl(contractUrl)

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

  const personalizedDefaultContractFile = shouldUseManualFields
    ? await createPersonalizedDefaultContractBase64(contractUrl, prefillFields)
    : null

  const boldSignPayload = {
    Title: contractName,
    Message: message,
    ...(personalizedDefaultContractFile
      ? {
          Files: [
            {
              fileName: "OrdainedPro-Default-Wedding-Contract.pdf",
              base64: personalizedDefaultContractFile,
            },
          ],
        }
      : {
          FileUrls: [contractUrl],
        }),
    Signers: signers.map((signer, index) => ({
      name: signer.name,
      emailAddress: signer.emailAddress,
      signerType: "Signer",
      locale: "EN",
      signerOrder: index + 1,
      ...(shouldUseManualFields ? { formFields: getDefaultContractFormFields(signer.roleIndices || [index]) } : {}),
    })),
    EnableSigningOrder: false,
    AutoDetectFields: false,
    UseTextTags: !shouldUseManualFields,
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
    const customContractSuffix = shouldUseManualFields ? "" : ` ${CUSTOM_CONTRACT_TAG_GUIDANCE}`
    return NextResponse.json(
      {
        error:
          `${boldSignMessages.join(" ") ||
          responseData?.message ||
          responseData?.error ||
          "BoldSign failed to send the contract."}${customContractSuffix}`,
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

  const customPrefillFields = shouldUseManualFields ? [] : getCustomContractPrefillFields(prefillFields)
  const prefillResult = shouldUseManualFields
    ? { ok: true, skipped: true, fieldCount: 0 }
    : await prefillBoldSignDocumentFields(documentId, customPrefillFields, boldSignApiKey)

  if (!prefillResult.ok) {
    console.warn("BoldSign custom contract prefill did not complete. The signature request was still sent.", prefillResult)
  }

  return NextResponse.json({
    documentId,
    boldSignStatus: responseData?.status || "accepted",
    statusCheck: null,
    prefillSkipped: Boolean(prefillResult.skipped),
    prefillResult,
    raw: responseData,
  })
}
