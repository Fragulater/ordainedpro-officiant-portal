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

const SUPPORTED_BOLDSIGN_FILE_EXTENSIONS = [".pdf", ".txt"]
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
  "parent_guardian_1_name",
  "parent_guardian_1_phone",
  "parent_guardian_1_email",
  "parent_guardian_1_signature_date",
  "parent_guardian_2_name",
  "parent_guardian_2_phone",
  "parent_guardian_2_email",
  "parent_guardian_2_signature_date",
  "honoree_full_name",
  "honoree_first_name",
  "honoree_age",
  "honoree_birthday",
  "honoree_celebration_type",
  "deceased_full_name",
  "deceased_first_name",
  "deceased_date_of_birth",
  "deceased_date_of_passing",
  "memorial_service_date",
  "memorial_service_time",
  "memorial_venue_name",
  "memorial_venue_address",
  "primary_family_contact_name",
  "secondary_family_contact_name",
  "primary_family_contact_phone",
  "primary_family_contact_email",
  "primary_family_contact_signature_date",
  "secondary_family_contact_signature_date",
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

function isTextContractExtension(fileExtension: string) {
  return fileExtension === ".txt"
}

function getSafePdfFileName(contractName: string) {
  const safeName = contractName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "contract"

  return `${safeName}.pdf`
}

const BOLDSIGN_TEXT_TAG_PATTERN = /{{[\s\S]*?}}/g
const VALID_BOLDSIGN_TEXT_TAG_PATTERN =
  /{{(?:text|sign|date|editdate|init|title|company)\|[1-9]\d*\|(?:\*| )\|[^{}\n|]*\|[A-Za-z0-9_-]+}}/g
const VALID_BOLDSIGN_TEXT_TAG_EXACT_PATTERN =
  /^{{(?:text|sign|date|editdate|init|title|company)\|[1-9]\d*\|(?:\*| )\|[^{}\n|]*\|[A-Za-z0-9_-]+}}$/

function normalizeBoldSignTextTags(text: string) {
  return text.replace(BOLDSIGN_TEXT_TAG_PATTERN, (tag) =>
    tag
      .replace(/\r?\n\s*/g, "")
      .replace(/\t+/g, " ")
  )
}

function getTextTagSummary(text: string) {
  const allTags = text.match(BOLDSIGN_TEXT_TAG_PATTERN) || []
  const validTags = text.match(VALID_BOLDSIGN_TEXT_TAG_PATTERN) || []
  const invalidTags = allTags.filter((tag) => !VALID_BOLDSIGN_TEXT_TAG_EXACT_PATTERN.test(tag))
  const signatureTags = validTags.filter((tag) => tag.startsWith("{{sign|"))

  return {
    totalTags: allTags.length,
    validTags: validTags.length,
    signatureTags: signatureTags.length,
    invalidTags,
  }
}

function splitLineForPdfWrap(line: string) {
  const tokens: string[] = []
  let lastIndex = 0

  line.replace(BOLDSIGN_TEXT_TAG_PATTERN, (tag, index) => {
    if (index > lastIndex) {
      tokens.push(...line.slice(lastIndex, index).match(/\S+\s*|\s+/g) || [])
    }

    tokens.push(tag)
    lastIndex = index + tag.length
    return tag
  })

  if (lastIndex < line.length) {
    tokens.push(...line.slice(lastIndex).match(/\S+\s*|\s+/g) || [])
  }

  return tokens
}

function wrapPdfTextLine(line: string, maxCharacters: number) {
  if (line.length <= maxCharacters) return [line]

  const wrappedLines: string[] = []
  let currentLine = ""

  splitLineForPdfWrap(line).forEach((token) => {
    if (!currentLine) {
      currentLine = token.trimStart()
      return
    }

    if (currentLine.length + token.length > maxCharacters && currentLine.trim()) {
      wrappedLines.push(currentLine.trimEnd())
      currentLine = token.trimStart()
      return
    }

    currentLine += token
  })

  if (currentLine) {
    wrappedLines.push(currentLine.trimEnd())
  }

  return wrappedLines
}

async function createTextContractPdfBase64(contractUrl: string, contractName: string) {
  const response = await fetch(contractUrl)

  if (!response.ok) {
    throw new Error("Unable to load the saved contract text before sending it to BoldSign.")
  }

  const contractText = normalizeBoldSignTextTags(await response.text())
  const tagSummary = getTextTagSummary(contractText)

  if (tagSummary.invalidTags.length > 0) {
    throw new Error(
      `This contract contains invalid BoldSign text tags. Please fix these tags before sending: ${tagSummary.invalidTags.slice(0, 3).join(", ")}`
    )
  }

  if (tagSummary.totalTags > 0 && tagSummary.signatureTags === 0) {
    throw new Error("This contract has BoldSign text tags, but no valid signature tag. Add at least one {{sign|...}} tag before sending.")
  }

  const pdfDocument = await PDFDocument.create()
  const font = await pdfDocument.embedFont(StandardFonts.Courier)
  const boldFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold)
  const pageWidth = 612
  const pageHeight = 792
  const marginX = 54
  const marginTop = 54
  const marginBottom = 54
  const fontSize = 9
  const lineHeight = 13
  const maxCharactersPerLine = 88

  let page = pdfDocument.addPage([pageWidth, pageHeight])
  let cursorY = pageHeight - marginTop

  page.drawText(contractName || "Contract", {
    x: marginX,
    y: cursorY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  cursorY -= lineHeight * 2

  const drawLine = (line: string) => {
    if (cursorY < marginBottom) {
      page = pdfDocument.addPage([pageWidth, pageHeight])
      cursorY = pageHeight - marginTop
    }

    if (line.trim()) {
      page.drawText(line, {
        x: marginX,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }

    cursorY -= lineHeight
  }

  contractText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .forEach((line) => {
      const wrappedLines = wrapPdfTextLine(line, maxCharactersPerLine)
      wrappedLines.forEach(drawLine)
    })

  const pdfBytes = await pdfDocument.save()
  return `data:application/pdf;base64,${Buffer.from(pdfBytes).toString("base64")}`
}

const DEFAULT_CONTRACT_SIGNATURE_PAGE = 5

function getDefaultContractFormFields(roleIndices: number[]) {
  const rows = [
    { signatureY: 240, dateY: 240 },
    { signatureY: 340, dateY: 340 },
    { signatureY: 440, dateY: 440 },
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
          x: 166,
          y: row.signatureY,
          width: 245,
          height: 18,
        },
        isRequired: true,
      },
      {
        id: `signed_date_${roleNumber}`,
        name: `Signed Date ${roleNumber}`,
        fieldType: "DateSigned",
        pageNumber: DEFAULT_CONTRACT_SIGNATURE_PAGE,
        bounds: {
          x: 465,
          y: row.dateY,
          width: 80,
          height: 16,
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
  const boldFont = await pdfDocument.embedFont(StandardFonts.HelveticaBold)
  const prefillValues = prefillFieldsToMap(prefillFields)
  const pages = pdfDocument.getPages()

  const draw = (pageIndex: number, key: string | string[], x: number, y: number, width: number, fontSize?: number, clearWidth?: number) => {
    const keys = Array.isArray(key) ? key : [key]
    const value = getPrefillValue(prefillValues, ...keys)
    const page = pages[pageIndex]
    if (!page) return
    drawPrefillValue(page, font, value, { x, y, width, fontSize, clearWidth })
  }

  const drawLabel = (pageIndex: number, text: string, x: number, y: number, size = 9) => {
    const page = pages[pageIndex]
    if (!page) return
    page.drawText(text, { x, y, size, font: boldFont, color: rgb(0, 0, 0) })
  }

  const clearArea = (pageIndex: number, x: number, y: number, width: number, height: number) => {
    const page = pages[pageIndex]
    if (!page) return
    page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1) })
  }

  const drawCleanField = (
    pageIndex: number,
    key: string | string[],
    label: string,
    x: number,
    y: number,
    valueX: number,
    lineWidth: number,
    fontSize = 8.5
  ) => {
    drawLabel(pageIndex, label, x, y + 1, 8.5)
    draw(pageIndex, key, valueX, y, lineWidth, fontSize, lineWidth)
  }

  clearArea(0, 42, 645, 528, 55)
  pages[0]?.drawText('This Wedding Ceremony Agreement and Confirmation (the "Agreement") is made as of', {
    x: 54,
    y: 689,
    size: 8.5,
    font,
    color: rgb(0, 0, 0),
  })
  draw(0, ["agreement_date", "wed_date"], 392, 689, 82, 8.5, 82)
  pages[0]?.drawText("and is between:", {
    x: 482,
    y: 689,
    size: 8.5,
    font,
    color: rgb(0, 0, 0),
  })
  drawCleanField(0, ["comp_name", "officiant_business_name"], "Officiant / Company:", 54, 674, 145, 170)
  drawCleanField(0, ["bride_name", "partner_1_name"], "Partner 1:", 54, 660, 112, 150)
  drawCleanField(0, ["groom_name", "partner_2_name"], "Partner 2:", 285, 660, 343, 150)
  pages[0]?.drawText('The Officiant and Partner 1 and Partner 2 are collectively referred to as "The Couple" where applicable.', {
    x: 54,
    y: 648,
    size: 8.5,
    font,
    color: rgb(0, 0, 0),
  })

  draw(0, ["wed_date", "wedding_date"], 315, 589, 92, 8.5, 92)
  draw(0, ["wed_time", "wedding_time"], 54, 577, 90, 8.5, 90)
  draw(0, ["venue", "venue_name"], 84, 544, 150, 8.5, 150)
  draw(0, ["venue_addr", "venue_address"], 118, 532, 245, 8.5, 245)

  draw(1, ["ceremony_fee", "total_fee"], 164, 689, 70, 8.5, 54)
  draw(1, "deposit_amount", 112, 661, 70, 8.5, 54)
  draw(1, "arrival_minutes", 201, 344, 34, 8.5, 18)
  draw(1, "late_grace_minutes", 182, 328, 34, 8.5, 18)
  draw(1, "late_grace_minutes", 225, 300, 34, 8.5, 18)
  draw(1, "late_fee_half_hour", 139, 288, 55, 8.5, 38)
  draw(1, "full_day_fee", 360, 215, 70, 8.5, 54)
  draw(1, "included_miles", 105, 178, 40, 8.5, 18)
  draw(1, ["officiant_addr", "travel_origin_or_service_area"], 54, 145, 240, 8.5, 240)
  draw(1, "mileage_rate", 272, 128, 55, 8.5, 36)

  draw(2, "rehearsal_arrival_minutes", 484, 583, 34, 8.5, 18)

  draw(3, ["ceremony_fee", "total_fee"], 148, 598, 70, 8.5, 54)
  draw(3, "deposit_amount", 158, 586, 70, 8.5, 54)

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

async function getBoldSignDocumentProperties(documentId: string, boldSignApiKey: string) {
  const response = await fetch(
    `https://api.boldsign.com/v1/document/properties?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-KEY": boldSignApiKey,
      },
    }
  )

  const responseText = await response.text()
  let responseData: any = null
  try {
    responseData = responseText ? JSON.parse(responseText) : null
  } catch {
    responseData = { raw: responseText }
  }

  return {
    ok: response.ok,
    status: response.status,
    data: responseData,
  }
}

async function waitForBoldSignDocumentProperties(documentId: string, boldSignApiKey: string) {
  let lastResult: Awaited<ReturnType<typeof getBoldSignDocumentProperties>> | null = null

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    lastResult = await getBoldSignDocumentProperties(documentId, boldSignApiKey)

    if (lastResult.ok && lastResult.data?.documentId) {
      return {
        ok: true,
        attempts: attempt,
        details: lastResult.data,
      }
    }

    await sleep(Math.min(1000 * attempt, 3000))
  }

  return {
    ok: false,
    attempts: 8,
    details: lastResult?.data || null,
    status: lastResult?.status || null,
    error:
      extractBoldSignErrorMessages(lastResult?.data).join(" ") ||
      "BoldSign accepted the request, but the document was not visible in document properties after processing.",
  }
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
  const shouldConvertTextContract = isTextContractExtension(fileExtension)

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
          "BoldSign contract sending requires a PDF. Saved text contracts are automatically converted before sending.",
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
  const convertedTextContractFile = shouldConvertTextContract
    ? await createTextContractPdfBase64(contractUrl, contractName)
    : null
  const contractBase64File = personalizedDefaultContractFile || convertedTextContractFile

  const boldSignPayload = {
    Title: contractName,
    Message: message,
    ...(contractBase64File
      ? {
          Files: [
            {
              fileName: personalizedDefaultContractFile
                ? "OrdainedPro-Default-Wedding-Contract.pdf"
                : getSafePdfFileName(contractName),
              base64: contractBase64File,
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

  const statusCheck = await waitForBoldSignDocumentProperties(documentId, boldSignApiKey)
  if (!statusCheck.ok) {
    console.error("BoldSign document was not confirmed after send:", {
      documentId,
      statusCheck,
      rawSendResponse: responseData,
    })

    return NextResponse.json(
      {
        error:
          `${statusCheck.error} This usually means BoldSign's asynchronous processing failed, the webhook is not configured, or the API key belongs to a different BoldSign account than the dashboard being checked.`,
        documentId,
        boldSignStatus: responseData?.status || "accepted",
        statusCheck,
        raw: responseData,
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
    boldSignStatus: statusCheck.details?.status || responseData?.status || "accepted",
    statusCheck,
    prefillSkipped: Boolean(prefillResult.skipped),
    prefillResult,
    raw: responseData,
  })
}
