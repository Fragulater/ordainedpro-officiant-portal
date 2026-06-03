"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import confetti from "canvas-confetti"
import mammoth from "mammoth"
import { supabase } from "@/supabase/utils/client"
import { Button } from "@/components/ui/button"
import { Download, Check, Eye, Save } from "lucide-react"
import { Task } from "@/components/AddTaskDialog"
import { Meeting } from "@/components/ScheduleMeetingDialog"
import { UploadedFile } from "@/components/FileUpload"
import { Contract } from "@/components/ContractUploadDialog"
import { CommunicationPortalProvider } from "./communication-portal/CommunicationPortalContext"
import {
  loadCouples as loadCouplesFromDB,
  addCeremony as addCeremonyToDB,
  updateCouple as updateCoupleInDB,
  upsertCeremonyDetails as upsertCeremonyDetailsInDB,
  loadAllTasks as loadAllTasksFromDB,
  addTask as addTaskToDB,
  updateTask as updateTaskInDB,
  deleteTask as deleteTaskFromDB,
  loadFiles as loadFilesFromDB,
  addFile as addFileToDB,
  deleteFile as deleteFileFromDB,
  loadMeetings as loadMeetingsFromDB,
  updateMeeting as updateMeetingInDB,
  deleteMeeting as deleteMeetingFromDB,
  loadContracts as loadContractsFromDB,
  addContract as addContractToDB,
  updateContract as updateContractInDB,
  deleteContract as deleteContractFromDB,
  loadPayments as loadPaymentsFromDB,
  loadAllPayments as loadAllPaymentsFromDB,
  addPayment as addPaymentToDB,
  updatePayment as updatePaymentInDB,
  loadInvoiceServices as loadInvoiceServicesFromDB,
  addInvoiceService as addInvoiceServiceToDB,
  deleteInvoiceService as deleteInvoiceServiceFromDB,
  loadScripts as loadScriptsFromDB,
  addScript as addScriptToDB,
  updateScript as updateScriptInDB,
  deleteScript as deleteScriptFromDB,
  loadScriptSales as loadScriptSalesFromDB,
  autoSaveScript as autoSaveScriptToDB
} from "@/services/couple-data-service"
import { PortalHeader } from "./communication-portal/CeremoniesCouples/PortalHeader"
import { PortalOverview } from "./communication-portal/CeremoniesCouples/PortalOverview"
import { PortalTabs } from "./communication-portal/PortalTabs"
import { PortalDialogs } from "./communication-portal/PortalDialogs"
import {
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG,
  DEFAULT_CONTRACT_TEMPLATE_VERSION,
} from "@/lib/contract-legal-acknowledgment"
import {
  MR_SCRIPT_LENGTH_OPTIONS,
  MR_SCRIPT_SERVICE_OPTIONS,
  getMrScriptServiceByResponse,
  getMrScriptStoryPrompts,
} from "@/data/mr-script-services"
import {
  formatReadingsForPrompt,
  getReadingRecommendations,
} from "@/data/ceremony-readings"

// Safe helper to get first name from a full name (null-safe)
const getFirstName = (fullName: string | null | undefined): string => {
  if (!fullName || typeof fullName !== 'string') return 'Partner'
  return fullName.split(' ')[0] || 'Partner'
}

const sanitizeStorageFileName = (fileName: string) => {
  const trimmedName = fileName.trim() || "uploaded-file"
  const lastDotIndex = trimmedName.lastIndexOf(".")
  const baseName = lastDotIndex > 0 ? trimmedName.slice(0, lastDotIndex) : trimmedName
  const extension = lastDotIndex > 0 ? trimmedName.slice(lastDotIndex + 1) : ""
  const safeBaseName = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "uploaded-file"
  const safeExtension = extension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 16)

  return safeExtension ? `${safeBaseName}.${safeExtension}` : safeBaseName
}

const launchArchiveConfettiOnce = (ceremonyId: number | string) => {
  if (typeof window === "undefined") return

  const storageKey = `ordainedpro-archive-confetti-${ceremonyId}`
  if (window.localStorage.getItem(storageKey)) {
    window.localStorage.removeItem(storageKey)
  }

  window.localStorage.setItem(storageKey, "shown")

  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.58 },
    colors: ["#2563eb", "#ec4899", "#f59e0b", "#10b981"],
  })

  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ["#2563eb", "#ec4899", "#f59e0b", "#10b981"],
    })
  }, 180)

  setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ["#2563eb", "#ec4899", "#f59e0b", "#10b981"],
    })
  }, 320)
}

const PREMIUM_SCRIPT_LIMIT = 3

type CeremonyTypeConfig = {
  value: string
  label: string
  createTitle: string
  createDescription: string
  participantHeader: string
  peopleCardTitle: string
  primarySectionTitle: string
  secondarySectionTitle: string
  primaryRole: string
  secondaryRole: string
  primaryNamePlaceholder: string
  secondaryNamePlaceholder: string
  primaryEmailPlaceholder: string
  secondaryEmailPlaceholder: string
  primaryPhonePlaceholder: string
  secondaryPhonePlaceholder: string
  primaryAddressPlaceholder: string
  secondaryAddressPlaceholder: string
  primaryAgeLabel?: string
  secondaryAgeLabel?: string
  ceremonyNamePlaceholder: string
}

const CEREMONY_TYPE_OPTIONS: CeremonyTypeConfig[] = [
  {
    value: "wedding",
    label: "Wedding Ceremony",
    createTitle: "Create a New Wedding Ceremony",
    createDescription: "Fill in the details for the new wedding ceremony you'll be officiating.",
    participantHeader: "Couple Information",
    peopleCardTitle: "Wedding Couple",
    primarySectionTitle: "Partner 1 Information",
    secondarySectionTitle: "Partner 2 Information",
    primaryRole: "Partner 1",
    secondaryRole: "Partner 2",
    primaryNamePlaceholder: "Partner 1 full name",
    secondaryNamePlaceholder: "Partner 2 full name",
    primaryEmailPlaceholder: "Partner 1 email",
    secondaryEmailPlaceholder: "Partner 2 email",
    primaryPhonePlaceholder: "Partner 1 phone",
    secondaryPhonePlaceholder: "Partner 2 phone",
    primaryAddressPlaceholder: "Partner 1 primary address",
    secondaryAddressPlaceholder: "Partner 2 primary address",
    ceremonyNamePlaceholder: "e.g., Sarah & David's Wedding",
  },
  {
    value: "quinceanera",
    label: "QuinceaÃ±era / Coming of Age",
    createTitle: "Create a New QuinceaÃ±era",
    createDescription: "Fill in the details for the coming-of-age ceremony you'll be officiating.",
    participantHeader: "Honoree & Parent/Guardian Information",
    peopleCardTitle: "Honoree & Parent/Guardian",
    primarySectionTitle: "Honoree Information",
    secondarySectionTitle: "Parent/Guardian Information",
    primaryRole: "Honoree",
    secondaryRole: "Parent/Guardian",
    primaryNamePlaceholder: "Honoree's full name",
    secondaryNamePlaceholder: "Parent/guardian full name",
    primaryEmailPlaceholder: "Honoree email, if available",
    secondaryEmailPlaceholder: "Parent/guardian email",
    primaryPhonePlaceholder: "Honoree phone, if available",
    secondaryPhonePlaceholder: "Parent/guardian phone",
    primaryAddressPlaceholder: "Honoree primary address",
    secondaryAddressPlaceholder: "Parent/guardian primary address",
    primaryAgeLabel: "Honoree Age",
    ceremonyNamePlaceholder: "e.g., Isabella's QuinceaÃ±era",
  },
  {
    value: "celebration_of_life",
    label: "Celebration of Life / Wake",
    createTitle: "Create a Celebration of Life",
    createDescription: "Fill in the details for the remembrance service you'll be officiating.",
    participantHeader: "Host & Honoree Information",
    peopleCardTitle: "Host & Honoree",
    primarySectionTitle: "Host Information",
    secondarySectionTitle: "Honoree Information",
    primaryRole: "Host",
    secondaryRole: "Honoree",
    primaryNamePlaceholder: "Host's full name",
    secondaryNamePlaceholder: "Deceased person's full name",
    primaryEmailPlaceholder: "Host email",
    secondaryEmailPlaceholder: "Family contact email, if different",
    primaryPhonePlaceholder: "Host phone",
    secondaryPhonePlaceholder: "Family contact phone, if different",
    primaryAddressPlaceholder: "Host primary address",
    secondaryAddressPlaceholder: "Honoree's city/state or family address",
    secondaryAgeLabel: "Honoree Age",
    ceremonyNamePlaceholder: "e.g., Celebration of Life for Robert",
  },
  {
    value: "baby_blessing",
    label: "Baby Blessing / Naming",
    createTitle: "Create a Baby Blessing",
    createDescription: "Fill in the details for the baby blessing or naming ceremony.",
    participantHeader: "Child & Parent/Guardian Information",
    peopleCardTitle: "Child & Parent/Guardian",
    primarySectionTitle: "Child Information",
    secondarySectionTitle: "Parent/Guardian Information",
    primaryRole: "Child",
    secondaryRole: "Parent/Guardian",
    primaryNamePlaceholder: "Child's full name",
    secondaryNamePlaceholder: "Parent/guardian full name",
    primaryEmailPlaceholder: "Child email, if applicable",
    secondaryEmailPlaceholder: "Parent/guardian email",
    primaryPhonePlaceholder: "Child phone, if applicable",
    secondaryPhonePlaceholder: "Parent/guardian phone",
    primaryAddressPlaceholder: "Child primary address",
    secondaryAddressPlaceholder: "Parent/guardian primary address",
    primaryAgeLabel: "Child Age",
    ceremonyNamePlaceholder: "e.g., Emma's Baby Blessing",
  },
  {
    value: "vow_renewal",
    label: "Vow Renewal",
    createTitle: "Create a Vow Renewal",
    createDescription: "Fill in the details for the vow renewal ceremony you'll be officiating.",
    participantHeader: "Couple Information",
    peopleCardTitle: "Couple Information",
    primarySectionTitle: "Partner 1 Information",
    secondarySectionTitle: "Partner 2 Information",
    primaryRole: "Partner 1",
    secondaryRole: "Partner 2",
    primaryNamePlaceholder: "Partner 1 full name",
    secondaryNamePlaceholder: "Partner 2 full name",
    primaryEmailPlaceholder: "Partner 1 email",
    secondaryEmailPlaceholder: "Partner 2 email",
    primaryPhonePlaceholder: "Partner 1 phone",
    secondaryPhonePlaceholder: "Partner 2 phone",
    primaryAddressPlaceholder: "Partner 1 primary address",
    secondaryAddressPlaceholder: "Partner 2 primary address",
    ceremonyNamePlaceholder: "e.g., Sarah & David's Vow Renewal",
  },
  {
    value: "other",
    label: "Other Ceremony",
    createTitle: "Create a New Ceremony",
    createDescription: "Fill in the details for the ceremony you'll be officiating.",
    participantHeader: "Participant Information",
    peopleCardTitle: "Participants",
    primarySectionTitle: "Primary Contact Information",
    secondarySectionTitle: "Participant / Honoree Information",
    primaryRole: "Primary Contact",
    secondaryRole: "Participant / Honoree",
    primaryNamePlaceholder: "Primary contact full name",
    secondaryNamePlaceholder: "Participant or honoree full name",
    primaryEmailPlaceholder: "Primary contact email",
    secondaryEmailPlaceholder: "Participant email, if applicable",
    primaryPhonePlaceholder: "Primary contact phone",
    secondaryPhonePlaceholder: "Participant phone, if applicable",
    primaryAddressPlaceholder: "Primary contact address",
    secondaryAddressPlaceholder: "Participant address, if applicable",
    ceremonyNamePlaceholder: "e.g., Community Blessing",
  },
]

const normalizeCeremonyTypeText = (value?: string | null) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ã±|Ã±/gi, "n")

const resolveCeremonyTypeValue = (value?: string | null) => {
  const normalized = normalizeCeremonyTypeText(value)

  if (!normalized) return "wedding"

  const directMatch = CEREMONY_TYPE_OPTIONS.find((option) => (
    normalizeCeremonyTypeText(option.value) === normalized ||
    normalizeCeremonyTypeText(option.label) === normalized
  ))

  if (directMatch) return directMatch.value

  if (/(quince|coming\s*of\s*age|sweet\s*16|sweet sixteen|honoree)/.test(normalized)) {
    return "quinceanera"
  }

  if (/(baby|child|naming|blessing)/.test(normalized)) {
    return "baby_blessing"
  }

  if (/(celebration\s*of\s*life|memorial|funeral|wake|remembrance|deceased)/.test(normalized)) {
    return "celebration_of_life"
  }

  if (/(vow|renewal)/.test(normalized)) {
    return "vow_renewal"
  }

  if (/(wedding|marriage|commitment)/.test(normalized)) {
    return "wedding"
  }

  return "other"
}

const getCeremonyTypeConfig = (type?: string) =>
  CEREMONY_TYPE_OPTIONS.find((option) => option.value === resolveCeremonyTypeValue(type)) || CEREMONY_TYPE_OPTIONS[0]

const getCeremonyTypeFromNotes = (notes?: string | null) => {
  if (!notes) return "wedding"
  const match = notes.match(/^Ceremony type:\s*(.+)$/im)
  const label = match?.[1]?.trim()
  return resolveCeremonyTypeValue(label || notes)
}

const getCeremonyAgeFromNotes = (notes: string | null | undefined, role?: string) => {
  if (!notes || !role) return ""
  const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = notes.match(new RegExp(`^${escapedRole} age:\\s*(.+)$`, "im"))
  return match?.[1]?.trim() || ""
}

const formatProfileTime = (time?: string | null) => {
  if (!time) return ""

  const [hourText, minuteText] = time.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText || "0")

  if (Number.isNaN(hour) || Number.isNaN(minute)) return time

  return new Date(2024, 0, 1, hour, minute).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

const getMeetingStart = (meeting: { date?: string; time?: string | null }) => {
  const date = meeting.date || ""
  const time = meeting.time || "00:00"
  return new Date(`${date}T${time}`)
}

const getMeetingDisplayStatus = (meeting: { date?: string; time?: string | null; status?: string }) => {
  const status = meeting.status || "pending"
  if (!["canceled", "declined", "completed"].includes(status) && getMeetingStart(meeting).getTime() < Date.now()) {
    return "completed"
  }
  if (["pending", "accepted", "declined", "confirmed", "canceled", "completed"].includes(status)) {
    return status as Meeting["status"]
  }
  return "pending"
}

const formatMeetingDateTime = (meeting: { date?: string; time?: string | null }) => {
  const start = getMeetingStart(meeting)
  if (Number.isNaN(start.getTime())) return "Date TBD"

  return start.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

const getPaymentDateValue = (payment: any) => new Date(payment.dueDate || payment.paidDate || payment.createdAt || payment.date || Date.now())

const REFUND_FEE_RATE = 0.05

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100

const sanitizeMessageText = (value: string) =>
  String(value || "")
    .replace(/Quincea(?:ÃƒÂ±|Ã±|ÃƒÂ±|ñ)era/gi, "Quinceanera")
    .replace(/â€¢|Ã¢â‚¬Â¢|ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â/g, "-")
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, '"')
    .replace(/Ã¢â‚¬â€œ|Ã¢â‚¬â€/g, "-")
    .replace(/Â/g, "")
    .replace(/Ãƒ/g, "")

const sanitizeProfileNotesForScript = (value: string) =>
  String(value || "")
    .replace(/\bvuiew\b/gi, "view")
    .replace(/\bsectrions\b/gi, "sections")
    .replace(/\bThis is were\b/gi, "This is where")

const isRefundPayment = (payment: any) =>
  payment?.status === "refunded" || String(payment?.type || payment?.payment_method || "").toLowerCase() === "refund"

const isPaidPayment = (payment: any) => payment?.status === "paid" && !isRefundPayment(payment)

const isInvoiceCharge = (payment: any) => payment?.status === "pending"

const calculatePaymentSummary = (records: any[]) => {
  const charges = records.filter(isInvoiceCharge)
  const paidRecords = records.filter(isPaidPayment)
  const refundRecords = records.filter(isRefundPayment)
  const totalCharged = charges.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalPaid = paidRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalRefunded = refundRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const totalRefundFees = refundRecords.reduce((sum, payment) => sum + Number(payment.refundFee || payment.refund_fee_amount || 0), 0)
  const netPaid = Math.max(0, totalPaid - totalRefunded)
  const totalAmount = totalCharged > 0 ? totalCharged : netPaid
  const balance = Math.max(0, totalAmount - netPaid)
  const nextCharge = charges
    .slice()
    .sort((a, b) => getPaymentDateValue(a).getTime() - getPaymentDateValue(b).getTime())[0]

  return {
    totalAmount,
    totalPaid: netPaid,
    totalRefunded,
    totalRefundFees,
    balance,
    finalPaymentDue: nextCharge?.dueDate || nextCharge?.due_date || "",
    paymentStatus: balance === 0 && totalAmount > 0 ? "paid_in_full" : netPaid > 0 ? "deposit_paid" : "pending"
  }
}

// Helper function to generate consistent colors based on couple ID
const getCoupleColors = (coupleId: number) => {
  const colorPairs = [
    { bride: "bg-pink-500", groom: "bg-blue-500", brideRing: "ring-pink-100", groomRing: "ring-blue-100", brideText: "text-pink-600", groomText: "text-blue-600", brideIcon: "text-pink-500", groomIcon: "text-blue-500" },
    { bride: "bg-red-500", groom: "bg-indigo-500", brideRing: "ring-red-100", groomRing: "ring-indigo-100", brideText: "text-red-600", groomText: "text-indigo-600", brideIcon: "text-red-500", groomIcon: "text-indigo-500" },
    { bride: "bg-purple-500", groom: "bg-green-500", brideRing: "ring-purple-100", groomRing: "ring-green-100", brideText: "text-purple-600", groomText: "text-green-600", brideIcon: "text-purple-500", groomIcon: "text-green-500" },
    { bride: "bg-orange-500", groom: "bg-cyan-500", brideRing: "ring-orange-100", groomRing: "ring-cyan-100", brideText: "text-orange-600", groomText: "text-cyan-600", brideIcon: "text-orange-500", groomIcon: "text-cyan-500" },
  ]
  return colorPairs[(coupleId - 1) % colorPairs.length]
}

const deriveContractStoragePath = (fileUrl: string | null | undefined) => {
  if (!fileUrl) return null

  try {
    const url = new URL(fileUrl)
    const marker = "/storage/v1/object/public/contracts/"
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

const getContractFileUrl = (contract: any) => contract?.fileUrl || contract?.file_url || contract?.file?.url || ""

const DEFAULT_CONTRACT_NAME = "OrdainedPro Default Wedding Contract"
const DEFAULT_CONTRACT_ASSET_PATH = "/contracts/ordainedpro-default-contract.pdf?v=20260522-clean"
const DEFAULT_CONTRACT_FILE_SIZE = 10909
const PDF_CONTRACT_FILE_TYPE = "application/pdf"
const DEFAULT_CONTRACT_PREFILL_DEFAULTS = {
  ceremonyFee: "",
  depositAmount: "",
  arrivalMinutes: "20",
  rehearsalArrivalMinutes: "20",
  lateGraceMinutes: "30",
  lateFeeHalfHour: "",
  fullDayFee: "",
  includedMiles: "",
  officiantAddress: "",
  mileageRate: "",
}

const getDefaultContractUrl = () => {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (configuredSiteUrl) {
    return `${configuredSiteUrl}${DEFAULT_CONTRACT_ASSET_PATH}`
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${DEFAULT_CONTRACT_ASSET_PATH}`
  }

  return DEFAULT_CONTRACT_ASSET_PATH
}

const isOrdainedProDefaultContract = (contract: any) => (
  contract?.name === DEFAULT_CONTRACT_NAME ||
  getContractFileUrl(contract).includes("/contracts/ordainedpro-default-contract")
)

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

const formatContractMoney = (amount: number | string | null | undefined) => {
  const numericAmount = typeof amount === "string"
    ? Number.parseFloat(amount.replace(/[^0-9.-]/g, ""))
    : Number(amount || 0)
  return Number.isFinite(numericAmount) && numericAmount > 0 ? formatCurrency(numericAmount) : ""
}

const formatContractDate = (value: string | null | undefined) => {
  if (!value) return ""
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const formatContractTime = (value: string | null | undefined) => {
  if (!value) return ""
  const [hours, minutes] = value.split(":")
  const date = new Date()
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

const isTextContract = (contract: any) => {
  const fileName = (contract?.file?.name || contract?.name || "").toLowerCase()
  const fileType = (contract?.file?.type || contract?.fileType || contract?.file_type || "").toLowerCase()
  return fileType.startsWith("text/") || fileName.endsWith(".txt")
}

const replaceContractPlaceholders = (template: string, values: Record<string, string>) => (
  template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => values[key] || "")
)

const getInvoiceItemAmount = (item: { quantity: number; rate: number }) => item.quantity * item.rate

const calculateInvoiceValues = (form: any) => {
  const subtotal = form.items.reduce((sum: number, item: any) => sum + getInvoiceItemAmount(item), 0)
  const taxAmount = subtotal * (form.taxRate / 100)
  const total = subtotal + taxAmount
  const depositPaid = Math.min(Math.max(Number(form.depositPaid || 0), 0), total)
  const balanceDue = Math.max(0, total - depositPaid)

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    depositPaid: Math.round(depositPaid * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
  }
}

const marketplaceBaseUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://scripts.ordainedpro.com"
const MAIN_MARKETPLACE_SCRIPT_LIMIT = 10

const transformScriptRecord = (s: any) => ({
  id: s.id,
  title: s.title,
  type: s.type,
  status: s.status,
  content: s.content,
  description: s.description || '',
  lastModified: s.updated_at ? new Date(s.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '',
  createdDate: s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : '',
  coupleId: s.couple_id ?? s.coupleId ?? null,
  isPublished: s.is_published || s.isPublished || false,
  price: Number(s.price) || 0,
  sales: s.sales_count || s.sales || 0,
  earnings: Number(s.earnings_total ?? s.earnings) || 0,
  rating: Number(s.rating) || 0,
  marketplaceLanguages: Array.isArray(s.marketplace_languages) ? s.marketplace_languages : (s.marketplaceLanguages || []),
  marketplaceCategories: Array.isArray(s.marketplace_categories) ? s.marketplace_categories : (s.marketplaceCategories || []),
  marketplaceCeremonyTypes: Array.isArray(s.marketplace_ceremony_types) ? s.marketplace_ceremony_types : (s.marketplaceCeremonyTypes || []),
  marketplaceVisibility: s.marketplace_visibility || s.marketplaceVisibility || "main_marketplace",
  marketplacePublishedAt: s.marketplace_published_at || s.marketplacePublishedAt,
  marketplaceUrl: s.marketplace_url || s.marketplaceUrl || `${marketplaceBaseUrl}/scripts/${s.id}`,
  stripeProductId: s.stripe_product_id || s.stripeProductId,
  stripePriceId: s.stripe_price_id || s.stripePriceId
})

const userHasActiveSellerSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier,status,cancel_at_period_end,created_at")
    .eq("user_id", userId)
    .in("tier", ["aspirant", "professional"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Unable to verify seller subscription:", error)
    return false
  }

  return data?.status === "active" && data?.cancel_at_period_end !== true
}

const getMainMarketplaceScriptCount = async (userId: string, excludeScriptId?: number) => {
  let query = supabase
    .from("scripts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_published", true)
    .eq("marketplace_visibility", "main_marketplace")

  if (excludeScriptId) {
    query = query.neq("id", excludeScriptId)
  }

  const { count, error } = await query

  if (error) {
    console.error("Unable to count main marketplace scripts:", error)
    return null
  }

  return count || 0
}

// AI Chatbot Interfaces
interface ChatMessage {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
  questionId?: string
}

interface Question {
  id: string
  type: 'text' | 'multiple-choice' | 'rating' | 'boolean'
  question: string
  options?: string[]
  required: boolean
  followUpQuestions?: Question[]
  category: 'ceremony-type' | 'logistics' | 'personal' | 'preferences'
  aiRecommendation?: string
}

interface CeremonyProfile {
  ceremonyType: string
  duration: string
  tone: string
  specialRequests: string[]
  couplePreferences: Record<string, any>
}

// Backend Template for Dynamic Questions - Can be modified by admins
//
// ADMIN CONFIGURATION GUIDE:
//
// To add/remove/modify questions:
// 1. Each question object has the following properties:
//    - id: Unique identifier for the question
//    - type: 'text' | 'multiple-choice' | 'rating' | 'boolean'
//    - question: The actual question text
//    - options: Array of choices (only for multiple-choice type)
//    - required: Boolean indicating if question is mandatory
//    - category: Groups related questions ('ceremony-type' | 'logistics' | 'personal' | 'preferences')
//    - aiRecommendation: Additional helpful context the AI provides
//
// 2. To add a new question, simply add a new object to the GUIDED_QUESTIONS array
// 3. To remove a question, delete the object from the array
// 4. Questions are asked in the order they appear in the array
// 5. The AI will generate recommendations based on user responses
//
// Example new question:
// {
//   id: 'music-preference',
//   type: 'multiple-choice',
//   question: "What type of music would you like during the ceremony?",
//   options: ['Classical', 'Modern', 'Religious', 'No Music'],
//   required: false,
//   category: 'preferences',
//   aiRecommendation: "Music can enhance the emotional impact of your ceremony."
// }
//
const GUIDED_QUESTIONS: Question[] = [
  {
    id: 'ceremony-type',
    type: 'multiple-choice',
    question: "What kind of script should I help you create?",
    options: MR_SCRIPT_SERVICE_OPTIONS,
    required: true,
    category: 'ceremony-type',
    aiRecommendation: "Tell me the life moment first, then I will ask only the questions that fit that kind of ceremony."
  },
  {
    id: 'ceremony-duration',
    type: 'multiple-choice',
    question: "How long should the ceremony be?",
    options: MR_SCRIPT_LENGTH_OPTIONS,
    required: true,
    category: 'logistics',
    aiRecommendation: "This helps me decide how many sections to write and how much detail each section should include."
  },
  {
    id: 'ceremony-tone',
    type: 'multiple-choice',
    question: "What tone would you like for the ceremony?",
    options: ['Formal and Traditional', 'Warm and Personal', 'Light and Joyful', 'Intimate and Romantic', 'Fun and Casual'],
    required: true,
    category: 'preferences',
    aiRecommendation: "The tone should reflect the couple's personality. I can help adjust the language and style accordingly."
  },
  {
    id: 'special-elements',
    type: 'multiple-choice',
    question: "Are there any special elements the couple wants to include?",
    options: ['Unity Candle', 'Sand Ceremony', 'Ring Warming', 'Handfasting', 'Cultural Traditions', 'None'],
    required: false,
    category: 'personal',
    aiRecommendation: "Special elements add meaning and personalization. I can provide scripts and guidance for any of these traditions."
  },
  {
    id: 'vows-type',
    type: 'multiple-choice',
    question: "Will the couple be writing their own vows or using traditional vows?",
    options: ['Traditional Vows', 'Personal Written Vows', 'Mix of Both', 'Not Sure Yet'],
    required: true,
    category: 'preferences',
    aiRecommendation: "I can provide traditional vow options or help you guide the couple in writing personal vows that fit the ceremony style."
  }
]

const getActiveGuidedQuestions = (responses: Record<string, string> = {}): Question[] => {
  const service = getMrScriptServiceByResponse(responses['ceremony-type'])

  return [
    GUIDED_QUESTIONS[0],
    GUIDED_QUESTIONS[1],
    {
      id: 'ceremony-tone',
      type: 'multiple-choice',
      question: service.sensitivity === "grief"
        ? "What tone should this remembrance have?"
        : "What tone should this script have?",
      options: service.toneOptions,
      required: true,
      category: 'preferences',
      aiRecommendation: service.sensitivity === "grief"
        ? "I will keep this gentle, grounded, and careful with family feelings."
        : "The tone helps Mr. Script choose words that fit the moment instead of sounding generic."
    },
    {
      id: 'core-details',
      type: 'text',
      question: `What important details should I include for this ${service.shortName.toLowerCase()} script?`,
      required: true,
      category: 'personal',
      aiRecommendation: `Helpful details include: ${service.requiredQuestions.slice(0, 3).join(" ")}`
    },
    {
      id: 'story-notes',
      type: 'text',
      question: `What story details should I weave into this ${service.shortName.toLowerCase()} script?`,
      required: false,
      category: 'personal',
      aiRecommendation: service.storyPrompts.join(" ")
    },
    ...service.intakeQuestionGroups.slice(0, service.sensitivity === "grief" ? 3 : 2).map((group) => ({
      id: `intake-${group.id}`,
      type: 'text' as const,
      question: group.prompt,
      required: false,
      category: 'personal' as const,
      aiRecommendation: group.helpText
    })),
    {
      id: 'special-inclusions',
      type: 'text',
      question: "Are there any readings, traditions, people, stories, prayers, music, or special moments that should be included?",
      required: false,
      category: 'personal',
      aiRecommendation: service.optionalQuestions.slice(0, 2).join(" ")
    },
    {
      id: 'avoidances',
      type: 'text',
      question: service.sensitivity === "grief"
        ? "Is there anything the family wants avoided or handled carefully?"
        : "Is there anything I should avoid or keep out of the script?",
      required: false,
      category: 'preferences',
      aiRecommendation: "This helps Mr. Script keep the wording respectful, accurate, and appropriate."
    }
  ]
}

const getGuidedDetailResponseKey = (questionId: string, detailIndex: number) =>
  `${questionId}-detail-${detailIndex + 1}`

const getGuidedDetailQuestions = (question: Question, responses: Record<string, string>): string[] => {
  if (question.id !== "core-details") return []

  const service = getMrScriptServiceByResponse(responses["ceremony-type"])
  return service.requiredQuestions.slice(0, 4)
}

const getFirstUnansweredGuidedDetailIndex = (question: Question, responses: Record<string, string>) => {
  const detailQuestions = getGuidedDetailQuestions(question, responses)
  return detailQuestions.findIndex((_, index) => {
    const savedAnswer = responses[getGuidedDetailResponseKey(question.id, index)]
    return !savedAnswer || !savedAnswer.trim()
  })
}

const hasUnansweredGuidedDetails = (question: Question, responses: Record<string, string>) => {
  const detailQuestions = getGuidedDetailQuestions(question, responses)
  if (!detailQuestions.length) return false
  return getFirstUnansweredGuidedDetailIndex(question, responses) !== -1
}

const buildGuidedDetailSummary = (question: Question, responses: Record<string, string>) => {
  const detailQuestions = getGuidedDetailQuestions(question, responses)
  const answeredDetails = detailQuestions
    .map((detail, index) => {
      const answer = responses[getGuidedDetailResponseKey(question.id, index)]
      return answer?.trim() ? `${detail} ${answer.trim()}` : ""
    })
    .filter(Boolean)

  return answeredDetails.join("\n")
}

const buildGuidedDetailPrompt = (
  question: Question,
  responses: Record<string, string>,
  prefix = "Great."
) => {
  const detailQuestions = getGuidedDetailQuestions(question, responses)
  const nextDetailIndex = getFirstUnansweredGuidedDetailIndex(question, responses)
  if (!detailQuestions.length || nextDetailIndex === -1) return null

  const nextQuestion = detailQuestions[nextDetailIndex]
  return `${prefix} ${nextQuestion} If this isn't applicable, you can say skip.`
}

const PENDING_LOVED_ONE_HONOR_KEY = "pending-loved-one-honor-follow-up"
const LOVED_ONE_HONOR_STYLE_KEY = "loved-one-honor-style"

const isNegativeResponse = (value: string) =>
  /\b(no|none|not applicable|n\/a|skip|nope)\b/i.test(value.trim())

const alreadyClarifiedLovedOneHonor = (value: string) =>
  /\b(general|generally|all loved ones|all those|everyone|those who passed|loved ones who have passed|do not name|don't name|no names|by name|named|mention .+ by name)\b/i.test(value)

const shouldAskLovedOneHonorFollowUp = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed || isNegativeResponse(trimmed) || alreadyClarifiedLovedOneHonor(trimmed)) return false

  return /\b(yes|honou?r|remember|remembrance|memorial|tribute|loved one|loved ones|passed|passed away|deceased|late|in memory)\b/i.test(trimmed)
}

const isClarificationRequest = (value: string) =>
  /\b(what|what's|whats|explain|example|examples|mean|means|would be|could be|help me understand|not sure|i don't understand|i dont understand)\b/i.test(value.trim())

const buildClarificationAnswer = (value: string) => {
  const lowerValue = value.toLowerCase()
  const answers: string[] = []

  if (/\breadings?\b/.test(lowerValue)) {
    answers.push("A reading is a short passage read during the ceremony. It could be a poem, scripture, a quote, a favorite book excerpt, or a few meaningful lines about love and commitment.")
  }

  if (/\bprayers?\b|\bblessing\b/.test(lowerValue)) {
    answers.push("A prayer or blessing can be faith-based, spiritual, or very simple. For example, it might ask for peace, guidance, joy, protection, or strength for the couple and their family.")
  }

  if (/\bremembrance\b|\bremember\b|\bloved one\b|\bloved ones\b|\bpassed\b|\bdeceased\b|\bmemorial\b/.test(lowerValue)) {
    answers.push("A remembrance is a brief moment to honor loved ones who have passed. It can mention someone by name, or it can stay general, such as honoring all loved ones who are present in spirit.")
  }

  if (/\bcultural\b|\btraditions?\b|\btradition\b/.test(lowerValue)) {
    answers.push("A cultural tradition is a meaningful ritual, custom, symbol, reading, music choice, family blessing, clothing item, language, or ceremony element connected to the couple's heritage, family, or community.")
  }

  if (/\bfamily involvement\b|\bfamily\b|\bparents?\b|\bchildren\b|\bchild\b|\bguest\b/.test(lowerValue)) {
    answers.push("Family involvement means inviting important people to participate. They might read a passage, give a blessing, light a candle, present rings, walk someone in, share a short tribute, or take part in a unity moment.")
  }

  if (/\bunity\b|\bcandle\b|\bsand\b|\bhandfasting\b|\britual\b/.test(lowerValue)) {
    answers.push("A unity ceremony is a symbolic action showing two lives or families coming together. Common examples include a unity candle, sand ceremony, handfasting, wine blending, tree planting, or family blessing.")
  }

  if (/\bvows?\b|\bpromise\b|\bpromises\b/.test(lowerValue)) {
    answers.push("Vows are the promises spoken by the couple. They can be traditional, personal, short and simple, spiritual, funny, emotional, or a mix of styles.")
  }

  if (/\bpoem\b|\bpoems\b|\bpoetry\b|\bbible\b|\bverse\b|\bverses\b|\bsong\b|\blyrics\b/.test(lowerValue)) {
    const recommendations = getReadingRecommendations({
      ceremonyType: lowerValue.includes("memorial") || lowerValue.includes("passed") ? "celebration_of_life" : "wedding",
      specialInclusions: lowerValue,
      faithPreference: lowerValue,
      limit: 3,
    })
    answers.push([
      "Mr. Script can suggest public-domain poems, KJV Bible verses, original OrdainedPro readings, and safe placeholders for song lyrics.",
      "For modern song lyrics or copyrighted poems, the safest workflow is to have the officiant or couple paste text they have permission to use. Mr. Script can then place it into the ceremony and write original transitions around it.",
      `Good safe options include:\n${formatReadingsForPrompt(recommendations)}`
    ].join("\n\n"))
  }

  return answers.length
    ? answers.join("\n\n")
    : "That means any meaningful ceremony element the couple may want included, such as a reading, prayer, remembrance, cultural tradition, family participation, music cue, unity ceremony, or special story."
}

const getSpecialInclusionsPrompt = () =>
  "Would you like readings, prayers, remembrance, cultural traditions, family involvement, music, stories, or any special ceremony moments included? You can name any that apply, say none, or ask me what any of those mean."

const getToneQuickChoices = (service: ReturnType<typeof getMrScriptServiceByResponse>) =>
  service.sensitivity === "grief"
    ? ["Gentle", "Compassionate", "Reflective", "Hopeful", "Spiritual", "Respectful", "Warm", "Solemn"]
    : ["Romantic", "Lighthearted", "Fun", "Energetic", "Warm", "Formal", "Modern", "Spiritual", "Religious", "Very religious"]

// AI Assistant Functions
const generateAIResponse = (question: Question, previousResponses: Record<string, string>): string => {
  if (question.id === "ceremony-type") {
    return [
      "Absolutely. I can help shape this into something meaningful and organized.",
      question.question,
      "You can choose one of the common ceremony families below, or tell me in your own words if this is something more custom."
    ].join('\n\n')
  }

  if (question.id === "ceremony-duration") {
    const service = getMrScriptServiceByResponse(previousResponses["ceremony-type"])
    return [
      `Good. I'll treat this as a ${service.shortName.toLowerCase()} script.`,
      question.question,
      question.aiRecommendation || ""
    ].filter(Boolean).join('\n\n')
  }

  if (question.id === "core-details") {
    const service = getMrScriptServiceByResponse(previousResponses["ceremony-type"])
    const nextDetailPrompt = buildGuidedDetailPrompt(
      question,
      previousResponses,
      "Let's take these one at a time."
    )
    return [
      `Now I want to understand the heart of this ${service.shortName.toLowerCase()} script.`,
      question.question,
      nextDetailPrompt || service.requiredQuestions.slice(0, 4).map((detail) => `- ${detail}`).join("\n")
    ].filter(Boolean).join('\n\n')
  }

  if (question.id === "story-notes") {
    const service = getMrScriptServiceByResponse(previousResponses["ceremony-type"])
    return [
      question.question,
      "High-level notes are enough. Couples can answer one, several, or all of these:",
      service.storyPrompts.map((detail) => `- ${detail}`).join("\n")
    ].filter(Boolean).join('\n\n')
  }

  if (question.id.startsWith("intake-")) {
    return [
      question.question,
      question.aiRecommendation || "Short notes are fine. Mr. Script will turn them into natural spoken language."
    ].filter(Boolean).join('\n\n')
  }

  if (question.id === "special-inclusions" || question.id === "avoidances") {
    return [
      question.question,
      question.id === "special-inclusions"
        ? getSpecialInclusionsPrompt()
        : question.aiRecommendation || ""
    ].filter(Boolean).join('\n\n')
  }

  const responses = [
    `Great! Let me ask you about ${question.category === 'ceremony-type' ? 'the type of ceremony' :
      question.category === 'logistics' ? 'the practical details' :
      question.category === 'personal' ? 'personal touches' : 'your preferences'}.`,

    `${question.question}`,

    question.aiRecommendation ? `Tip: ${question.aiRecommendation}` : ''
  ].filter(Boolean)

  return responses.join('\n\n')
}

const generateRecommendation = (responses: Record<string, string>): string => {
  const ceremonyType = responses['ceremony-type']
  const duration = responses['ceremony-duration']
  const tone = responses['ceremony-tone']
  const service = getMrScriptServiceByResponse(ceremonyType)

  let recommendation = "Based on your answers, here's how I would shape this script:\n\n"

  if (ceremonyType) {
    recommendation += `**Ceremony Family**: ${service.displayName}\n`
    recommendation += `${service.description}\n\n`
    recommendation += `**Suggested Structure**: ${service.scriptSections.join(", ")}.\n\n`
  }

  if (false && ceremonyType) {
    recommendation += `[SCRIPT]Â **Ceremony Style**: Since you've chosen a ${ceremonyType.toLowerCase()} ceremony, `
    if (ceremonyType === 'Traditional') {
      recommendation += "I'll include classic elements like traditional vows, ring exchange, and formal language.\n\n"
    } else if (ceremonyType === 'Modern') {
      recommendation += "I'll create a contemporary script with flexible elements and personalized touches.\n\n"
    } else if (ceremonyType === 'Religious') {
      recommendation += "I'll incorporate appropriate religious elements and blessings.\n\n"
    }
  }

  if (duration) {
    recommendation += `**Timing**: For a ${duration.toLowerCase()} ceremony, I'll structure the script with appropriate pacing and content.\n\n`
  }

  if (tone) {
    recommendation += `[STYLE] **Tone**: The ${tone.toLowerCase()} approach will be reflected in the language and style throughout.\n\n`
  }

  if (service.sensitivity === "grief") {
    recommendation += "Because this is grief-related, I will keep the language gentle, compassionate, and never assume religious beliefs.\n\n"
  }

  if (responses["profile-context-summary"]) {
    recommendation += `**Details already pulled from this profile**:\n${responses["profile-context-summary"]}\n\n`
  }

  recommendation += "I have enough to create the first draft, and I can still adjust it based on any additional preferences you provide."

  return recommendation
}

const getFaithStyleDraftGuidance = (officiantStyle: string) => {
  const normalizedStyle = officiantStyle.toLowerCase()

  if (normalizedStyle.includes("very religious")) {
    return "Faith Style Guidance: Very religious. Use clearly faith-forward language throughout, including prayerful cadence, blessings, sacred commitment language, and reverent references to God or faith where appropriate. Keep denomination-specific details bracketed unless provided."
  }

  if (normalizedStyle.includes("religious") && !normalizedStyle.includes("not overly religious")) {
    return "Faith Style Guidance: Religious. Include meaningful faith language, blessings, and sacred commitment wording while keeping the ceremony accessible unless a specific tradition is provided."
  }

  if (normalizedStyle.includes("spiritual but not overly religious")) {
    return "Faith Style Guidance: Spiritual but not overly religious. Use gentle spiritual language, gratitude, blessing, and meaning-focused wording without making the ceremony strongly faith-forward."
  }

  return ""
}

// Generate a complete ceremony script based on user responses
const generateCompleteScript = (responses: Record<string, string>, coupleInfo: any, weddingDetails: any): string => {
  const ceremonyType = responses['ceremony-type'] || 'Traditional'
  const service = getMrScriptServiceByResponse(ceremonyType)
  const duration = responses['ceremony-duration'] || '20-30 minutes'
  const tone = responses['ceremony-tone'] || 'Warm and Personal'
  const unityCeremony = responses['special-elements'] || 'None'
  const vowsType = responses['vows-type'] || 'Traditional Vows'
  const coreDetails = responses['core-details'] || ''
  const storyNotes = responses['story-notes'] || ''
  const specialInclusions = responses['special-inclusions'] || ''
  const lovedOneHonorStyle = responses[LOVED_ONE_HONOR_STYLE_KEY] || ''
  const avoidances = responses['avoidances'] || ''
  const officiantStyle = responses['officiant-style'] || 'Warm, natural, and professional'
  const faithStyleGuidance = getFaithStyleDraftGuidance(officiantStyle)

  const brideName = coupleInfo.brideName || 'Partner 1'
  const groomName = coupleInfo.groomName || 'Partner 2'
  const venue = weddingDetails.venueName || '[venue to be confirmed]'
  const date = weddingDetails.weddingDate
    ? new Date(weddingDetails.weddingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '[date to be confirmed]'

  if (service.id !== "wedding") {
    const subjectName =
      service.id === "vow_renewal"
        ? `${brideName} & ${groomName}`
        : responses["honoree-name"] || responses["loved-one-name"] || responses["child-name"] || `${brideName} & ${groomName}`

    const sensitivityNote =
      service.sensitivity === "grief"
        ? "This script should remain gentle, compassionate, and never assume religious beliefs unless the family asks for that language."
        : "This script should feel warm, grounded, and personal to the people involved."

    return `${service.displayName.toUpperCase()} SCRIPT
Generated by Mr. Script for ${subjectName}
${venue} - ${date}

SCRIPT DIRECTION
Tone: ${tone}
Target Duration: ${duration}
Ceremony Family: ${service.category}
Officiant Style: ${officiantStyle}
${faithStyleGuidance}
Core Details: ${coreDetails || "Add the names, setting, relationships, stories, and purpose of this script."}
Story Notes: ${storyNotes || "No story details were provided yet. Keep the draft high-level and leave room for personal details."}
Special Inclusions: ${specialInclusions || "No specific readings, traditions, music, prayers, or people were listed yet."}
Loved One Remembrance: ${lovedOneHonorStyle || "No remembrance preference was listed yet."}
Avoidances: ${avoidances || "No avoidances were listed yet."}

${sensitivityNote}

${service.scriptSections
  .map((section, index) => {
    const prompt =
      service.sensitivity === "grief"
        ? "Use quiet, careful language here. Leave room for family names, memories, readings, music, prayers, or reflection."
        : "Write this section with natural spoken language, clear stage direction, and room for personal details."

    return `${index + 1}. ${section.toUpperCase()}
[Mr. Script draft section]
${prompt}
Use these known details when relevant: ${coreDetails || "details still need to be confirmed."}
Story material to weave in naturally: ${storyNotes || "none provided yet."}

`
  })
  .join("")}
DETAILS TO COLLECT OR CONFIRM
${service.requiredQuestions.map((question) => `- ${question}`).join("\n")}

OPTIONAL PERSONAL TOUCHES
${service.optionalQuestions.map((question) => `- ${question}`).join("\n")}

---
CEREMONY NOTES:
- Duration: ${duration}
- Tone: ${tone}
- Output Type: ${service.outputTypes[0] || "ceremony_script"}

This is a starter draft created by Mr. Script. Add the personal stories, names, traditions, and details that make this ceremony feel real.`
  }

  let script = `${ceremonyType.toUpperCase()} WEDDING CEREMONY SCRIPT
Generated by Mr. Script for ${brideName} & ${groomName}
${venue} - ${date}
Officiant Style: ${officiantStyle}
${faithStyleGuidance}
Story Notes: ${storyNotes || "No couple story notes provided yet."}
Special Inclusions: ${specialInclusions || "No special inclusions provided yet."}
Loved One Remembrance: ${lovedOneHonorStyle || "No remembrance preference provided yet."}

PROCESSIONAL
[Music begins as wedding party enters]

OPENING WORDS
"Family and friends, we are gathered here today at ${venue} to celebrate the union of ${brideName} and ${groomName} in marriage. On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

${brideName} and ${groomName}, you have chosen to share your lives together, and we are honored to be part of this special moment."

${storyNotes ? `COUPLE STORY
[Use this story material naturally in the ceremony. Keep it spoken, warm, and concise.]
${storyNotes}
` : ''}

${lovedOneHonorStyle ? `LOVED ONE REMEMBRANCE
[Include a brief, sensitive remembrance. Use this direction: ${lovedOneHonorStyle}. If specific names are not confirmed, keep the language general so no family member or loved one is unintentionally excluded.]
` : ''}

DECLARATION OF INTENT
"${brideName}, do you take ${groomName} to be your lawfully wedded husband, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"
[${brideName} responds: "I do"]

"${groomName}, do you take ${brideName} to be your lawfully wedded wife, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"
[${groomName} responds: "I do"]

EXCHANGE OF VOWS`

  // Add vow section based on selection
  if (vowsType === 'Personal Written Vows') {
    script += `
[${brideName} and ${groomName} will now share their personal vows]

${brideName}: [Personal vows to be written by bride]

${groomName}: [Personal vows to be written by groom]`
  } else if (vowsType === 'Traditional Vows') {
    script += `
${brideName}: "I, ${brideName}, take you, ${groomName}, to be my husband. I promise to love you, honor you, and cherish you, in sickness and in health, for richer or poorer, for better or worse, for as long as we both shall live."

${groomName}: "I, ${groomName}, take you, ${brideName}, to be my wife. I promise to love you, honor you, and cherish you, in sickness and in health, for richer or poorer, for better or worse, for as long as we both shall live."`
  } else {
    script += `
[${vowsType} to be exchanged between ${brideName} and ${groomName}]`
  }

  // Add unity ceremony if selected
  if (unityCeremony && unityCeremony !== 'None') {
    script += `

${unityCeremony.toUpperCase()} CEREMONY
`
    if (unityCeremony === 'Unity Candle') {
      script += `[${brideName} and ${groomName} will now light the unity candle together]
"The unity candle represents the joining of your two lives into one. As you light this candle together, may it serve as a reminder that your love will forever burn bright."`
    } else if (unityCeremony === 'Sand Ceremony') {
      script += `[${brideName} and ${groomName} will now perform the sand ceremony]
"As you pour your individual sands together, you are creating something new and beautiful. Just as these grains of sand can never be separated, so too are your lives now joined as one."`
    } else if (unityCeremony === 'Handfasting') {
      script += `[${brideName} and ${groomName} will now participate in the handfasting ceremony]
"As we bind your hands together, we symbolize your commitment to each other. This is where the phrase 'tying the knot' comes from, representing the unbreakable bond you share."`
    } else {
      script += `[${brideName} and ${groomName} will now participate in the ${unityCeremony}]
"This ${unityCeremony} represents the joining of your lives and the commitment you make to each other."`
    }
  }

  script += `

RING CEREMONY
"These rings serve as a symbol of your unending love and commitment. As you place them on each other's hands, remember that love is not just a feeling, but a choice you make every day."

[Exchange of rings]

${brideName}: "${groomName}, I give you this ring as a symbol of my love and commitment to you."
${groomName}: "${brideName}, I give you this ring as a symbol of my love and commitment to you."

PRONOUNCEMENT
"By the power vested in me, and in the presence of these witnesses, I now pronounce you husband and wife. You may kiss!"

[First kiss as married couple]

RECESSIONAL
[Couple exits as music plays]

---
CEREMONY NOTES:
- Duration: ${duration}
- Style: ${ceremonyType}
- Tone: ${tone}
${unityCeremony !== 'None' ? `- Unity Ceremony: ${unityCeremony}` : ''}
- Vow Style: ${vowsType}

This script has been customized for your ceremony by Mr. Script. Feel free to modify any sections to better reflect your style and preferences.`

  return script
}

// Props interface
interface CommunicationPortalProps {
  onScriptUploaded?: (content: string, fileName: string) => void;
}

type StripeConnectAccount = {
  stripe_account_id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  onboarding_complete: boolean
}

export function CommunicationPortal({ onScriptUploaded }: CommunicationPortalProps = {}) {
  // Auth and profile state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [officiantProfile, setOfficiantProfile] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [stripeConnectAccount, setStripeConnectAccount] = useState<StripeConnectAccount | null>(null)
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false)
  const [stripeConnectMessage, setStripeConnectMessage] = useState("")

  const getCleanDisplayName = (...candidates: Array<string | null | undefined>) => {
    const name = candidates
      .map((candidate) => candidate?.trim())
      .find((candidate) => candidate && !candidate.includes("@"))

    return name || "Officiant"
  }

  const officiantName = getCleanDisplayName(
    officiantProfile?.full_name,
    officiantProfile?.name,
    currentUser?.user_metadata?.full_name,
    currentUser?.user_metadata?.name
  )
  const officiantFirstName =
    officiantName === "Officiant" ? "Officiant" : officiantName.split(/\s+/)[0]
  const officiantLabel =
    officiantName === "Officiant" ? "Officiant" : `Officiant ${officiantFirstName}`
  const officiantEmail = officiantProfile?.email || currentUser?.email || ""
  const officiantPhone = officiantProfile?.phone || ""
  const [contractPrefillDefaults, setContractPrefillDefaults] = useState(DEFAULT_CONTRACT_PREFILL_DEFAULTS)
  const [hasAcceptedDefaultContractLegal, setHasAcceptedDefaultContractLegal] = useState(false)

  const getStripeConnectAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || ""
  }

  const refreshStripeConnectStatus = useCallback(async () => {
    if (!currentUser?.id) return

    try {
      setStripeConnectLoading(true)
      setStripeConnectMessage("")
      const token = await getStripeConnectAccessToken()

      if (!token) {
        setStripeConnectMessage("Please sign in again before setting up payouts.")
        return
      }

      const response = await fetch("/api/stripe/connect/account", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Unable to load Stripe payout status.")
      }

      setStripeConnectAccount((data.account as StripeConnectAccount | null) || null)
    } catch (error: any) {
      console.error("Unable to refresh Stripe Connect status:", error)
      setStripeConnectMessage(error?.message || "Unable to load Stripe payout status.")
    } finally {
      setStripeConnectLoading(false)
    }
  }, [currentUser?.id])

  const handleStartStripeConnectOnboarding = async () => {
    if (!currentUser?.id) return

    try {
      setStripeConnectLoading(true)
      setStripeConnectMessage("")
      const token = await getStripeConnectAccessToken()

      if (!token) {
        setStripeConnectMessage("Please sign in again before setting up payouts.")
        return
      }

      const response = await fetch("/api/stripe/connect/account", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start Stripe payout setup.")
      }

      window.location.href = data.url
    } catch (error: any) {
      console.error("Unable to start Stripe Connect onboarding:", error)
      setStripeConnectMessage(error?.message || "Unable to start Stripe payout setup.")
    } finally {
      setStripeConnectLoading(false)
    }
  }

  const handleOpenStripeExpressDashboard = async () => {
    if (!currentUser?.id) return

    try {
      setStripeConnectLoading(true)
      setStripeConnectMessage("")
      const token = await getStripeConnectAccessToken()

      if (!token) {
        setStripeConnectMessage("Please sign in again before opening Stripe.")
        return
      }

      const response = await fetch("/api/stripe/connect/dashboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to open Stripe Express dashboard.")
      }

      window.location.href = data.url
    } catch (error: any) {
      console.error("Unable to open Stripe Express dashboard:", error)
      setStripeConnectMessage(error?.message || "Unable to open Stripe Express dashboard.")
    } finally {
      setStripeConnectLoading(false)
    }
  }

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [newMessage, setNewMessage] = useState("")
  const [newTask, setNewTask] = useState("")
  const [showAddCeremonyDialog, setShowAddCeremonyDialog] = useState(false)
  const [showEditCoupleDialog, setShowEditCoupleDialog] = useState(false)
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false)
  const [showScheduleMeetingDialog, setShowScheduleMeetingDialog] = useState(false)
  const [showContractUploadDialog, setShowContractUploadDialog] = useState(false)
  const [showEditWeddingDialog, setShowEditWeddingDialog] = useState(false)
  const [showAddEventDialog, setShowAddEventDialog] = useState(false)
  const [showEditMeetingDialog, setShowEditMeetingDialog] = useState(false)
  const [showFileViewerDialog, setShowFileViewerDialog] = useState(false)
  const [showContractViewerDialog, setShowContractViewerDialog] = useState(false)
  const [showSendContractDialog, setShowSendContractDialog] = useState(false)
  const [showSendPaymentReminderDialog, setShowSendPaymentReminderDialog] = useState(false)
  const [showGenerateInvoiceDialog, setShowGenerateInvoiceDialog] = useState(false)
  const [sendingContract, setSendingContract] = useState<any>(null)
  const [isSendingContractEmail, setIsSendingContractEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({
    to: '',
    customEmail: '',
    subject: '',
    body: ''
  })

  useEffect(() => {
    if (!currentUser?.id) return

    const storageKey = `ordainedpro_contract_defaults_${currentUser.id}`
    const savedDefaults = localStorage.getItem(storageKey)
    const profileDefaults = {
      includedMiles: officiantProfile?.travel_radius_miles ? String(officiantProfile.travel_radius_miles) : "",
      officiantAddress: [officiantProfile?.city, officiantProfile?.state].filter(Boolean).join(", "),
    }

    if (savedDefaults) {
      try {
        setContractPrefillDefaults({
          ...DEFAULT_CONTRACT_PREFILL_DEFAULTS,
          ...profileDefaults,
          ...JSON.parse(savedDefaults),
        })
      } catch {
        setContractPrefillDefaults({
          ...DEFAULT_CONTRACT_PREFILL_DEFAULTS,
          ...profileDefaults,
        })
      }
    } else {
      setContractPrefillDefaults({
        ...DEFAULT_CONTRACT_PREFILL_DEFAULTS,
        ...profileDefaults,
      })
    }
  }, [currentUser?.id, officiantProfile?.city, officiantProfile?.state, officiantProfile?.travel_radius_miles])

  useEffect(() => {
    if (!currentUser?.id) return
    localStorage.setItem(`ordainedpro_contract_defaults_${currentUser.id}`, JSON.stringify(contractPrefillDefaults))
  }, [contractPrefillDefaults, currentUser?.id])

  useEffect(() => {
    const loadDefaultContractAcceptance = async () => {
      if (!currentUser?.id) {
        setHasAcceptedDefaultContractLegal(false)
        return
      }

      const { data, error } = await supabase
        .from("legal_acceptances")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("document_slug", DEFAULT_CONTRACT_ACKNOWLEDGMENT_SLUG)
        .eq("document_version", DEFAULT_CONTRACT_TEMPLATE_VERSION)
        .limit(1)

      if (error) {
        console.warn("Default contract legal acknowledgment tracking is not ready yet:", error.message)
        return
      }

      setHasAcceptedDefaultContractLegal(Boolean(data?.length))
    }

    loadDefaultContractAcceptance()
  }, [currentUser?.id])

  const acceptDefaultContractLegalAcknowledgment = useCallback(async () => {
    if (!currentUser?.id) {
      return { ok: false, error: "Please sign in before using the default contract." }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      return { ok: false, error: "Your session expired. Please sign in again before using the default contract." }
    }

    const response = await fetch("/api/legal/contract-template-acknowledgment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      const message = error?.error || "Unable to save the legal acknowledgment."
      console.error("Failed to save default contract legal acknowledgment:", message)
      return { ok: false, error: message }
    }

    setHasAcceptedDefaultContractLegal(true)
    return { ok: true }
  }, [currentUser?.id])

  const acceptUploadedContractLegalAcknowledgment = useCallback(async (details: { contractName: string; fileName: string }) => {
    if (!currentUser?.id) {
      return { ok: false, error: "Please sign in before uploading a contract." }
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      return { ok: false, error: "Your session expired. Please sign in again before uploading a contract." }
    }

    const response = await fetch("/api/legal/contract-template-acknowledgment", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "uploaded_contract",
        contractName: details.contractName,
        fileName: details.fileName,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      const message = error?.error || "Unable to save the uploaded contract legal acknowledgment."
      console.error("Failed to save uploaded contract legal acknowledgment:", message)
      return { ok: false, error: message }
    }

    return { ok: true }
  }, [currentUser?.id])

  const [paymentReminderForm, setPaymentReminderForm] = useState({
    to: '',
    customEmail: '',
    subject: '',
    body: ''
  })
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    weddingDate: '',
    coupleName: '',
    venue: '',
    items: [
      {
        id: 1,
        service: 'Ceremony Officiant',
        description: 'Professional ceremony officiation services including pre-ceremony consultation, personalized script, and ceremony performance',
        category: 'Ceremony Services',
        quantity: 1,
        rate: 800,
        amount: 800
      }
    ],
    subtotal: 800,
    taxRate: 0,
    taxAmount: 0,
    depositPaid: 300,
    balanceDue: 500,
    total: 800,
    notes: 'Payment due within 30 days. Thank you for choosing our services for your special day!',
    paymentMethods: 'Check, Cash, Venmo, PayPal, Zelle',
    terms: 'Payment due within 30 days of invoice date. Final payment must be received at least 7 days before the ceremony. Late payments may incur additional fees.',
    bankDetails: 'Bank transfers available upon request',
    emailRecipients: 'both'
  })
  const [savedInvoiceServices, setSavedInvoiceServices] = useState<any[]>([])
  const [isSendingInvoice, setIsSendingInvoice] = useState(false)
  const [viewingContract, setViewingContract] = useState<any>(null)
  const [viewingFile, setViewingFile] = useState<any>(null)
  const [editMeetingForm, setEditMeetingForm] = useState({
    id: 0,
    subject: '',
    date: '',
    time: '',
    duration: 60,
    meetingType: 'in-person',
    location: '',
    body: '',
    responseDeadline: ''
  })
  const [addEventForm, setAddEventForm] = useState({
    subject: '',
    date: '',
    time: '',
    category: 'rehearsal',
    details: ''
  })
  const [isCeremonyActive, setIsCeremonyActive] = useState(true)
  const [taskFilter, setTaskFilter] = useState("all") // all, pending, completed, high-priority
  const [messageAttachments, setMessageAttachments] = useState<UploadedFile[]>([])
  const [ceremonyFiles, setCeremonyFiles] = useState<UploadedFile[]>([])
  const [showAttachments, setShowAttachments] = useState(false)

  // Persistent storage for saved ceremonies
  const [savedCeremonies, setSavedCeremonies] = useState<any[]>([])

  // State for managing multiple couples/weddings
  // Couples are now loaded from the database
  const [allCouples, setAllCouples] = useState<any[]>([])
  const [isLoadingCouples, setIsLoadingCouples] = useState(true)

  const [activeCoupleIndex, setActiveCoupleIndex] = useState(0)
  const [showSwitchCeremonyDialog, setShowSwitchCeremonyDialog] = useState(false)
  const [showArchivedCeremoniesDialog, setShowArchivedCeremoniesDialog] = useState(false)
  const [showDashboardDialog, setShowDashboardDialog] = useState(false)
  const [dashboardInitialView, setDashboardInitialView] = useState<"dashboard" | "ceremonies" | "profile" | "calendar" | "documents" | "vendors" | "settings">("dashboard")
  const [showRefundsDialog, setShowRefundsDialog] = useState(false)

  // Form states for Add New Ceremony
  const [newCeremony, setNewCeremony] = useState({
    ceremonyType: "wedding",
    ceremonyName: "",
    ceremonyDate: "",
    ceremonyTime: "",
    venueName: "",
    venueAddress: "",
    expectedGuests: "",
    brideName: "",
    brideEmail: "",
    bridePhone: "",
    brideAddress: "",
    primaryAge: "",
    groomName: "",
    groomEmail: "",
    groomPhone: "",
    groomAddress: "",
    secondaryAge: "",
    totalAmount: "",
    depositAmount: "",
    finalPaymentDate: "",
    notes: ""
  })

  // Form states for Edit Couple Info - loaded from active couple (set when couples load)
  const [editCoupleInfo, setEditCoupleInfo] = useState<any>(null)

  // Persistent storage for wedding details per couple
  const [savedWeddingDetails, setSavedWeddingDetails] = useState<Record<string, any>>({})

  // Get current couple identifier
  // Get current couple identifier (with null safety)
  const currentCoupleId = editCoupleInfo?.brideName
    ? `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
    : ""
  const currentCeremonyType = editCoupleInfo?.ceremonyType || getCeremonyTypeFromNotes(editCoupleInfo?.specialRequests)
  const currentCeremonyConfig = getCeremonyTypeConfig(currentCeremonyType)
  const isCurrentCeremonyWedding = currentCeremonyType === "wedding"
  const premiumScriptStorageKey = editCoupleInfo?.id
    ? `ordainedpro-premium-script-uses-${editCoupleInfo.id}`
    : ""

  // Form states for Edit Wedding Details - set when couples load from database
  const [editWeddingDetails, setEditWeddingDetails] = useState({
    venueName: "",
    venueAddress: "",
    weddingDate: "",
    startTime: "",
    endTime: "",
    expectedGuests: "",
    officiantNotes: ""
  })

  // AI Script Builder states
  const [aiChatMessages, setAiChatMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm Mr. Script. What kind of script should I help you create today?",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString()
    }
  ])
  const [aiInput, setAiInput] = useState("")
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [generatedScripts, setGeneratedScripts] = useState<any[]>([])
  const [scriptBuilderTab, setScriptBuilderTab] = useState("mr-script")
  const [scriptMode, setScriptMode] = useState<"guided" | "expert" | null>(null)

  // AI Chatbot states for Guided Mode
  const [showGuidedChatbot, setShowGuidedChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userResponses, setUserResponses] = useState<Record<string, string>>({})
  const [isTyping, setIsTyping] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [ceremonyProfile, setCeremonyProfile] = useState<CeremonyProfile>({
    ceremonyType: '',
    duration: '',
    tone: '',
    specialRequests: [],
    couplePreferences: {}
  })

  // Guided Mode ceremony configuration
  const [selectedCeremonyStyle, setSelectedCeremonyStyle] = useState("")
  const [selectedCeremonyLength, setSelectedCeremonyLength] = useState("")
  const [selectedUnityCeremony, setSelectedUnityCeremony] = useState("")
  const [selectedVowsType, setSelectedVowsType] = useState("")
  const [selectedOfficiantStyle, setSelectedOfficiantStyle] = useState("Warm, natural, and professional")
  const [storyNotes, setStoryNotes] = useState("")

  // Generated script tracking
  const [hasGeneratedScript, setHasGeneratedScript] = useState(false)
  const [generatedScriptContent, setGeneratedScriptContent] = useState("")
  const [premiumScriptUses, setPremiumScriptUses] = useState(0)
  const premiumScriptUsesRemaining = Math.max(0, PREMIUM_SCRIPT_LIMIT - premiumScriptUses)
  const [scriptVersionHistory, setScriptVersionHistory] = useState<Array<{
    id: string
    title: string
    savedAt: string
    wordCount: number
  }>>([])

  // Chat scroll ref
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages, isTyping])

  useEffect(() => {
    const savedStyle = window.localStorage.getItem("mr-script-officiant-style")
    if (savedStyle) {
      setSelectedOfficiantStyle(savedStyle)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("mr-script-officiant-style", selectedOfficiantStyle)
  }, [selectedOfficiantStyle])

  // Log saved ceremonies for debugging
  useEffect(() => {
    if (savedCeremonies.length > 0) {
      console.log("[SCRIPT]â€¹ Saved Ceremonies:", savedCeremonies)
    }
  }, [savedCeremonies])

  // Load current user and officiant profile
  useEffect(() => {
    const loadUserAndProfile = async () => {
      try {
        // Get current user session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.log("No user session found")
          return
        }
        console.log("Ã¢Å“â€¦ Loaded user:", user.id)
        setCurrentUser(user)

        // Load officiant profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profile) {
          console.log("Ã¢Å“â€¦ Loaded profile:", profile.business_name)
          setOfficiantProfile(profile)
        }
      } catch (err) {
        console.error("Error loading user/profile:", err)
      }
    }

    loadUserAndProfile()
  }, [])

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const updatedProfile = (event as CustomEvent).detail
      if (updatedProfile?.user_id) {
        setOfficiantProfile(updatedProfile)
      }
    }

    window.addEventListener("ordainedpro:profile-updated", handleProfileUpdated)
    return () => window.removeEventListener("ordainedpro:profile-updated", handleProfileUpdated)
  }, [])

  useEffect(() => {
    refreshStripeConnectStatus()
  }, [refreshStripeConnectStatus])

  useEffect(() => {
    if (!premiumScriptStorageKey || typeof window === "undefined") {
      setPremiumScriptUses(0)
      return
    }

    const storedUses = Number(window.localStorage.getItem(premiumScriptStorageKey) || "0")
    setPremiumScriptUses(Number.isFinite(storedUses) ? Math.min(PREMIUM_SCRIPT_LIMIT, Math.max(0, storedUses)) : 0)
  }, [premiumScriptStorageKey])

  // Load couples from database
  useEffect(() => {
    const loadCouples = async () => {
      if (!currentUser?.id) return

      setIsLoadingCouples(true)
      console.log("[USERS] Loading couples for user:", currentUser.id)

      const result = await loadCouplesFromDB(currentUser.id)

      if (result.ok && result.data && result.data.length > 0) {
        // Transform database format to component format
        const transformedCouples = result.data.map((c: any, index: number) => {
          const ceremonyType = getCeremonyTypeFromNotes(c.notes || c.special_requests)
          const ceremonyConfig = getCeremonyTypeConfig(ceremonyType)

          return {
            id: c.id, // This is the REAL database ID
            ceremonyType,
            ceremonyTypeLabel: ceremonyConfig.label,
            primaryAge: getCeremonyAgeFromNotes(c.notes || c.special_requests, ceremonyConfig.primaryRole),
            secondaryAge: getCeremonyAgeFromNotes(c.notes || c.special_requests, ceremonyConfig.secondaryRole),
            brideName: c.bride_name || "",
            brideEmail: c.bride_email || "",
            bridePhone: c.bride_phone || "",
            brideAddress: c.bride_address || "",
            groomName: c.groom_name || "",
            groomEmail: c.groom_email || "",
            groomPhone: c.groom_phone || "",
            groomAddress: c.groom_address || "",
            address: c.venue_address || c.address || "",
            emergencyContact: c.emergency_contact || "",
            specialRequests: c.special_requests || c.notes || "",
            isActive: c.is_active !== false,
            colors: getCoupleColors(index + 1),
            weddingDetails: {
              venueName: c.venue_name || "",
              venueAddress: c.venue_address || "",
              weddingDate: c.wedding_date || "",
              startTime: c.start_time || "",
              endTime: c.end_time || "",
              expectedGuests: c.expected_guests?.toString() || "",
              officiantNotes: c.notes || ""
            }
          }
        })

        const selectedCouple = transformedCouples.find((couple: any) => couple.isActive) || transformedCouples[0]
        const selectedCoupleIndex = transformedCouples.findIndex((couple: any) => couple.id === selectedCouple.id)

        setAllCouples(transformedCouples)
        setEditCoupleInfo(selectedCouple)
        setEditWeddingDetails(selectedCouple.weddingDetails || {
          venueName: "",
          venueAddress: "",
          weddingDate: "",
          startTime: "",
          endTime: "",
          expectedGuests: "",
          officiantNotes: ""
        })
        setActiveCoupleIndex(selectedCoupleIndex >= 0 ? selectedCoupleIndex : 0)
        console.log("Ã¢Å“â€¦ Loaded", transformedCouples.length, "couples from database")
      } else {
        console.log("[SCRIPT]Â­ No couples found in database")
        setAllCouples([])
      }

      setIsLoadingCouples(false)
    }

    loadCouples()
  }, [currentUser?.id])

  // Load messages from Supabase for the current couple
  const loadMessages = useCallback(async () => {
    if (!currentUser || !editCoupleInfo?.id) return

    try {
      console.log("[SCRIPT]Â¨ Loading messages for couple:", editCoupleInfo.id)

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("couple_id", editCoupleInfo.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Ã¢ÂÅ’ Error loading messages:", error)
        return
      }

      if (messagesData && messagesData.length > 0) {
        console.log("Ã¢Å“â€¦ Loaded", messagesData.length, "messages")

        // Transform to display format
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender_name || (msg.sender === "officiant" ? "Officiant" : "Couple"),
          role: msg.sender,
          message: msg.content,
          timestamp: formatMessageTime(msg.created_at),
          createdAt: msg.created_at,
          avatar: "/api/placeholder/40/40"
        }))

        setMessages(formattedMessages)
      } else {
        console.log("[SCRIPT]Â­ No messages found for this couple")
        setMessages([])
      }
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error in loadMessages:", err)
    }
  }, [currentUser, editCoupleInfo?.id])

  // Helper to format message timestamps
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Load messages when user or couple changes
  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    const userId = currentUser.id
    const coupleId = editCoupleInfo.id
    const channel = supabase
      .channel(`messages:${userId}:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMessageRecord = payload.new as any

          if (Number(newMessageRecord.couple_id) !== Number(coupleId)) return

          setMessages((previousMessages) => {
            const messageExists = previousMessages.some(
              (message) => String(message.id) === String(newMessageRecord.id)
            )

            if (messageExists) return previousMessages

            const createdAt = newMessageRecord.created_at || newMessageRecord.timestamp || new Date().toISOString()

            return [
              {
                id: newMessageRecord.id,
                sender:
                  newMessageRecord.sender_name ||
                  (newMessageRecord.sender === "officiant" ? officiantLabel : "Couple"),
                role: newMessageRecord.sender,
                message: newMessageRecord.content || newMessageRecord.body || "",
                timestamp: formatMessageTime(createdAt),
                createdAt,
                avatar: "/api/placeholder/40/40",
              },
              ...previousMessages,
            ]
          })
        }
      )
      .subscribe((status) => {
        console.log("[MESSAGES] Realtime subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id, editCoupleInfo?.id, officiantLabel])

  // Load the officiant-wide task list across all ceremonies.
  const loadTasksForOfficiant = useCallback(async () => {
    if (!currentUser?.id) return

    setIsLoadingTasks(true)
    console.log("Loading tasks across all ceremonies for officiant:", currentUser.id)

    const result = await loadAllTasksFromDB(currentUser.id)
    const couplesById = new Map(allCouples.map((couple: any) => [Number(couple.id), couple]))

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedTasks: Task[] = result.data.map((t: any) => {
        const couple = couplesById.get(Number(t.couple_id))
        const coupleName = couple
          ? [couple.brideName, couple.groomName].filter(Boolean).join(" & ") || "Unnamed ceremony"
          : "Ceremony profile"

        return {
          id: t.id,
          coupleId: t.couple_id,
          coupleName,
          ceremonyDate: couple?.weddingDetails?.weddingDate || "",
          venueName: couple?.weddingDetails?.venueName || "",
          task: t.task,
          completed: t.completed || false,
          dueDate: t.due_date || "",
          dueTime: t.due_time || "",
          priority: t.priority || "medium",
          category: t.category || "General",
          details: t.details || "",
          emailReminder: t.email_reminder || false,
          reminderDays: t.reminder_days || 1,
          createdDate: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : ""
        }
      })
      setTasks(transformedTasks)
      console.log("Loaded", transformedTasks.length, "tasks across all ceremonies")
    } else {
      console.log("No tasks found or error loading officiant-wide tasks")
      setTasks([])
    }

    setIsLoadingTasks(false)
  }, [allCouples, currentUser?.id])

  useEffect(() => {
    loadTasksForOfficiant()
  }, [loadTasksForOfficiant])

  // Load files when couple changes
  const loadFilesForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingFiles(true)
    console.log("[SCRIPT]Â Loading files for couple:", editCoupleInfo.id)

    const result = await loadFilesFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedFiles = result.data.map((f: any) => ({
        id: f.id,
        name: f.file_name,
        size: f.file_size ? formatFileSize(f.file_size) : "Unknown",
        uploadedBy: officiantProfile?.name || "Officiant",
        date: f.created_at ? new Date(f.created_at).toLocaleDateString() : "",
        type: f.file_type || "application/octet-stream",
        url: f.file_url || "#",
        category: f.category
      }))
      setFiles(transformedFiles)
      console.log("Ã¢Å“â€¦ Loaded", transformedFiles.length, "files for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]Â­ No files found or error for couple", editCoupleInfo.id)
      setFiles([])
    }

    setIsLoadingFiles(false)
  }, [currentUser?.id, editCoupleInfo?.id, officiantProfile?.name])

  useEffect(() => {
    loadFilesForCouple()
  }, [loadFilesForCouple])

  // Load meetings when couple changes
  const loadMeetingsForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingMeetings(true)
    console.log("[SCRIPT]â€¦ Loading meetings for couple:", editCoupleInfo.id)

    const result = await loadMeetingsFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedMeetings: Meeting[] = result.data.map((m: any) => ({
        id: m.id,
        subject: m.title || m.subject || "Scheduled Meeting",
        body: m.notes || "",
        date: m.date || "",
        time: m.time || "",
        duration: m.duration || 60,
        location: m.location || "",
        meetingType: m.meeting_type || "in-person",
        attendees: [],
        status: getMeetingDisplayStatus({ date: m.date, time: m.time, status: m.status }),
        createdDate: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : "",
        reminderSent: false,
        calendarInviteSent: false,
        google_event_id: m.google_event_id || null,
        googleEventId: m.google_event_id || null,
        responseDeadline: m.response_deadline || ""
      }))
      setMeetings(transformedMeetings)
      console.log("Ã¢Å“â€¦ Loaded", transformedMeetings.length, "meetings for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]Â­ No meetings found or error for couple", editCoupleInfo.id)
      setMeetings([])
    }

    setIsLoadingMeetings(false)
  }, [currentUser?.id, editCoupleInfo?.id])

  useEffect(() => {
    loadMeetingsForCouple()
  }, [loadMeetingsForCouple])

  // Load contracts when couple changes
  const loadContractsForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingContracts(true)
    console.log("[SCRIPT]Å“ Loading contracts for couple:", editCoupleInfo.id)

    const result = await loadContractsFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      let contractRecords = result.data

      if (isCurrentCeremonyWedding && contractRecords.length === 0) {
        const defaultContract = await addContractToDB(currentUser.id, editCoupleInfo.id, {
          name: DEFAULT_CONTRACT_NAME,
          description: "Preformatted OrdainedPro default wedding contract with BoldSign tags. Download to personalize or send as-is.",
          type: "Wedding Service Agreement",
          fileUrl: getDefaultContractUrl(),
          fileType: PDF_CONTRACT_FILE_TYPE,
          fileSize: DEFAULT_CONTRACT_FILE_SIZE,
          status: "draft",
        })

        if (defaultContract.ok && defaultContract.data) {
          contractRecords = [defaultContract.data]
        } else {
          console.error("Failed to add default contract:", defaultContract.error)
        }
      }

      // Transform database format to component format
      const visibleContractRecords = isCurrentCeremonyWedding
        ? contractRecords
        : contractRecords.filter((record: any) => !isOrdainedProDefaultContract(transformContractRecord(record)))
      const transformedContracts = visibleContractRecords.map(transformContractRecord)
      setContracts(transformedContracts)
      console.log("Ã¢Å“â€¦ Loaded", transformedContracts.length, "contracts for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]Â­ No contracts found or error for couple", editCoupleInfo.id)
      setContracts([])
    }

    setIsLoadingContracts(false)
  }, [currentUser?.id, editCoupleInfo?.id, isCurrentCeremonyWedding])

  useEffect(() => {
    loadContractsForCouple()
  }, [loadContractsForCouple])

  // Load payments when couple changes
  const loadPaymentsForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingPayments(true)
    console.log("â€™Â° Loading payments for couple:", editCoupleInfo.id)

    const result = await loadPaymentsFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedPayments = result.data.map((p: any) => {
        const isRefundRow = String(p.payment_method || p.payment_type || "").toLowerCase() === "refund"
        return {
          id: p.id,
          date: p.paid_date || p.due_date || new Date(p.created_at).toLocaleDateString(),
          createdAt: p.created_at || "",
          amount: p.amount,
          type: isRefundRow ? "Refund" : p.invoice_number || p.description || "Invoice",
          method: isRefundRow ? "Refund" : p.status === "paid" ? "Completed" : "Pending",
          status: isRefundRow ? "refunded" : p.status,
          invoiceNumber: p.invoice_number || "",
          paymentType: p.payment_method || p.payment_type || "",
          description: p.notes || p.description || p.invoice_number || "Ceremony invoice",
          dueDate: p.due_date,
          refundFeeRate: Number(p.refund_fee_rate || 0),
          refundFee: Number(p.refund_fee_amount || 0),
          totalOfficiantCharge: Number(p.total_officiant_charge || 0)
        }
      })
      setPaymentHistory(transformedPayments)

      const paymentSummary = calculatePaymentSummary(transformedPayments)

      setPaymentInfo({
        totalAmount: paymentSummary.totalAmount,
        depositPaid: paymentSummary.totalPaid,
        balance: paymentSummary.balance,
        refundFeesCharged: paymentSummary.totalRefundFees,
        depositDate: transformedPayments.find((payment: any) => isPaidPayment(payment))?.date || "",
        finalPaymentDue: paymentSummary.finalPaymentDue,
        paymentStatus: paymentSummary.paymentStatus
      })

      console.log("Ã¢Å“â€¦ Loaded", transformedPayments.length, "payments for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]Â­ No payments found or error for couple", editCoupleInfo.id)
      setPaymentHistory([])
      setPaymentInfo({
        totalAmount: 0,
        depositPaid: 0,
        balance: 0,
        refundFeesCharged: 0,
        depositDate: "",
        finalPaymentDue: "",
        paymentStatus: "pending"
      })
    }

    setIsLoadingPayments(false)
  }, [currentUser?.id, editCoupleInfo?.id])

  useEffect(() => {
    loadPaymentsForCouple()
  }, [loadPaymentsForCouple])

  const loadFinancialPaymentsForUser = useCallback(async () => {
    if (!currentUser?.id) return

    const result = await loadAllPaymentsFromDB(currentUser.id)
    if (result.ok && result.data) {
      setAllPaymentRecords(result.data.map((payment: any) => ({
        id: payment.id,
        coupleId: payment.couple_id,
        description: payment.notes || payment.description || payment.invoice_number || "Ceremony invoice",
        amount: Number(payment.amount) || 0,
        type: payment.payment_method || payment.payment_type || "invoice",
        status: String(payment.payment_method || payment.payment_type || "").toLowerCase() === "refund"
          ? "refunded"
          : payment.status || "pending",
        dueDate: payment.due_date || "",
        paidDate: payment.paid_date || payment.created_at || "",
        createdAt: payment.created_at || "",
        refundFeeRate: Number(payment.refund_fee_rate || 0),
        refundFee: Number(payment.refund_fee_amount || 0),
        totalOfficiantCharge: Number(payment.total_officiant_charge || 0),
      })))
    } else {
      setAllPaymentRecords([])
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadFinancialPaymentsForUser()
  }, [loadFinancialPaymentsForUser])

  const loadSavedInvoiceServices = useCallback(async () => {
    if (!currentUser?.id) return

    const result = await loadInvoiceServicesFromDB(currentUser.id)
    if (result.ok && result.data) {
      setSavedInvoiceServices(result.data)
    } else {
      setSavedInvoiceServices([])
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadSavedInvoiceServices()
  }, [loadSavedInvoiceServices])

  // Load scripts when user changes
  const [isLoadingScripts, setIsLoadingScripts] = useState(false)

  const loadScriptsForUser = useCallback(async () => {
    if (!currentUser?.id) return

    setIsLoadingScripts(true)
    console.log("[SCRIPT]Å“ Loading scripts for user:", currentUser.id)

    const result = await loadScriptsFromDB(currentUser.id, editCoupleInfo?.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedScripts = result.data.map(transformScriptRecord)
      setCoupleScripts(transformedScripts)
      console.log("Ã¢Å“â€¦ Loaded", transformedScripts.length, "scripts from database")
    } else {
      console.log("[SCRIPT]Â­ No scripts found or error")
      // Keep default demo scripts if no database scripts
    }

    setIsLoadingScripts(false)
  }, [currentUser?.id, editCoupleInfo?.id])

  useEffect(() => {
    loadScriptsForUser()
  }, [loadScriptsForUser])

  const saveGeneratedScriptDraft = useCallback(async (script: {
    title: string
    type: string
    status?: string
    content: string
    description?: string
    coupleId?: number | null
  }) => {
    if (!currentUser?.id) return null

    const result = await addScriptToDB(currentUser.id, {
      title: script.title,
      type: script.type || "Custom",
      status: script.status || "Latest Draft",
      content: script.content,
      description: script.description || "Created by Mr. Script",
      coupleId: script.coupleId ?? editCoupleInfo?.id ?? null
    })

    if (!result.ok || !result.data) {
      console.error("Failed to save Mr. Script draft:", result.error)
      return null
    }

    const savedScript = transformScriptRecord(result.data)
    setCoupleScripts(prevScripts => [
      savedScript,
      ...prevScripts.filter(existing => String(existing.id) !== String(savedScript.id))
    ])
    return savedScript
  }, [currentUser?.id, editCoupleInfo?.id])

  const loadSalesForUser = useCallback(async () => {
    if (!currentUser?.id) return

    const result = await loadScriptSalesFromDB(currentUser.id)
    if (result.ok && result.data) {
      setScriptSales(result.data)
    } else {
      setScriptSales([])
    }
  }, [currentUser?.id])

  useEffect(() => {
    loadSalesForUser()
  }, [loadSalesForUser])

  // Script Management States
  const [showScriptEditorDialog, setShowScriptEditorDialog] = useState(false)
  const [showScriptViewerDialog, setShowScriptViewerDialog] = useState(false)
  const [showShareScriptDialog, setShowShareScriptDialog] = useState(false)
  const [editingScript, setEditingScript] = useState<any>(null)
  const [viewingScript, setViewingScript] = useState<any>(null)
  const [sharingScript, setSharingScript] = useState<any>(null)
  const [scriptContent, setScriptContent] = useState("")
  const [editorFontSize, setEditorFontSize] = useState(16)
  const editorRef = useRef<HTMLDivElement>(null)
  const cursorPositionRef = useRef<{ start: number; end: number } | null>(null)
  const [shareScriptForm, setShareScriptForm] = useState({
    to: 'both',
    customEmail: '',
    subject: '',
    body: '',
    includeNotes: true
  })
  const [selectedItemsToShare, setSelectedItemsToShare] = useState<{
    scripts: number[]
    files: number[]
  }>({
    scripts: [],
    files: []
  })

  // Display messages from Supabase with the newest conversation items first.
  const displayMessages = [...messages].sort((a, b) => {
    const bTime = new Date(b.createdAt || b.created_at || b.timestamp || 0).getTime()
    const aTime = new Date(a.createdAt || a.created_at || a.timestamp || 0).getTime()
    return bTime - aTime
  })

  // Tasks are now loaded per couple from the database
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  // Files are now loaded per couple from the database
  const [files, setFiles] = useState<any[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)

  // Meetings are now loaded per couple from the database
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])

  // Calendar events data
  const calendarEvents = {}

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null
    const dateKey = selectedDate.toISOString().split('T')[0]
    return (calendarEvents as any)[dateKey] || null
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '[HANDSHAKE]Â'
      case 'task': return 'Ã¢Å“â€¦'
      case 'rehearsal': return '[STYLE]'
      case 'ceremony': return 'â€™â€™'
      case 'preparation': return '[WARNING]â„¢Ã¯Â¸Â'
      case 'follow-up': return '[SCRIPT]Å¾'
      default: return '[SCRIPT]â€¦'
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'task': return 'bg-green-100 text-green-800 border-green-200'
      case 'rehearsal': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'ceremony': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'preparation': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'follow-up': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Contracts are now loaded per couple from the database
  const [contracts, setContracts] = useState<any[]>([])
  const [isLoadingContracts, setIsLoadingContracts] = useState(false)
  const [editingContractForUpload, setEditingContractForUpload] = useState<any | null>(null)

  const transformContractRecord = (c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    status: c.status || "draft",
    signedDate: c.signed_date ? new Date(c.signed_date).toLocaleDateString() : "",
    sentDate: c.sent_date ? new Date(c.sent_date).toLocaleDateString() : "",
    createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
    expiryDate: c.expiry_date || "",
    type: c.type || "Custom Contract",
    fileUrl: c.file_url,
    fileType: c.file_type || "application/octet-stream",
    fileSize: c.file_size || 0,
    file: c.file_url ? {
      id: `contract-file-${c.id}`,
      file: new File([], c.name, { type: c.file_type || "application/octet-stream" }),
      name: c.name,
      size: c.file_size || 0,
      type: c.file_type || "application/octet-stream",
      url: c.file_url,
      uploadProgress: 100,
      status: "completed" as const,
    } : undefined
  })

  const addDefaultContractForCurrentCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      return { ok: false, error: "No user or couple selected." }
    }

    if (!isCurrentCeremonyWedding) {
      return { ok: false, error: "The OrdainedPro default wedding contract is only available for wedding ceremonies." }
    }

    const existingDefault = contracts.find(isOrdainedProDefaultContract)

    if (existingDefault) {
      const currentDefaultUrl = getDefaultContractUrl()
      const existingUrl = getContractFileUrl(existingDefault)

      if (existingUrl && existingUrl !== currentDefaultUrl) {
        const updateResult = await updateContractInDB(existingDefault.id, {
          file_url: currentDefaultUrl,
          file_type: PDF_CONTRACT_FILE_TYPE,
          file_size: DEFAULT_CONTRACT_FILE_SIZE,
        } as any)

        if (updateResult.ok) {
          const updatedContract = {
            ...existingDefault,
            fileUrl: currentDefaultUrl,
            fileType: PDF_CONTRACT_FILE_TYPE,
            fileSize: DEFAULT_CONTRACT_FILE_SIZE,
            file: existingDefault.file ? { ...existingDefault.file, url: currentDefaultUrl, type: PDF_CONTRACT_FILE_TYPE, size: DEFAULT_CONTRACT_FILE_SIZE } : existingDefault.file,
          }

          setContracts((prev) => prev.map((contract) =>
            contract.id === existingDefault.id ? updatedContract : contract
          ))

          return { ok: true, data: updatedContract, alreadyExists: true }
        }
      }

      return { ok: true, data: existingDefault, alreadyExists: true }
    }

    const defaultContract = await addContractToDB(currentUser.id, editCoupleInfo.id, {
      name: DEFAULT_CONTRACT_NAME,
      description: "Preformatted OrdainedPro default wedding contract with BoldSign tags. Download to personalize or send as-is.",
      type: "Wedding Service Agreement",
      fileUrl: getDefaultContractUrl(),
      fileType: PDF_CONTRACT_FILE_TYPE,
      fileSize: DEFAULT_CONTRACT_FILE_SIZE,
      status: "draft",
    })

    if (defaultContract.ok && defaultContract.data) {
      const transformedContract = transformContractRecord(defaultContract.data)
      setContracts((prev) => [transformedContract, ...prev])
      return { ok: true, data: transformedContract, alreadyExists: false }
    }

    return { ok: false, error: defaultContract.error || "Failed to add the default contract." }
  }, [contracts, currentUser?.id, editCoupleInfo?.id, isCurrentCeremonyWedding])

  // AI Script Builder Functions
  const handleAiMessage = () => {
    if (!aiInput.trim()) return

    const userMessage = {
      id: aiChatMessages.length + 1,
      role: "user",
      content: aiInput,
      timestamp: new Date().toLocaleTimeString()
    }

    setAiChatMessages(prev => [...prev, userMessage])
    setAiInput("")
    setIsGeneratingScript(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAiResponse(aiInput, userResponses)
      const assistantMessage = {
        id: aiChatMessages.length + 2,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }
      setAiChatMessages(prev => [...prev, assistantMessage])
      setIsGeneratingScript(false)
    }, 2000)
  }

  const generateAiResponse = (userInput: string, previousResponses: Record<string, string>) => {
    const lowerInput = userInput.toLowerCase()

    if (lowerInput.includes('traditional') || lowerInput.includes('religious')) {
      return "Perfect! I'll help you create a traditional religious ceremony script. Here are some questions to personalize it:\n\n1. What religious tradition should we follow?\n2. Are there specific readings or prayers you'd like included?\n3. Will there be any cultural elements to incorporate?\n\nWould you like me to generate a traditional script template to start with?"
    }

    if (lowerInput.includes('modern') || lowerInput.includes('contemporary')) {
      return "Great choice! Modern ceremonies offer wonderful flexibility. Let me know:\n\n1. Do you prefer a spiritual but non-religious approach?\n2. Are there personal vows being exchanged?\n3. Any unity ceremonies, readings, or special moments to include?\n\nShould I create a contemporary script outline for this profile?"
    }

    if (lowerInput.includes('generate') || lowerInput.includes('create') || lowerInput.includes('yes')) {
      const subjectName = [editCoupleInfo?.brideName, editCoupleInfo?.groomName]
        .filter(Boolean)
        .join(" & ") || "this profile"
      return `Excellent! I'm generating a personalized ceremony script for ${subjectName}. This will include:\n\n* Processional or opening guidance\n* Welcome and opening words\n* Main ceremony sections\n* Special moments, readings, or rituals if needed\n* Closing words\n\nThe script is being created and will be saved to your files. Would you like me to customize any specific sections?`
    }

    if (lowerInput.includes('vows') || lowerInput.includes('rings')) {
      return "For the vow exchange, I can provide:\n\n* Traditional vows template\n* Guide for personal vow writing\n* Sample vow examples\n* Ring exchange wording\n\nWould you like me to create a complete vows section for their ceremony?"
    }

    return "I understand! Let me help you with that. I can assist with:\n\n* Creating ceremony scripts from scratch\n* Customizing existing templates\n* Adding personal touches and stories\n* Incorporating special readings or music\n* Adjusting tone and style\n\nWhat specific aspect of the ceremony script would you like to work on first?"
  }

  const handleGenerateScript = (scriptType: string) => {
    setIsGeneratingScript(true)

    setTimeout(async () => {
      const subjectName = [editCoupleInfo?.brideName, editCoupleInfo?.groomName]
        .filter(Boolean)
        .join(" & ") || currentCeremonyConfig.label
      const newScript = {
        id: Date.now(),
        coupleId: editCoupleInfo?.id,
        title: `${scriptType} Ceremony Script - ${subjectName}`,
        content: generateScriptContent(scriptType),
        createdDate: new Date().toLocaleDateString(),
        type: scriptType,
        status: "completed"
      }

      const savedScript = await saveGeneratedScriptDraft(newScript)
      const scriptForEditor = savedScript || newScript
      setGeneratedScripts(prev => [
        scriptForEditor,
        ...prev.filter(script => String(script.id) !== String(scriptForEditor.id))
      ])
      setIsGeneratingScript(false)

      const confirmationMessage = {
        id: aiChatMessages.length + 1,
        role: "assistant",
        content: `Perfect! I've generated a ${scriptType.toLowerCase()} ceremony script for ${subjectName}. The script is saved to this profile and is now open in the Script Editor tab where you can customize it. - Mr. Script`,
        timestamp: new Date().toLocaleTimeString()
      }

      setAiChatMessages(prev => [...prev, confirmationMessage])

      // Auto-switch to Script Editor tab and load the script
      setEditingScript(scriptForEditor)
      const htmlContent = scriptForEditor.content.replace(/\n/g, '<br>')
      setScriptContent(htmlContent)
      setEditorFontSize(16)
      setScriptBuilderTab('editor')
    }, 3000)
  }

  const generateScriptContent = (scriptType: string) => {
    const couple = `${editCoupleInfo?.brideName || 'Partner 1'} and ${editCoupleInfo?.groomName || 'Partner 2'}`
    const venue = editWeddingDetails.venueName || '[venue to be confirmed]'
    const date = editWeddingDetails.weddingDate
      ? new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '[date to be confirmed]'

    if (!isCurrentCeremonyWedding) {
      const serviceLabel = currentCeremonyConfig?.label || "Ceremony"

      return `${scriptType.toUpperCase()} ${serviceLabel.toUpperCase()} SCRIPT
Generated by Mr. Script for ${couple}
${venue} - ${date}

OPENING GUIDANCE
[Welcome guests and name the purpose of this ${serviceLabel.toLowerCase()}.]

WELCOME
"Family and friends, thank you for being here today. We are gathered at ${venue} for this meaningful ${serviceLabel.toLowerCase()}."

MAIN CEREMONY SECTION
[Add the primary story, blessing, tribute, coming-of-age moment, vow renewal language, reading, or reflection here.]

SPECIAL MOMENTS
[Include any readings, music, traditions, family participation, or symbolic actions that fit this ceremony.]

CLOSING WORDS
[Close with warmth, gratitude, and any next steps for guests.]

---
This script is a starter draft created by Mr. Script. Add names, stories, traditions, and details that make the ceremony personal.`
    }

    return `${scriptType.toUpperCase()} WEDDING CEREMONY SCRIPT
Generated by Mr. Script for ${couple}
${venue} - ${date}

PROCESSIONAL
[Music begins as wedding party enters]

OPENING WORDS
"Dearly beloved, we are gathered here today at ${venue} to celebrate the union of ${couple} in marriage. On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

${editCoupleInfo?.brideName || 'Partner 1'} and ${editCoupleInfo?.groomName || 'Partner 2'}, you have chosen to share your lives together, and we are honored to be part of this special moment."

DECLARATION OF INTENT
"${editCoupleInfo?.brideName || 'Partner 1'}, do you take ${editCoupleInfo?.groomName || 'Partner 2'} to be your lawfully wedded husband, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"

"${editCoupleInfo?.groomName || 'Partner 2'}, do you take ${editCoupleInfo?.brideName || 'Partner 1'} to be your lawfully wedded wife, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?"

EXCHANGE OF VOWS
[Personal vows to be exchanged]

RING CEREMONY
"These rings serve as a symbol of your unending love and commitment. As you place them on each other's hands, remember that love is not just a feeling, but a choice you make every day."

PRONOUNCEMENT
"By the power vested in me, and in the presence of these witnesses, I now pronounce you husband and wife. You may kiss!"

RECESSIONAL
[Couple exits as music plays]

---
This script has been customized for your ceremony by Mr. Script. Feel free to modify any sections to better reflect your style and preferences.

Best regards,
Mr. Script - Your Personal Wedding Script Creator`
  }

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const getMrScriptProfileService = () => {
    const profileType = resolveCeremonyTypeValue(currentCeremonyType || editCoupleInfo?.ceremonyTypeLabel)

    if (profileType === "quinceanera") return "Coming-of-Age"
    if (profileType === "celebration_of_life") return "Celebration of Life"
    if (profileType === "baby_blessing") return "Baby Blessing"
    if (profileType === "vow_renewal") return "Vow Renewal"
    if (profileType === "wedding") return "Wedding"
    return currentCeremonyConfig?.label || "Custom Life Ceremony"
  }

  const buildMrScriptProfileContext = () => {
    const profileType = resolveCeremonyTypeValue(currentCeremonyType || editCoupleInfo?.ceremonyTypeLabel)
    const serviceOption = getMrScriptProfileService()
    const ceremonyLabel = currentCeremonyConfig?.label || editCoupleInfo?.ceremonyTypeLabel || "Ceremony"
    const partner1Name = editCoupleInfo?.brideName || ""
    const partner2Name = editCoupleInfo?.groomName || ""
    const coupleNames = [partner1Name, partner2Name].filter(Boolean).join(" & ")
    const isMinorCeremony = profileType === "quinceanera" || profileType === "baby_blessing"
    const isMemorialCeremony = profileType === "celebration_of_life"
    const honoreeName = isMinorCeremony
      ? (editCoupleInfo?.honoreeName || editCoupleInfo?.honoreeFullName || partner1Name)
      : ""
    const childName = profileType === "baby_blessing"
      ? (editCoupleInfo?.childName || honoreeName || partner1Name)
      : ""
    const deceasedName = isMemorialCeremony
      ? (editCoupleInfo?.deceasedName || editCoupleInfo?.deceasedFullName || partner2Name || partner1Name)
      : ""
    const primaryContactName = isMemorialCeremony
      ? (partner1Name || partner2Name)
      : ""
    const parentGuardianNames = isMinorCeremony
      ? [editCoupleInfo?.parentGuardianName, partner2Name, partner1Name !== honoreeName ? partner1Name : ""]
          .filter(Boolean)
          .filter((name, index, all) => all.indexOf(name) === index)
          .join(" & ")
      : ""
    const subjectName =
      profileType === "wedding" || profileType === "vow_renewal"
        ? coupleNames
        : deceasedName || childName || honoreeName || coupleNames || ceremonyLabel
    const ceremonyDate = editWeddingDetails?.weddingDate || ""
    const ceremonyTime = formatProfileTime(editWeddingDetails?.startTime)
    const venueName = editWeddingDetails?.venueName || ""
    const venueAddress = editWeddingDetails?.venueAddress || editCoupleInfo?.address || ""
    const expectedGuests = editWeddingDetails?.expectedGuests || ""
    const specialRequests = sanitizeProfileNotesForScript(editCoupleInfo?.specialRequests || "")
    const detailsAny = editWeddingDetails as any
    const privateNotes = editWeddingDetails?.officiantNotes || detailsAny?.privateNotes || ""
    const honoreeAge = editCoupleInfo?.honoreeAge || editCoupleInfo?.age || getCeremonyAgeFromNotes(specialRequests, "Honoree")

    const knownFacts = [
      `Ceremony type: ${ceremonyLabel}`,
      subjectName ? `Primary subject: ${subjectName}` : "",
      profileType === "wedding" && coupleNames ? `Couple: ${coupleNames}` : "",
      profileType === "vow_renewal" && coupleNames ? `Couple: ${coupleNames}` : "",
      honoreeName ? `Honoree: ${honoreeName}` : "",
      honoreeAge ? `Honoree age: ${honoreeAge}` : "",
      childName ? `Child: ${childName}` : "",
      parentGuardianNames ? `Parent/guardian names: ${parentGuardianNames}` : "",
      deceasedName ? `Deceased/loved one: ${deceasedName}` : "",
      primaryContactName ? `Primary family contact: ${primaryContactName}` : "",
      ceremonyDate ? `Ceremony date: ${ceremonyDate}` : "",
      ceremonyTime ? `Ceremony time: ${ceremonyTime}` : "",
      venueName ? `Venue: ${venueName}` : "",
      venueAddress ? `Venue address: ${venueAddress}` : "",
      expectedGuests ? `Expected guests: ${expectedGuests}` : "",
      specialRequests ? `Profile notes: ${specialRequests}` : "",
      privateNotes ? `Officiant private notes: ${privateNotes}` : "",
    ].filter(Boolean)

    const responsePrefill: Record<string, string> = {
      "ceremony-type": serviceOption,
      "profile-context-summary": knownFacts.map((fact) => `- ${fact}`).join("\n"),
    }

    if (subjectName) {
      responsePrefill["core-details"] = knownFacts.join("\n")
    }

    if ((profileType === "wedding" || profileType === "vow_renewal") && coupleNames) {
      responsePrefill[getGuidedDetailResponseKey("core-details", 0)] = coupleNames
    } else if (profileType === "quinceanera" && honoreeName) {
      responsePrefill[getGuidedDetailResponseKey("core-details", 0)] = honoreeName
    } else if (profileType === "celebration_of_life" && deceasedName) {
      responsePrefill[getGuidedDetailResponseKey("core-details", 0)] = deceasedName
    } else if (profileType === "baby_blessing" && childName) {
      responsePrefill[getGuidedDetailResponseKey("core-details", 0)] = childName
    }

    if (specialRequests || privateNotes) {
      responsePrefill["story-notes"] = [specialRequests, privateNotes].filter(Boolean).join("\n\n")
    }

    if (honoreeName) responsePrefill["honoree-name"] = honoreeName
    if (childName) responsePrefill["child-name"] = childName
    if (deceasedName) responsePrefill["loved-one-name"] = deceasedName
    if (parentGuardianNames) responsePrefill["intake-family-traditions"] = `Family or guardian names already in profile: ${parentGuardianNames}`
    if (profileType === "wedding" && coupleNames) responsePrefill["intake-relationship-story"] = `Couple names already in profile: ${coupleNames}`
    if (profileType === "celebration_of_life" && deceasedName) responsePrefill["intake-life-story"] = `Loved one named in profile: ${deceasedName}`
    if (profileType === "baby_blessing" && childName) responsePrefill["intake-child-family"] = `Child named in profile: ${childName}${parentGuardianNames ? `; parents/guardians: ${parentGuardianNames}` : ""}`

    return {
      profileType,
      serviceOption,
      ceremonyLabel,
      subjectName,
      partner1Name,
      partner2Name,
      honoreeName,
      childName,
      deceasedName,
      parentGuardianNames,
      primaryContactName,
      ceremonyDate,
      ceremonyTime,
      venueName,
      venueAddress,
      expectedGuests,
      specialRequests,
      privateNotes,
      knownFacts,
      responsePrefill,
    }
  }

  const buildQuickSetupResponses = (baseResponses: Record<string, string> = {}) => {
    const profileContext = buildMrScriptProfileContext()
    const scriptTypeSelection = selectedCeremonyStyle || profileContext.serviceOption || baseResponses['ceremony-type']
    const quickSetupResponses: Record<string, string> = {
      ...baseResponses,
    }
    const quickSetupService = getMrScriptServiceByResponse(scriptTypeSelection)
    const shouldUseWeddingDetails = ["wedding", "vow_renewal"].includes(quickSetupService.id)

    if (scriptTypeSelection) {
      quickSetupResponses['ceremony-type'] = scriptTypeSelection
    }

    if (quickSetupResponses['profile-context-summary']) {
      const normalizedProfileFacts = quickSetupResponses['profile-context-summary']
        .split("\n")
        .map((fact) => fact.replace(/^- Ceremony type:.+$/i, `- Ceremony type: ${quickSetupService.displayName}`))
        .filter((fact) => shouldUseWeddingDetails || !/^- Couple:/i.test(fact))

      quickSetupResponses['profile-context-summary'] = normalizedProfileFacts.join("\n")
    }

    if (selectedCeremonyLength) {
      quickSetupResponses['ceremony-duration'] = selectedCeremonyLength
    }

    if (selectedOfficiantStyle) {
      quickSetupResponses['ceremony-tone'] = selectedOfficiantStyle
      quickSetupResponses['officiant-style'] = selectedOfficiantStyle
    }

    if (storyNotes.trim()) {
      quickSetupResponses['story-notes'] = storyNotes.trim()
    }

    if (shouldUseWeddingDetails && selectedUnityCeremony && selectedUnityCeremony !== "None") {
      quickSetupResponses['special-elements'] = selectedUnityCeremony
      quickSetupResponses[getGuidedDetailResponseKey("core-details", 3)] = "Yes"
    } else if (shouldUseWeddingDetails && selectedUnityCeremony === "None") {
      quickSetupResponses['special-elements'] = "None"
      quickSetupResponses[getGuidedDetailResponseKey("core-details", 3)] = "No"
    }

    if (shouldUseWeddingDetails && selectedVowsType) {
      if (selectedVowsType === "Traditional") {
        quickSetupResponses['vows-type'] = "Traditional Vows"
      } else if (selectedVowsType === "Personal") {
        quickSetupResponses['vows-type'] = "Personal Written Vows"
      } else if (selectedVowsType === "Personal and Modern") {
        quickSetupResponses['vows-type'] = "Mix of Both"
      } else {
        quickSetupResponses['vows-type'] = selectedVowsType
      }

      quickSetupResponses[getGuidedDetailResponseKey("core-details", 2)] =
        selectedVowsType === "None" ? "No" : quickSetupResponses['vows-type']
    }

    const quickSetupFacts = [
      scriptTypeSelection ? `Script type: ${quickSetupService.displayName}` : "",
      selectedCeremonyLength ? `Ceremony length: ${selectedCeremonyLength}` : "",
      selectedOfficiantStyle ? `Officiant style: ${selectedOfficiantStyle}` : "",
      shouldUseWeddingDetails && selectedUnityCeremony ? `Unity ceremony: ${selectedUnityCeremony}` : "",
      shouldUseWeddingDetails && selectedVowsType ? `Vows: ${selectedVowsType}` : "",
      storyNotes.trim() ? `Story notes: ${storyNotes.trim()}` : "",
    ].filter(Boolean)

    if (quickSetupFacts.length) {
      quickSetupResponses['quick-setup-summary'] = quickSetupFacts.map((fact) => `- ${fact}`).join("\n")
    }

    const coreQuestion = getActiveGuidedQuestions(quickSetupResponses).find((question) => question.id === "core-details")
    if (coreQuestion && !hasUnansweredGuidedDetails(coreQuestion, quickSetupResponses)) {
      const coreSummary = buildGuidedDetailSummary(coreQuestion, quickSetupResponses)
      if (coreSummary) quickSetupResponses['core-details'] = coreSummary
    }

    return quickSetupResponses
  }

  useEffect(() => {
    setSelectedCeremonyStyle(getMrScriptProfileService())
  }, [editCoupleInfo?.id, currentCeremonyType])

  const getFirstUnansweredGuidedQuestionIndex = (responses: Record<string, string>) => {
    const activeQuestions = getActiveGuidedQuestions(responses)
    const firstUnansweredIndex = activeQuestions.findIndex((question) =>
      !responses[question.id] || hasUnansweredGuidedDetails(question, responses)
    )

    return firstUnansweredIndex === -1 ? activeQuestions.length : firstUnansweredIndex
  }

  useEffect(() => {
    const syncedResponses = buildQuickSetupResponses(userResponses)
    const quickSetupKeys = [
      "ceremony-type",
      "ceremony-duration",
      "ceremony-tone",
      "officiant-style",
      "story-notes",
      "special-elements",
      "vows-type",
      "quick-setup-summary",
    ]
    const hasQuickSetupChanges = quickSetupKeys.some(
      (key) => (userResponses[key] || "") !== (syncedResponses[key] || "")
    )

    if (hasQuickSetupChanges) {
      setUserResponses(syncedResponses)
    }

    if (scriptMode === "guided") {
      const activeQuestions = getActiveGuidedQuestions(syncedResponses)
      const currentQuestion = activeQuestions[currentQuestionIndex]
      const currentQuestionAnswered = currentQuestion
        ? Boolean(syncedResponses[currentQuestion.id]) && !hasUnansweredGuidedDetails(currentQuestion, syncedResponses)
        : true
      const nextQuestionIndex = getFirstUnansweredGuidedQuestionIndex(syncedResponses)

      if (currentQuestionAnswered && nextQuestionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(nextQuestionIndex)
      }
    }
  }, [
    selectedCeremonyStyle,
    selectedCeremonyLength,
    selectedOfficiantStyle,
    selectedUnityCeremony,
    selectedVowsType,
    storyNotes,
    scriptMode,
    currentQuestionIndex,
    userResponses,
  ])

  const handleModeSelect = (mode: "guided" | "expert") => {
    setScriptMode(mode)

    // Initialize chatbot for guided mode
    if (mode === 'guided') {
      setShowGuidedChatbot(true)
      initializeChatbot()
    } else {
      setShowGuidedChatbot(false)
    }
  }

  // AI Chatbot Handler Functions
  const initializeChatbot = () => {
    const profileContext = buildMrScriptProfileContext()
    const startingResponses = buildQuickSetupResponses(profileContext.responsePrefill)
    const activeQuestions = getActiveGuidedQuestions(startingResponses)
    const rawFirstUnansweredIndex = activeQuestions.findIndex((question) =>
      !startingResponses[question.id] || hasUnansweredGuidedDetails(question, startingResponses)
    )
    const firstUnansweredIndex = rawFirstUnansweredIndex === -1 ? 0 : rawFirstUnansweredIndex
    const openingQuestion = activeQuestions[firstUnansweredIndex] || activeQuestions[0]
    const profileIntro = profileContext.knownFacts.length
      ? [
          "I pulled these details from the active profile so you do not have to retype them:",
          profileContext.knownFacts.slice(0, 8).map((fact) => `- ${fact}`).join("\n"),
          "If any of that is wrong, just tell me and I will use your correction for the script."
        ].join("\n\n")
      : ""

    setChatMessages([])
    setCurrentQuestionIndex(firstUnansweredIndex)
    setUserResponses(startingResponses)

    setIsTyping(true)
    setTimeout(() => {
      setChatMessages([
        {
          id: `ai-opening-${Date.now()}`,
          type: 'ai',
          content: [profileIntro, generateAIResponse(openingQuestion, startingResponses)].filter(Boolean).join("\n\n"),
          timestamp: new Date(),
          questionId: openingQuestion.id
        }
      ])
      setIsTyping(false)
    }, 500)
  }

  const askNextQuestion = (questionIndex: number, responseOverrides: Record<string, string> = userResponses) => {
    const mergedResponses = buildQuickSetupResponses(responseOverrides)
    const activeQuestions = getActiveGuidedQuestions(mergedResponses)

    if (questionIndex >= activeQuestions.length) {
      // All questions completed, generate recommendation
      generateFinalRecommendation(mergedResponses)
      return
    }

    const question = activeQuestions[questionIndex]

    // Skip questions that have already been answered via Quick Setup
    if (mergedResponses[question.id] && !hasUnansweredGuidedDetails(question, mergedResponses)) {
      // Question already answered, move to next one
      setCurrentQuestionIndex(prev => prev + 1)
      askNextQuestion(questionIndex + 1, mergedResponses)
      return
    }

    setIsTyping(true)

    setTimeout(() => {
      const aiResponse = generateAIResponse(question, mergedResponses)
      const questionMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        questionId: question.id
      }

      setChatMessages(prev => [...prev, questionMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleGuidedDetailResponse = (response: string) => {
    const mergedUserResponses = buildQuickSetupResponses(userResponses)
    const currentQuestion = getActiveGuidedQuestions(mergedUserResponses)[currentQuestionIndex]
    if (!currentQuestion || !hasUnansweredGuidedDetails(currentQuestion, mergedUserResponses)) return false

    const detailIndex = getFirstUnansweredGuidedDetailIndex(currentQuestion, mergedUserResponses)
    if (detailIndex === -1) return false

    const answer = response.trim().toLowerCase() === "skip" ? "Skipped" : response.trim()
    const detailKey = getGuidedDetailResponseKey(currentQuestion.id, detailIndex)
    const nextResponses = {
      ...mergedUserResponses,
      [detailKey]: answer
    }
    nextResponses[currentQuestion.id] = buildGuidedDetailSummary(currentQuestion, nextResponses)
    setUserResponses(nextResponses)

    const nextDetailPrompt = buildGuidedDetailPrompt(currentQuestion, nextResponses)

    setTimeout(() => {
      if (nextDetailPrompt) {
        setIsTyping(true)
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `ai-detail-${Date.now()}`,
            type: 'ai',
            content: nextDetailPrompt,
            timestamp: new Date(),
            questionId: currentQuestion.id
          }

          setChatMessages(prev => [...prev, assistantMessage])
          setIsTyping(false)
        }, 500)
        return
      }

      setCurrentQuestionIndex(prev => prev + 1)
      askNextQuestion(currentQuestionIndex + 1, nextResponses)
    }, 300)

    return true
  }

  const handleLovedOneHonorFollowUp = (response: string) => {
    const mergedUserResponses = buildQuickSetupResponses(userResponses)
    const activeQuestions = getActiveGuidedQuestions(mergedUserResponses)
    const currentQuestion = activeQuestions[currentQuestionIndex]
    const trimmedResponse = response.trim()

    if (mergedUserResponses[PENDING_LOVED_ONE_HONOR_KEY] === "true") {
      const remembrancePreference = isNegativeResponse(trimmedResponse)
        ? "Keep the loved one remembrance general and do not mention specific names."
        : trimmedResponse
      const priorInclusions = mergedUserResponses['special-inclusions'] || ""
      const nextResponses = {
        ...mergedUserResponses,
        [PENDING_LOVED_ONE_HONOR_KEY]: "",
        [LOVED_ONE_HONOR_STYLE_KEY]: remembrancePreference,
        'special-inclusions': [
          priorInclusions,
          `Loved one remembrance preference: ${remembrancePreference}`
        ].filter(Boolean).join("\n")
      }

      setUserResponses(nextResponses)

      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
        askNextQuestion(currentQuestionIndex + 1, nextResponses)
      }, 500)

      return true
    }

    if (currentQuestion?.id !== "special-inclusions") return false
    if (!shouldAskLovedOneHonorFollowUp(trimmedResponse)) return false

    const nextResponses = {
      ...mergedUserResponses,
      [PENDING_LOVED_ONE_HONOR_KEY]: "true",
      'special-inclusions': trimmedResponse
    }

    setUserResponses(nextResponses)

    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: `ai-loved-one-${Date.now()}`,
          type: 'ai',
          content: [
            "Of course. Would you like me to mention a loved one by name, or keep the remembrance general for all loved ones who have passed?",
            "Sometimes general language is safest, because if one person is named and another important loved one is not, it can unintentionally hurt or offend someone.",
            "You can reply with the name to include, say \"keep it general,\" or say skip."
          ].join("\n\n"),
          timestamp: new Date(),
          questionId: currentQuestion.id
        }

        setChatMessages(prev => [...prev, assistantMessage])
        setIsTyping(false)
      }, 500)
    }, 300)

    return true
  }

  const handleClarificationRequest = (response: string) => {
    if (!isClarificationRequest(response)) return false

    const mergedUserResponses = buildQuickSetupResponses(userResponses)
    const activeQuestions = getActiveGuidedQuestions(mergedUserResponses)
    const currentQuestion = activeQuestions[currentQuestionIndex]
    if (!currentQuestion && mergedUserResponses[PENDING_LOVED_ONE_HONOR_KEY] !== "true") return false

    const detailPrompt = currentQuestion
      ? buildGuidedDetailPrompt(currentQuestion, mergedUserResponses, "Back to the question:")
      : null
    const repeatPrompt =
      mergedUserResponses[PENDING_LOVED_ONE_HONOR_KEY] === "true"
        ? "Would you like me to mention a loved one by name, or keep the remembrance general for all loved ones who have passed?"
        : currentQuestion?.id === "special-inclusions"
          ? getSpecialInclusionsPrompt()
          : detailPrompt || (currentQuestion ? generateAIResponse(currentQuestion, mergedUserResponses) : "")

    setTimeout(() => {
      setIsTyping(true)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: `ai-clarify-${Date.now()}`,
          type: 'ai',
          content: [
            buildClarificationAnswer(response),
            repeatPrompt
          ].filter(Boolean).join("\n\n"),
          timestamp: new Date(),
          questionId: currentQuestion?.id
        }

        setChatMessages(prev => [...prev, assistantMessage])
        setIsTyping(false)
      }, 500)
    }, 300)

    return true
  }

  const normalizeGuidedQuestionAnswer = (question: Question, response: string) => {
    const trimmedResponse = response.trim()

    if (question.id === "avoidances" && (
      isNegativeResponse(trimmedResponse) ||
      /\b(nothing|nothing to avoid|no avoid|no avoids|keep it general|general is fine|all good)\b/i.test(trimmedResponse)
    )) {
      return "None"
    }

    return trimmedResponse
  }

  const saveCurrentGuidedQuestionResponse = (response: string) => {
    const mergedResponses = buildQuickSetupResponses(userResponses)
    const activeQuestions = getActiveGuidedQuestions(mergedResponses)
    const currentQuestion = activeQuestions[currentQuestionIndex]

    if (!currentQuestion) return false

    const nextResponses = {
      ...mergedResponses,
      [currentQuestion.id]: normalizeGuidedQuestionAnswer(currentQuestion, response)
    }
    const nextQuestionIndex = getFirstUnansweredGuidedQuestionIndex(nextResponses)

    setUserResponses(nextResponses)
    setTimeout(() => {
      setCurrentQuestionIndex(nextQuestionIndex)
      askNextQuestion(nextQuestionIndex, nextResponses)
    }, 500)

    return true
  }

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])

    const lowerInput = chatInput.toLowerCase()

    if (handleClarificationRequest(chatInput)) {
      setChatInput("")
      return
    }

    if (handleGuidedDetailResponse(chatInput)) {
      setChatInput("")
      return
    }

    if (handleLovedOneHonorFollowUp(chatInput)) {
      setChatInput("")
      return
    }

    // Check if user wants to generate the script
    if (lowerInput.includes('yes') || lowerInput.includes('generate script') || lowerInput.includes('create script') || lowerInput.includes('make script')) {
      setChatInput("")
      generateAndSaveScript()
      return
    }

    // Check if user is requesting script modifications after generation
    if (hasGeneratedScript && (
      lowerInput.includes('change') || lowerInput.includes('modify') || lowerInput.includes('update') ||
      lowerInput.includes('add') || lowerInput.includes('remove') || lowerInput.includes('edit') ||
      lowerInput.includes('make it') || lowerInput.includes('can you') || lowerInput.includes('please')
    )) {
      setChatInput("")
      handleScriptModification(chatInput)
      return
    }

    setChatInput("")

    saveCurrentGuidedQuestionResponse(chatInput)
  }

  const handleQuickResponse = (response: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: response,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])

    // Check if this is a script modification request after generation
    if (hasGeneratedScript) {
      handleScriptModification(response)
      return
    }

    if (handleClarificationRequest(response)) {
      return
    }

    if (handleGuidedDetailResponse(response)) {
      return
    }

    if (handleLovedOneHonorFollowUp(response)) {
      return
    }

    saveCurrentGuidedQuestionResponse(response)
  }

  const generateFinalRecommendation = (responses: Record<string, string> = userResponses) => {
    setIsTyping(true)

    setTimeout(() => {
      const recommendation = generateRecommendation(responses)
      const recommendationMessage: ChatMessage = {
        id: `ai-final-${Date.now()}`,
        type: 'ai',
        content: recommendation,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, recommendationMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateAndSaveScript = async (usePremiumModel = false) => {
    if (usePremiumModel) {
      if (!premiumScriptStorageKey) {
        alert("Please select a ceremony profile before using Premium Polish.")
        return
      }

      if (premiumScriptUses >= PREMIUM_SCRIPT_LIMIT) {
        alert(`Premium Polish has already been used ${PREMIUM_SCRIPT_LIMIT} times for this profile.`)
        return
      }
    }

    setIsTyping(true)

    const profileContext = buildMrScriptProfileContext()
    const scriptTypeSelection = selectedCeremonyStyle || profileContext.serviceOption || userResponses['ceremony-type']
    const responseMap: Record<string, string> = buildQuickSetupResponses({
      ...profileContext.responsePrefill,
      ...userResponses,
      'ceremony-type': scriptTypeSelection,
      'ceremony-duration': userResponses['ceremony-duration'] || selectedCeremonyLength,
      'ceremony-tone': userResponses['ceremony-tone'] || selectedOfficiantStyle,
      'officiant-style': userResponses['officiant-style'] || selectedOfficiantStyle,
      'story-notes': userResponses['story-notes'] || storyNotes || profileContext.responsePrefill["story-notes"],
      'special-elements': userResponses['special-elements'] || selectedUnityCeremony,
      'vows-type': userResponses['vows-type'] || selectedVowsType,
    })
    const service = getMrScriptServiceByResponse(responseMap['ceremony-type'])
    const fallbackScript = generateCompleteScript(responseMap, editCoupleInfo, editWeddingDetails)

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ceremonyType: responseMap['ceremony-type'],
          ceremonyStyle: responseMap['ceremony-type'],
          ceremonyLength: responseMap['ceremony-duration'],
          ceremonyTone: responseMap['ceremony-tone'],
          officiantStyle: responseMap['officiant-style'],
          brideName: editCoupleInfo?.brideName || "",
          groomName: editCoupleInfo?.groomName || "",
          subjectName: profileContext.subjectName || [editCoupleInfo?.brideName, editCoupleInfo?.groomName].filter(Boolean).join(" & "),
          venue: editWeddingDetails?.venueName || "",
          weddingDate: editWeddingDetails?.weddingDate || "",
          ceremonyDate: editWeddingDetails?.weddingDate || "",
          ceremonyProfileContext: profileContext,
          usePremiumModel,
          userResponses: responseMap,
          storyNotes: responseMap['story-notes'],
          coreDetails: responseMap['core-details'],
          specialInclusions: responseMap['special-inclusions'],
          lovedOneHonorStyle: responseMap[LOVED_ONE_HONOR_STYLE_KEY],
          avoidances: responseMap['avoidances'],
          unityCeremony: responseMap['special-elements'],
          vowsType: responseMap['vows-type'],
        }),
      })

      if (!response.ok) {
        let errorDetails = await response.text()
        try {
          const parsedError = JSON.parse(errorDetails)
          errorDetails = parsedError.details || parsedError.error || errorDetails
        } catch {
          // Keep the raw response text when the server does not return JSON.
        }
        throw new Error(errorDetails)
      }

      const data = await response.json()
      const completeScript = data.script || fallbackScript
      if (usePremiumModel) {
        const nextPremiumUses = Math.min(PREMIUM_SCRIPT_LIMIT, premiumScriptUses + 1)
        setPremiumScriptUses(nextPremiumUses)
        if (premiumScriptStorageKey && typeof window !== "undefined") {
          window.localStorage.setItem(premiumScriptStorageKey, String(nextPremiumUses))
        }
      }
      const segmentNames =
        data.segmentPlan?.map((segment: { name: string }) => `- ${segment.name}`) ||
        service.scriptSections.map((section) => `- ${section}`)

      setGeneratedScriptContent(completeScript)
      setHasGeneratedScript(true)

      const scriptGeneratedMessage: ChatMessage = {
        id: `ai-script-generated-${Date.now()}`,
        type: 'ai',
        content: `**Your ${service.shortName.toLowerCase()} script has been ${usePremiumModel ? "polished with the premium model" : "generated"}!**

I've ${usePremiumModel ? "created a more polished version" : "created a first draft"} for a ${service.displayName.toLowerCase()} using the service type, tone, length, sensitivity needs, and story details you provided.

The draft was built in ${data.segmentPlan?.length || service.scriptSections.length} focused section(s):
${segmentNames.join("\n")}

${usePremiumModel ? `Premium Polish uses remaining for this profile: ${Math.max(0, PREMIUM_SCRIPT_LIMIT - (premiumScriptUses + 1))}.` : ""}

**Your script is ready!** Click the "Generate Final Script" button below to open it in the full editor where you can make any final adjustments.`,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, scriptGeneratedMessage])
    } catch (error) {
      console.error("Mr. Script API generation failed, using local fallback:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      const configurationHint = /OPENAI_API_KEY|api key/i.test(errorMessage)
        ? "The full Mr. Script engine is missing `OPENAI_API_KEY` on the server. Add it to `.env.local` for local testing and to your deployment environment, then restart/redeploy."
        : `The full Mr. Script engine returned this error: ${errorMessage}`

      setGeneratedScriptContent(fallbackScript)
      setHasGeneratedScript(true)

      const fallbackMessage: ChatMessage = {
        id: `ai-script-generated-${Date.now()}`,
        type: 'ai',
        content: `**Your ${service.shortName.toLowerCase()} script has been generated locally.**

I could not reach the full Mr. Script generation engine, so I created a structured starter draft instead.

${configurationHint}

You can still open this starter draft in the editor and refine it.`,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsTyping(false)
    }

    return

    setTimeout(() => {
      const service = getMrScriptServiceByResponse(userResponses['ceremony-type'] || selectedCeremonyStyle)
      const isWeddingFlow = ["wedding", "vow_renewal"].includes(service.id)

      // Generate the complete script
      const completeScript = generateCompleteScript(userResponses, editCoupleInfo, editWeddingDetails)

      // Save the script content
      setGeneratedScriptContent(completeScript)
      setHasGeneratedScript(true)

      // Send confirmation message
      const scriptGeneratedMessage: ChatMessage = {
        id: `ai-script-generated-${Date.now()}`,
        type: 'ai',
        content: `[CELEBRATE] **Your ceremony script has been generated!**

I've created a beautiful ${userResponses['ceremony-type'] || selectedCeremonyStyle} ceremony script for ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}.

The script includes:
Ã¢Å“â€¦ Opening words and processional
Ã¢Å“â€¦ Declaration of intent
Ã¢Å“â€¦ ${userResponses['vows-type'] || selectedVowsType} vows
${(userResponses['special-elements'] || selectedUnityCeremony) !== 'None' ? `Ã¢Å“â€¦ ${userResponses['special-elements'] || selectedUnityCeremony} unity ceremony` : ''}
Ã¢Å“â€¦ Ring exchange ceremony
Ã¢Å“â€¦ Pronouncement and recessional

**Your script is ready!** Click the "Generate Final Script" button below to open it in the full editor where you can make any final adjustments.`,
        timestamp: new Date()
      }

      if (!isWeddingFlow) {
        scriptGeneratedMessage.content = `**Your ${service.shortName.toLowerCase()} script has been generated!**

I've created a first draft for a ${service.displayName.toLowerCase()} using the tone, length, and details you provided.

The draft includes:
${service.scriptSections.map((section) => `- ${section}`).join("\n")}

**Your script is ready!** Click the "Generate Final Script" button below to open it in the full editor where you can make any final adjustments.`
      }

      setChatMessages(prev => [...prev, scriptGeneratedMessage])
      setIsTyping(false)
    }, 2000)
  }

  const resetChatbot = () => {
    setChatMessages([])
    setCurrentQuestionIndex(0)
    setUserResponses({})
    setIsTyping(false)
    setChatInput("")
    setHasGeneratedScript(false)
    setGeneratedScriptContent("")
    initializeChatbot()
  }

  // Handle ceremony style and length generation request
  const handleGenerateRequest = () => {
    if (!selectedCeremonyStyle || !selectedCeremonyLength) {
      alert('Please select both script type and duration to generate a script request for Mr. Script')
      return
    }

    // Pre-populate responses based on Quick Setup selections
    const profileContext = buildMrScriptProfileContext()
    const quickSetupResponses = buildQuickSetupResponses(profileContext.responsePrefill)
    const quickSetupService = getMrScriptServiceByResponse(selectedCeremonyStyle)
    const shouldUseWeddingDetails = ["wedding", "vow_renewal"].includes(quickSetupService.id)

    // Set the responses immediately
    setUserResponses(quickSetupResponses)

    // Build description with all selections
    let ceremonyDescription = `${selectedCeremonyStyle} script that's ${selectedCeremonyLength} long`

    if (shouldUseWeddingDetails && selectedUnityCeremony && selectedUnityCeremony !== "None") {
      ceremonyDescription += ` with a ${selectedUnityCeremony} unity ceremony`
    }

    if (shouldUseWeddingDetails && selectedVowsType) {
      ceremonyDescription += ` featuring ${selectedVowsType} vows`
    }

    // Add the request as a user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: `Generate a ${ceremonyDescription}`,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])

    // Generate AI response that acknowledges the provided information
    setTimeout(() => {
      let aiResponse = `Perfect! I have all the key details from your Quick Setup:

Ã¢Å“â€¦ **Ceremony Style**: ${selectedCeremonyStyle}
Ã¢Å“â€¦ **Duration**: ${selectedCeremonyLength}
Ã¢Å“â€¦ **Unity Ceremony**: ${selectedUnityCeremony || "None selected"}
Ã¢Å“â€¦ **Vows**: ${selectedVowsType || "Not specified"}

Based on these selections, I'll create a beautiful ceremony for ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}. Let me focus on the remaining details to perfect your script:`

      // Add specific recommendations based on style
      if (selectedCeremonyStyle === 'Traditional') {
        aiResponse += `\n\nFor your traditional ceremony, I'll include classic elements like formal processional music, traditional ring exchange, and time-honored language that creates a dignified atmosphere.`
      } else if (selectedCeremonyStyle === 'Modern') {
        aiResponse += `\n\nFor your modern ceremony, I'll incorporate contemporary elements with personalized touches, flexible structure, and current language that reflects today's relationships.`
      } else if (selectedCeremonyStyle === 'Religious') {
        aiResponse += `\n\nFor your religious ceremony, I'll include appropriate blessings, scripture readings, and faith-based elements that honor your spiritual traditions.`
      }

      const selectedService = getMrScriptServiceByResponse(selectedCeremonyStyle)
      aiResponse = `Perfect! I have the first two important details from your Quick Setup:

**Script Type**: ${selectedService.displayName}
**Duration**: ${selectedCeremonyLength}
**Tone Family**: ${selectedService.sensitivity === "grief" ? "Gentle / grief-aware" : "Warm / life ceremony"}
**Suggested Structure**: ${selectedService.scriptSections.join(", ")}

Based on this, I will keep the questions focused on the kind of ceremony you are creating.`

      if (selectedService.sensitivity === "grief") {
        aiResponse += `\n\nI will use a gentle, compassionate tone and avoid assuming religious beliefs unless you ask for them.`
      }

      if (quickSetupResponses['quick-setup-summary']) {
        aiResponse += `\n\nI also have these Quick Setup details:\n${quickSetupResponses['quick-setup-summary']}`
      }

      const activeQuestions = getActiveGuidedQuestions(quickSetupResponses)
      const nextQuestionIndex = activeQuestions.findIndex((question) =>
        !quickSetupResponses[question.id] || hasUnansweredGuidedDetails(question, quickSetupResponses)
      )

      if (nextQuestionIndex !== -1) {
        const nextQuestion = activeQuestions[nextQuestionIndex]
        aiResponse += `\n\nTo complete your script, I just need to know:\n\n${generateAIResponse(nextQuestion, quickSetupResponses)}`

        if (nextQuestion.options?.length) {
          aiResponse += `\n\nYou can choose: ${nextQuestion.options.join(", ")}.`
        }

        setCurrentQuestionIndex(nextQuestionIndex)
      } else {
        aiResponse += `\n\nI have everything I need! I'll now generate your complete ceremony script.`
        setCurrentQuestionIndex(getActiveGuidedQuestions(quickSetupResponses).length)

        // Automatically generate the script since we have all the info
        setTimeout(() => {
          generateAndSaveScript()
        }, 2000)
      }

      const responseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, responseMessage])
    }, 1000)
  }

  // Text Editor Helper Functions
  const insertTextAtCursor = (before: string, after: string) => {
    const editorElement = editorRef.current
    if (!editorElement) return

    // Save cursor position
    saveCursorPosition()

    // Focus the editor
    editorElement.focus()

    // Get current selection
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()

      // Create the new content
      const textNode = document.createTextNode(before + selectedText + after)

      // Replace the selection
      range.deleteContents()
      range.insertNode(textNode)

      // Position cursor after the inserted text
      range.setStartAfter(textNode)
      range.setEndAfter(textNode)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    // Update content
    setTimeout(() => {
      setScriptContent(editorElement.innerHTML)
    }, 10)
  }

  const applyFormatting = (command: string, value?: string) => {
    const editorElement = editorRef.current || document.getElementById('script-editor')
    if (editorElement && editorElement.contentEditable === 'true') {
      // Save cursor position before formatting
      saveCursorPosition()

      // Focus the editor first to ensure we have an active selection
      editorElement.focus()

      // Apply the formatting command
      const success = document.execCommand(command, false, value)

      // Update content after formatting
      setTimeout(() => {
        setScriptContent(editorElement.innerHTML)
        restoreCursorPosition()
      }, 10)

      return success
    }
    return false
  }

  const applyTextColor = (color: string) => {
    const editorElement = editorRef.current || document.getElementById('script-editor')
    if (!editorElement) return

    // Save cursor position before applying color
    saveCursorPosition()

    // Focus the editor first
    editorElement.focus()

    // Get the current selection
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    if (range.collapsed) {
      // No text selected, apply color for future typing
      document.execCommand('foreColor', false, color)
    } else {
      // Text is selected, apply color to selection
      const selectedText = range.extractContents()
      const span = document.createElement('span')
      span.style.color = color
      span.appendChild(selectedText)
      range.insertNode(span)

      // Clear selection and update content
      selection.removeAllRanges()
    }

    // Update content and restore cursor position
    setTimeout(() => {
      setScriptContent(editorElement.innerHTML)
      restoreCursorPosition()
    }, 10)
  }

  const increaseFontSize = () => {
    if (editorFontSize < 24) {
      setEditorFontSize(prev => prev + 2)
    }
  }

  const decreaseFontSize = () => {
    if (editorFontSize > 12) {
      setEditorFontSize(prev => prev - 2)
    }
  }

  const autoSave = async () => {
    if (editingScript) {
      // Get the current content from the editor element to ensure we have the latest formatted content
      const editorElement = editorRef.current || document.getElementById('script-editor') as HTMLDivElement
      let currentContent = scriptContent

      if (editorElement) {
        currentContent = editorElement.innerHTML
        setScriptContent(currentContent) // Update state with current editor content
      }

      if (currentContent.trim()) {
        const timestamp = new Date().toLocaleTimeString()

        // Auto-save to database
        if (coupleScripts.some(script => script.id === editingScript.id)) {
          const result = await autoSaveScriptToDB(editingScript.id, currentContent)
          if (result.ok) {
            console.log(`Auto-saved "${editingScript.title}" to database at ${timestamp}`)
            alert(`â€™Â¾ Auto-saved "${editingScript.title}" to server at ${timestamp}`)
          } else {
            console.error("Failed to auto-save to database:", result.error)
            alert(`[WARNING]Â Ã¯Â¸Â Failed to auto-save to server. Please try again.`)
          }
        } else {
          // New script - need to save first
          alert('Please save the script first before auto-saving.')
        }
      } else {
        alert('Nothing to auto-save - script is empty!')
      }
    } else {
      alert('No script selected for auto-save!')
    }
  }

  // Cursor position management
  const saveCursorPosition = () => {
    const selection = window.getSelection()
    const editorElement = editorRef.current

    if (selection && selection.rangeCount > 0 && editorElement) {
      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(editorElement)
      preCaretRange.setEnd(range.startContainer, range.startOffset)
      const start = preCaretRange.toString().length

      const endRange = range.cloneRange()
      endRange.selectNodeContents(editorElement)
      endRange.setEnd(range.endContainer, range.endOffset)
      const end = endRange.toString().length

      cursorPositionRef.current = { start, end }
    }
  }

  const restoreCursorPosition = () => {
    if (!cursorPositionRef.current || !editorRef.current) return

    const { start, end } = cursorPositionRef.current
    const editorElement = editorRef.current

    try {
      const walker = document.createTreeWalker(
        editorElement,
        NodeFilter.SHOW_TEXT,
        null
      )

      let currentPos = 0
      let startNode: Node | null = null
      let endNode: Node | null = null
      let startOffset = 0
      let endOffset = 0

      let node = walker.nextNode()
      while (node) {
        const textLength = node.textContent?.length || 0

        if (!startNode && currentPos + textLength >= start) {
          startNode = node
          startOffset = start - currentPos
        }

        if (!endNode && currentPos + textLength >= end) {
          endNode = node
          endOffset = end - currentPos
          break
        }

        currentPos += textLength
        node = walker.nextNode()
      }

      if (startNode && endNode) {
        const selection = window.getSelection()
        const range = document.createRange()
        range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0))
        range.setEnd(endNode, Math.min(endOffset, endNode.textContent?.length || 0))

        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    } catch (error) {
      console.log('Could not restore cursor position:', error)
    }
  }

  // Script Management Functions
  const handleEditScript = (script: any) => {
    setEditingScript(script)

    // Load content from the script object (which comes from database)
    let content = script.content || ''

    // Preserve content exactly as saved - no processing to maintain formatting
    // Only convert plain text line breaks if the content has NO HTML tags at all
    if (typeof content === 'string' && !content.includes('<') && !content.includes('>') && content.includes('\n')) {
      content = content.replace(/\n/g, '<br>')
    }

    // Ensure content is a string
    if (!content || typeof content !== 'string') {
      content = ''
    }

    setScriptContent(content)
    setEditorFontSize(16) // Reset font size

    // Show notification and debug info
    console.log('handleEditScript - Loading content for:', script.title)
    console.log('Content loaded from database:', {
      scriptId: script.id,
      contentLength: content?.length || 0,
      preview: content?.substring(0, 100) + (content?.length > 100 ? '...' : '')
    })

    if (script.content) {
      console.log('Loading content for script:', script.title)
    }

    // Open the dedicated script editor dialog and keep the editor tab in sync.
    setShowScriptEditorDialog(true)
    setScriptBuilderTab('editor')
  }

  const handleViewScript = (script: any) => {
    setViewingScript(script)
    setShowScriptViewerDialog(true)
  }

  const handleDownloadScript = (script: any) => {
    // Create a clean text version of the script content
    const cleanContent = script.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()

    // Create the full script with header
    const scriptText = `${script.title}\n${'-'.repeat(script.title.length)}\n\nStyle: ${script.type}\nCreated: ${script.createdDate || script.lastModified}\n\n${cleanContent}`

    // Create a blob and download
    const blob = new Blob([scriptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${script.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('Downloaded script:', script.title)
  }

  const handleDeleteScript = async (script: any) => {
    const isDbScript = coupleScripts.some((savedScript) => String(savedScript.id) === String(script.id))

    if (isDbScript) {
      // Delete from database
      const result = await deleteScriptFromDB(script.id)
      if (result.ok) {
        setCoupleScripts(prev => prev.filter(s => String(s.id) !== String(script.id)))
        setGeneratedScripts(prev => prev.filter(s => String(s.id) !== String(script.id)))
        console.log('Ã¢Å“â€¦ Script deleted from database:', script.title)
      } else {
        console.error('Ã¢ÂÅ’ Failed to delete script:', result.error)
        alert(`Failed to delete script: ${result.error}`)
      }
    } else {
      // Remove from generated scripts (local state only)
      setGeneratedScripts(prev => prev.filter(s => String(s.id) !== String(script.id)))
      console.log('Ã¢Å“â€¦ Generated script removed:', script.title)
    }
  }

  const handleRecordPayment = async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("Cannot record payment: No user or couple selected")
      return
    }

    const amount = parseFloat(newPayment.amount)

    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    const isRefund = newPayment.kind === "refund"

    if (!isRefund && paymentInfo.balance > 0 && amount > paymentInfo.balance) {
      alert(`Payment amount (${amount}) cannot exceed balance due (${paymentInfo.balance})`)
      return
    }

    if (isRefund && amount > paymentInfo.depositPaid) {
      alert(`Refund amount (${amount}) cannot exceed total paid (${paymentInfo.depositPaid})`)
      return
    }

    const refundFeeAmount = isRefund ? roundCurrency(amount * REFUND_FEE_RATE) : 0
    const totalOfficiantCharge = isRefund ? roundCurrency(amount + refundFeeAmount) : 0

    console.log("Recording payment for couple:", editCoupleInfo.id)

    const result = await addPaymentToDB(currentUser.id, editCoupleInfo.id, {
      description: isRefund
        ? `Refund - ${newPayment.notes || "Manual refund"} | Officiant refund fee: $${refundFeeAmount.toFixed(2)} | Total officiant charge: $${totalOfficiantCharge.toFixed(2)}`
        : amount === paymentInfo.balance ? "Final Payment" : "Partial Payment",
      amount: amount,
      paymentType: isRefund ? "refund" : newPayment.method,
      status: "paid",
      dueDate: newPayment.date,
      refundFeeRate: isRefund ? REFUND_FEE_RATE : undefined,
      refundFeeAmount: isRefund ? refundFeeAmount : undefined,
      totalOfficiantCharge: isRefund ? totalOfficiantCharge : undefined,
    })

    if (result.ok && result.data) {
      const payment = {
        id: result.data.id,
        date: new Date(newPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        amount: amount,
        type: isRefund ? "Refund" : amount === paymentInfo.balance ? "Final Payment" : "Partial Payment",
        method: newPayment.method,
        status: isRefund ? "refunded" : "paid",
        notes: newPayment.notes,
        refundFeeRate: isRefund ? REFUND_FEE_RATE : undefined,
        refundFee: isRefund ? refundFeeAmount : undefined,
        totalOfficiantCharge: isRefund ? totalOfficiantCharge : undefined,
      }

      setPaymentHistory(prev => [...prev, payment])

      const newDepositPaid = isRefund ? Math.max(0, paymentInfo.depositPaid - amount) : paymentInfo.depositPaid + amount
      const newBalance = isRefund ? paymentInfo.balance + amount : Math.max(0, paymentInfo.balance - amount)
      const newRefundFeesCharged = isRefund
        ? roundCurrency((paymentInfo.refundFeesCharged || 0) + refundFeeAmount)
        : paymentInfo.refundFeesCharged || 0

      setPaymentInfo(prev => ({
        ...prev,
        depositPaid: newDepositPaid,
        balance: newBalance,
        refundFeesCharged: newRefundFeesCharged,
        paymentStatus: newBalance === 0 ? "paid_in_full" : prev.paymentStatus
      }))

      setNewPayment({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        method: "Credit Card",
        notes: "",
        kind: "payment"
      })
      setShowRecordPaymentDialog(false)
      loadFinancialPaymentsForUser()

      console.log("Payment recorded:", payment)
      if (isRefund) {
        alert(`Refund of ${amount} recorded successfully.\n\nOfficiant refund fee (5%): ${refundFeeAmount.toFixed(2)}\nTotal officiant charge: ${totalOfficiantCharge.toFixed(2)}\nNew balance due: ${newBalance}`)
      } else if (newBalance === 0) {
        alert("Payment recorded successfully! This ceremony is now PAID IN FULL! [CELEBRATE]")
      } else {
        alert(`Payment of ${amount} recorded successfully!\n\nRemaining balance: ${newBalance}`)
      }
    } else {
      console.error("Failed to record payment:", result.error)
      alert("Failed to record payment. Please try again.")
    }
  }
  const handleUploadScript = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingScript(true)

    try {
      let text = ''
      const fileExtension = file.name.split('.').pop()?.toLowerCase()

      // Handle different file types
      if (fileExtension === 'docx') {
        // Use mammoth to extract text from Word documents
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
      } else if (fileExtension === 'txt') {
        // Read plain text files
        text = await file.text()
      } else {
        // Unsupported file type
        setUploadingScript(false)
        alert(`Unsupported file type: .${fileExtension}\n\nPlease upload a .docx or .txt file.`)
        e.target.value = ''
        return
      }

      // Personalize the script with current couple's names
      let personalizedScript = text

      // Get current couple names
      const bride1FirstName = getFirstName(editCoupleInfo?.brideName)
      const groom1FirstName = getFirstName(editCoupleInfo?.groomName)

      // Common placeholder patterns to replace
      const placeholders = [
        // Full names
        { pattern: /\[Bride(?:'s)? (?:Full )?Name\]/gi, replacement: editCoupleInfo?.brideName || 'Partner 1' },
        { pattern: /\[Groom(?:'s)? (?:Full )?Name\]/gi, replacement: editCoupleInfo?.groomName || 'Partner 2' },
        { pattern: /\[Partner 1(?:'s)? Name\]/gi, replacement: editCoupleInfo?.brideName || 'Partner 1' },
        { pattern: /\[Partner 2(?:'s)? Name\]/gi, replacement: editCoupleInfo?.groomName || 'Partner 2' },
        { pattern: /\{Bride(?:'s)? Name\}/gi, replacement: editCoupleInfo?.brideName || 'Partner 1' },
        { pattern: /\{Groom(?:'s)? Name\}/gi, replacement: editCoupleInfo?.groomName || 'Partner 2' },

        // First names only
        { pattern: /\[Bride(?:'s)? First Name\]/gi, replacement: bride1FirstName },
        { pattern: /\[Groom(?:'s)? First Name\]/gi, replacement: groom1FirstName },
        { pattern: /\{Bride First Name\}/gi, replacement: bride1FirstName },
        { pattern: /\{Groom First Name\}/gi, replacement: groom1FirstName },

        // Generic placeholders
        { pattern: /BRIDE_NAME/g, replacement: editCoupleInfo?.brideName || 'Partner 1' },
        { pattern: /GROOM_NAME/g, replacement: editCoupleInfo?.groomName || 'Partner 2' },
        { pattern: /PARTNER_1/g, replacement: editCoupleInfo?.brideName || 'Partner 1' },
        { pattern: /PARTNER_2/g, replacement: editCoupleInfo?.groomName || 'Partner 2' },

        // Wedding details
        { pattern: /\[Venue Name\]/gi, replacement: editWeddingDetails.venueName },
        { pattern: /\[Wedding Date\]/gi, replacement: new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
        { pattern: /\{Venue\}/gi, replacement: editWeddingDetails.venueName },
        { pattern: /\{Date\}/gi, replacement: new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      ]

      placeholders.forEach(({ pattern, replacement }) => {
        personalizedScript = personalizedScript.replace(pattern, replacement)
      })

      // Create a new script from the uploaded document
      const newScript = {
        id: Date.now(),
        coupleId: editCoupleInfo?.id,
        title: `Imported Script - ${getFirstName(editCoupleInfo?.brideName)} & ${getFirstName(editCoupleInfo?.groomName)}`,
        type: 'Custom',
        content: personalizedScript,
        createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: 'completed'
      }

      const savedScript = await saveGeneratedScriptDraft({
        ...newScript,
        description: "Imported and personalized by Mr. Script"
      })
      const scriptForEditor = savedScript || newScript
      setGeneratedScripts(prev => [
        scriptForEditor,
        ...prev.filter(script => String(script.id) !== String(scriptForEditor.id))
      ])

      // Add AI message confirming the upload
      const confirmMessage = {
        id: aiChatMessages.length + 1,
        role: 'assistant',
        content: `I've successfully imported your ${fileExtension?.toUpperCase()} script and personalized it for ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}!

The script has been added to your Generated Scripts. I've automatically replaced all placeholder names with the couple's actual names.

You can now:
* View and edit the script
* Ask me to make specific changes
* Refine any section you'd like

What would you like me to help you with in this script?`,
        timestamp: new Date().toLocaleTimeString()
      }

      setAiChatMessages(prev => [...prev, confirmMessage])
      setUploadingScript(false)

      // Reset file input
      e.target.value = ''

      // Auto-switch to Script Editor tab and load the script
      setEditingScript(scriptForEditor)
      const htmlContent = personalizedScript.replace(/\n/g, '<br>')
      setScriptContent(htmlContent)
      setEditorFontSize(16)
      setScriptBuilderTab('editor')

      alert(`Script imported successfully!\n\nPersonalized for: ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}\n\nThe script is now open in the Script Editor tab.`)
    } catch (error) {
      setUploadingScript(false)
      console.error('Error reading file:', error)
      alert("Error reading file. Please make sure it's a valid .docx or .txt file and try again.")
      e.target.value = ''
    }
  }

  const handleCreateNewScript = () => {
    // Create a new script object with placeholder data
    const newScript = {
      id: Date.now(), // Simple ID generation
      title: `New Script Draft ${new Date().toLocaleDateString()}`,
      content: '', // Start with empty content
      lastModified: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      status: 'Draft',
      type: 'Traditional',
      estimatedTime: '15-20 min'
    }

    // Set this as the editing script
    setEditingScript(newScript)
    setScriptContent('') // Start with empty content
    setEditorFontSize(16)

    console.log('Creating new script:', newScript.title)

    // Open the script editor dialog
    setShowScriptEditorDialog(true)
  }

  const handleShareScript = (script: any) => {
    setSharingScript(script)
    // Pre-select the script that was clicked
    setSelectedItemsToShare({
      scripts: [script.id],
      files: []
    })
    setShareScriptForm({
      to: 'both',
      customEmail: '',
      subject: `Wedding Script: ${script.title}`,
      body: `Dear ${getFirstName(editCoupleInfo?.brideName)} and ${getFirstName(editCoupleInfo?.groomName)},

I've prepared your ceremony script "${script.title}" for your review. Please take a look and let me know if you have any questions or would like any changes.

This script has been personalized for your wedding on ${new Date(editWeddingDetails.weddingDate).toLocaleDateString()} at ${editWeddingDetails.venueName}.

Looking forward to your feedback!

Best regards,
${officiantLabel}`,
      includeNotes: true
    })
    setShowShareScriptDialog(true)
  }

  const handleSaveScript = async () => {
    if (!editingScript || !currentUser?.id) return

    // Check if this is a new script or existing script (before any updates)
    const existingDbScript = coupleScripts.find(script => String(script.id) === String(editingScript.id))
    const isNewScript = !existingDbScript

    // Get the current content from the editor element to ensure we have the latest formatted content
    const editorElement = editorRef.current || document.getElementById('script-editor') as HTMLDivElement
    let currentContent = scriptContent

    console.log('Save Script Debug:', {
      isNewScript,
      editingScriptId: editingScript.id,
        existingScripts: coupleScripts.map(s => s.id),
        existingDbScriptFound: !!existingDbScript,
      editorFound: !!editorElement
    })

    if (editorElement) {
      currentContent = editorElement.innerHTML
      console.log('Content from editor element:', {
        length: currentContent.length,
        preview: currentContent.substring(0, 100) + '...',
        isEmpty: currentContent.trim() === ''
      })
      setScriptContent(currentContent) // Update state with current editor content
    } else {
      console.error('Editor element not found during save!')
    }

    // Keep HTML formatting when saving to preserve bold, italic, colors, etc.
    const plainTextContent = currentContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()

    console.log('Save validation:', {
      htmlLength: currentContent.length,
      plainTextLength: plainTextContent.length,
      preview: plainTextContent.substring(0, 50) + '...'
    })

    // Character validation
    const MIN_CHARACTERS = 50
    const MAX_CHARACTERS = 50000 // Increased for database storage

    if (plainTextContent.length < MIN_CHARACTERS) {
      alert(`Ã¢ÂÅ’ Script must be at least ${MIN_CHARACTERS} characters long.\n\nCurrent length: ${plainTextContent.length} characters\nPlease add more content before saving.`)
      return
    }

    if (plainTextContent.length > MAX_CHARACTERS) {
      alert(`Ã¢ÂÅ’ Script cannot exceed ${MAX_CHARACTERS} characters.\n\nCurrent length: ${plainTextContent.length} characters\nPlease reduce the content before saving.`)
      return
    }

    // Get the current date for last modified
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    setScriptVersionHistory(prev => [{
      id: `${editingScript.id || "draft"}-${Date.now()}`,
      title: editingScript.title || `Script ${currentDate}`,
      savedAt: new Date().toLocaleString(),
      wordCount: plainTextContent.split(/\s+/).filter(Boolean).length
    }, ...prev].slice(0, 8))

    try {
      if (isNewScript) {
        // Create new script in database
        const result = await addScriptToDB(currentUser.id, {
          title: editingScript.title || `New Script ${currentDate}`,
          type: editingScript.type || 'Traditional',
          status: 'Latest Draft',
          content: currentContent,
          description: editingScript.description || '',
          coupleId: editCoupleInfo?.id || null
        })

        if (result.ok && result.data) {
          // Add to local state with database ID
          const newScript = {
            ...transformScriptRecord(result.data),
            lastModified: currentDate
          }
          setCoupleScripts(prevScripts => [
            newScript,
            ...prevScripts.filter(script => String(script.id) !== String(newScript.id))
          ])
          setGeneratedScripts(prevScripts => prevScripts.filter(script => String(script.id) !== String(editingScript.id)))
          console.log('Ã¢Å“â€¦ New script created in database:', result.data.id)
          alert(`Ã¢Å“â€¦ Script "${editingScript.title}" created successfully!\n\nSaved to server on: ${currentDate}\nContent: ${plainTextContent.length} characters`)
        } else {
          throw new Error(result.error || 'Failed to create script')
        }
      } else {
        // Update existing script in database
        const result = await updateScriptInDB(editingScript.id, {
          content: currentContent,
          status: 'Latest Draft'
        })

        if (result.ok) {
          // Update local state
          setCoupleScripts(prevScripts =>
            prevScripts.map(script =>
              String(script.id) === String(editingScript.id)
                ? {
                    ...script,
                    content: currentContent,
                    lastModified: currentDate,
                    status: 'Latest Draft'
                  }
                : script
            )
          )
          console.log('Ã¢Å“â€¦ Script updated in database:', editingScript.id)
          alert(`Ã¢Å“â€¦ Script "${editingScript.title}" saved successfully!\n\nSaved to server on: ${currentDate}\nContent: ${plainTextContent.length} characters`)
        } else {
          throw new Error(result.error || 'Failed to update script')
        }
      }

      setShowScriptEditorDialog(false)
      setEditingScript(null)
      setScriptContent("")
      setEditorFontSize(16)
    } catch (err: any) {
      console.error('Ã¢ÂÅ’ Error saving script:', err)
      alert(`[WARNING]Â Ã¯Â¸Â Failed to save script to server.\n\nError: ${err.message}\n\nPlease try again.`)
    }
  }

  const handleSendScript = async () => {
    // Validate that at least one item is selected
    if (selectedItemsToShare.scripts.length === 0 && selectedItemsToShare.files.length === 0) {
      alert('Please select at least one script or file to share.')
      return
    }

    // Limit to 5 total items
    const totalSelected = selectedItemsToShare.scripts.length + selectedItemsToShare.files.length
    if (totalSelected > 5) {
      alert('You can only share up to 5 items at a time. Please deselect some items.')
      return
    }

    const recipient = shareScriptForm.to === 'both'
      ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
      : shareScriptForm.to === 'bride'
      ? editCoupleInfo.brideEmail
      : shareScriptForm.to === 'groom'
      ? editCoupleInfo.groomEmail
      : shareScriptForm.customEmail

    if (!recipient.trim()) {
      alert('Please select a recipient or enter an email address.')
      return
    }

    if (!shareScriptForm.subject.trim()) {
      alert('Please enter a subject.')
      return
    }

    if (!shareScriptForm.body.trim()) {
      alert('Please enter a message body.')
      return
    }

    // Collect all selected scripts (both saved and generated)
    const allScripts = [...coupleScripts, ...generatedScripts]
    const selectedScripts = allScripts.filter(script =>
      selectedItemsToShare.scripts.includes(script.id)
    )

    // Collect selected files
    const selectedFiles = files.filter(file =>
      selectedItemsToShare.files.includes(file.id)
    )

    // Create attachments for scripts - these have text content
    const scriptAttachments: UploadedFile[] = selectedScripts.map(script => ({
      id: `script_${script.id}_${Date.now()}`,
      file: new File([script.content], `${script.title}.txt`, { type: 'text/plain' }),
      name: `${script.title}.txt`,
      size: script.content.length,
      type: 'text/plain',
      url: '#',
      uploadProgress: 100,
      status: 'completed' as const,
      textContent: script.content  // Store content directly for email attachments
    }))

    // Fetch file content from Supabase storage and convert to base64
    const fileAttachmentsPromises = selectedFiles.map(async (file) => {
      try {
        // If the file has a Supabase storage URL, fetch it
        if (file.url && file.url.includes('supabase')) {
          const response = await fetch(file.url)
          if (response.ok) {
            const blob = await response.blob()
            // Convert to base64
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                const base64String = reader.result as string
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64Content = base64String.split(',')[1] || base64String
                resolve(base64Content)
              }
              reader.readAsDataURL(blob)
            })

            return {
              id: `file_${file.id}_${Date.now()}`,
              file: new File([], file.name, { type: file.type }),
              name: file.name,
              size: blob.size,
              type: file.type,
              url: file.url || '#',
              uploadProgress: 100,
              status: 'completed' as const,
              base64Content: base64  // Store base64 content for email attachments
            } as UploadedFile
          }
        }

        // Fallback: return file info without content (will be listed but not attached)
        return {
          id: `file_${file.id}_${Date.now()}`,
          file: new File([], file.name, { type: file.type }),
          name: file.name,
          size: 0,
          type: file.type,
          url: file.url || '#',
          uploadProgress: 100,
          status: 'completed' as const
        } as UploadedFile
      } catch (error) {
        console.error(`Failed to fetch file ${file.name}:`, error)
        return {
          id: `file_${file.id}_${Date.now()}`,
          file: new File([], file.name, { type: file.type }),
          name: file.name,
          size: 0,
          type: file.type,
          url: file.url || '#',
          uploadProgress: 100,
          status: 'completed' as const
        } as UploadedFile
      }
    })

    const fileAttachments = await Promise.all(fileAttachmentsPromises)

    // Combine script attachments with file attachments
    const allAttachments = [...scriptAttachments, ...fileAttachments]

    // Build message details
    const scriptsList = selectedScripts.map(s => `* ${s.title} (${s.type})`).join('\n')
    const filesList = selectedFiles.map(f => `* ${f.name} (${f.size})`).join('\n')

    let itemsDescription = ''
    if (selectedScripts.length > 0) {
      itemsDescription += `[SCRIPTS] (${selectedScripts.length}):\n${scriptsList}\n\n`
    }
    if (selectedFiles.length > 0) {
      itemsDescription += `[FILES] (${selectedFiles.length}):\n${filesList}\n\n`
    }

    const sharedMessage = `[SHARED] Wedding Documents

For: ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}
Sent to: ${recipient}

${itemsDescription}
${shareScriptForm.body}`

    // Add to messaging platform
    setMessageAttachments(allAttachments)
    setNewMessage(sharedMessage)
    setShowAttachments(true)

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage(sharedMessage, allAttachments)
    }, 100)

    // Close dialog and reset form
    setShowShareScriptDialog(false)
    setSharingScript(null)
    setSelectedItemsToShare({ scripts: [], files: [] })
    setShareScriptForm({
      to: 'both',
      customEmail: '',
      subject: '',
      body: '',
      includeNotes: true
    })

    const totalItems = selectedScripts.length + selectedFiles.length
    console.log(`Shared ${totalItems} item(s) to: ${recipient}`)
    // Removed popup - success logged to console
  }

  const handleContractAction = async (contractId: number, action: string) => {
    const contract = contracts.find(c => c.id === contractId)
    if (!contract) return

    switch (action) {
      case 'edit':
        setEditingContractForUpload(contract)
        setShowContractUploadDialog(true)
        break
      case 'view':
        console.log(`Viewing contract:`, contract.name)
        setViewingContract(contract)
        setShowContractViewerDialog(true)
        break
      case 'delete':
        if (confirm(`Are you sure you want to delete "${contract.name}"? This action cannot be undone.`)) {
          const deleteResult = await deleteContractFromDB(contractId)
          if (!deleteResult.ok) {
            alert(`Failed to delete contract: ${deleteResult.error}`)
            return
          }

          const storagePath = deriveContractStoragePath(contract.fileUrl || contract.file?.url)
          if (storagePath) {
            const { error: storageError } = await supabase.storage.from("contracts").remove([storagePath])
            if (storageError) {
              console.error("Failed to delete contract file from storage:", storageError)
            }
          }

          setContracts(prev => prev.filter(c => c.id !== contractId))
          console.log('Deleted contract:', contract.name)
        }
        break
      case 'send':
        // Open send contract dialog
        setSendingContract(contract)
        setEmailForm({
          to: '',
          customEmail: '',
          subject: "Contract for Signature",
          body: `Hi,\n\nThank you for trusting me with your ceremony. Please review and sign the contract using the secure link from BoldSign.\n\nIf anything looks incorrect or you have questions before signing, reply to this message and I will be happy to help.\n\nThank you,\n${officiantLabel}`
        })
        setShowSendContractDialog(true)
        console.log('Opening send dialog for contract:', contract.name)
        break
    }
  }

  const handleContractUpdated = async (
    contractId: number,
    contractData: Omit<Contract, "id" | "createdDate"> & { templateContent?: string }
  ) => {
    const existingContract = contracts.find(c => c.id === contractId)
    if (!existingContract) {
      return { ok: false, error: "Contract not found." }
    }

    let nextFileUrl = contractData.fileUrl || existingContract.fileUrl || existingContract.file?.url || ""
    let nextFileType = contractData.fileType || existingContract.fileType || existingContract.file?.type || "application/octet-stream"
    let nextFileSize = contractData.fileSize || existingContract.fileSize || existingContract.file?.size || 0
    const templateContent = contractData.templateContent?.trim()

    try {
      if (templateContent && currentUser?.id && editCoupleInfo?.id) {
        const safeName = (contractData.name || existingContract.name || "contract")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase() || "contract"
        const textBlob = new Blob([contractData.templateContent || ""], { type: "text/plain;charset=utf-8" })
        const filePath = `${currentUser.id}/${editCoupleInfo.id}/${safeName}-draft-${Date.now()}.txt`

        const { error: uploadError } = await supabase.storage
          .from("contracts")
          .upload(filePath, textBlob, {
            contentType: "text/plain;charset=utf-8",
            upsert: true,
          })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from("contracts")
          .getPublicUrl(filePath)

        nextFileUrl = publicUrlData.publicUrl
        nextFileType = "text/plain"
        nextFileSize = textBlob.size
      }

      const updateResult = await updateContractInDB(contractId, {
        name: contractData.name,
        description: contractData.description || null,
        type: contractData.type || "Custom Contract",
        expiry_date: contractData.expiryDate || null,
        status: contractData.status || "draft",
        file_url: nextFileUrl || null,
        file_type: nextFileType || null,
        file_size: nextFileSize || null,
      } as any)

      if (!updateResult.ok) {
        return { ok: false, error: updateResult.error || "Unable to update this contract." }
      }

      setContracts(prev => prev.map(contract => {
        if (contract.id !== contractId) return contract

        return {
          ...contract,
          name: contractData.name,
          description: contractData.description || "",
          type: contractData.type || "Custom Contract",
          expiryDate: contractData.expiryDate || "",
          status: contractData.status || "draft",
          fileUrl: nextFileUrl,
          fileType: nextFileType,
          fileSize: nextFileSize,
          file: {
            ...(contract.file || {}),
            id: contract.file?.id || `contract-file-${contractId}`,
            file: contract.file?.file || new File([], contractData.name, { type: nextFileType }),
            name: contractData.name,
            size: nextFileSize,
            type: nextFileType,
            url: nextFileUrl,
            uploadProgress: 100,
            status: "completed" as const,
          },
        }
      }))
      setEditingContractForUpload(null)
      setShowContractUploadDialog(false)
      return { ok: true }
    } catch (error) {
      console.error("Failed to update contract:", error)
      return { ok: false, error: error instanceof Error ? error.message : "Unable to update this contract." }
    }
  }

  // Handle sending contract email
  const handleSendContractEmail = () => {
    if (!sendingContract) return

    const recipient = emailForm.to || emailForm.customEmail
    if (!recipient.trim()) {
      alert('Please select a recipient or enter an email address.')
      return
    }

    if (!emailForm.subject.trim()) {
      alert('Please enter a subject.')
      return
    }

    if (!emailForm.body.trim()) {
      alert('Please enter a message body.')
      return
    }

    // Create contract attachment for messaging
    const contractAttachment: UploadedFile = {
      id: `contract_${sendingContract.id}_${Date.now()}`,
      file: new File(['contract content'], sendingContract.name + '.pdf', { type: 'application/pdf' }),
      name: sendingContract.name + '.pdf',
      size: 2048576, // 2MB simulated size
      type: 'application/pdf',
      url: '#',
      uploadProgress: 100,
      status: 'completed'
    }

    const contractMessage = `[SCRIPT]Â§ Email sent to: ${recipient}\n[SCRIPT]â€ž Subject: ${emailForm.subject}\n\n${emailForm.body}`

    // Add to messaging platform
    setMessageAttachments([contractAttachment])
    setNewMessage(contractMessage)
    setShowAttachments(true)

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage(contractMessage, [contractAttachment])
      // Update contract status to sent
      setContracts(prev => prev.map(c =>
        c.id === sendingContract.id
          ? { ...c, status: 'pending', sentDate: new Date().toLocaleDateString() } as any
          : c
      ))
    }, 100)

    // Close dialog and reset form
    setShowSendContractDialog(false)
    setSendingContract(null)
    setEmailForm({
      to: '',
      customEmail: '',
      subject: '',
      body: ''
    })

    console.log(`Contract "${sendingContract.name}" sent to: ${recipient}`)
  }

  const readScriptUploadFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'docx') {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    }

    if (fileExtension === 'txt') {
      return file.text()
    }

    throw new Error(`Unsupported file type: .${fileExtension}. Please upload a .docx or .txt file.`)
  }

  type MarketplaceScriptDetails = {
    price: number
    languages: string[]
    categories: string[]
    ceremonyTypes: string[]
    visibility: "main_marketplace" | "store_only"
  }

  const openSubscriptionPage = () => {
    setDashboardInitialView("settings")
    setShowDashboardDialog(true)
  }

  const handleUploadMarketplaceScript = async (file: File, details: MarketplaceScriptDetails) => {
    if (!file || !currentUser?.id) return

    try {
      const canSell = await userHasActiveSellerSubscription(currentUser.id)
      if (!canSell) {
        alert("An active Aspirant or Professional subscription is required to sell scripts in the marketplace.")
        openSubscriptionPage()
        return
      }

      const content = await readScriptUploadFile(file)
      const title = file.name.replace(/\.(docx|txt)$/i, '')
      const price = Math.max(0, Number(details.price || 0))
      const primaryCeremonyType = details.ceremonyTypes[0] || "Other"
      const visibility = details.visibility || "main_marketplace"

      if (visibility === "main_marketplace") {
        const mainMarketplaceCount = await getMainMarketplaceScriptCount(currentUser.id)
        if (mainMarketplaceCount === null) {
          alert("Unable to verify your marketplace script count. Please try again.")
          return
        }

        if (mainMarketplaceCount >= MAIN_MARKETPLACE_SCRIPT_LIMIT) {
          alert("You have reached the maximum of 10 scripts allowed in the main marketplace. Remove one from the marketplace or publish this script to your store only.")
          return
        }
      }

      const result = await addScriptToDB(currentUser.id, {
        title,
        type: primaryCeremonyType,
        status: visibility === "main_marketplace" ? "Published" : "Store Listing",
        content,
        description: content.slice(0, 220),
        coupleId: null,
        isPublished: true,
        price,
        marketplaceLanguages: details.languages,
        marketplaceCategories: details.categories,
        marketplaceCeremonyTypes: details.ceremonyTypes,
        marketplaceVisibility: visibility,
      })

      if (!result.ok || !result.data) {
        alert(`Failed to publish script: ${result.error || "Please try again."}`)
        return
      }

      const marketplaceUrl = `${marketplaceBaseUrl}/scripts/${result.data.id}`
      await updateScriptInDB(result.data.id, { marketplace_url: marketplaceUrl })

      const publishedScript = {
        id: result.data.id,
        title: result.data.title,
        type: result.data.type,
        status: result.data.status,
        content: result.data.content,
        description: result.data.description || '',
        lastModified: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        coupleId: null,
        isPublished: true,
        marketplaceVisibility: visibility,
        price,
        sales: 0,
        earnings: 0,
        rating: 0,
        marketplaceLanguages: details.languages,
        marketplaceCategories: details.categories,
        marketplaceCeremonyTypes: details.ceremonyTypes,
        marketplaceUrl,
      }

      setCoupleScripts(prev => [publishedScript, ...prev])
    } catch (error) {
      console.error("Failed to upload marketplace script:", error)
      alert(error instanceof Error ? error.message : "Failed to upload marketplace script.")
    }
  }

  const handlePublishScriptToMarketplace = async (script: any, details: MarketplaceScriptDetails) => {
    if (typeof script.id !== 'number') {
      alert("Please save this script before publishing it to the marketplace.")
      return
    }

    if (!currentUser?.id) return

    const canSell = await userHasActiveSellerSubscription(currentUser.id)
    if (!canSell) {
      alert("An active Aspirant or Professional subscription is required to sell scripts in the marketplace.")
      openSubscriptionPage()
      return
    }

    const price = Math.max(0, Number(details.price || 0))
    const primaryCeremonyType = details.ceremonyTypes[0] || script.type || "Other"
    const visibility = details.visibility || "main_marketplace"
    const marketplaceUrl = `${marketplaceBaseUrl}/scripts/${script.id}`

    if (visibility === "main_marketplace") {
      const mainMarketplaceCount = await getMainMarketplaceScriptCount(currentUser.id, script.id)
      if (mainMarketplaceCount === null) {
        alert("Unable to verify your marketplace script count. Please try again.")
        return
      }

      if (mainMarketplaceCount >= MAIN_MARKETPLACE_SCRIPT_LIMIT) {
        alert("You have reached the maximum of 10 scripts allowed in the main marketplace. Remove one from the marketplace or publish this script to your store only.")
        return
      }
    }

    const result = await updateScriptInDB(script.id, {
      is_published: true,
      price,
      status: visibility === "main_marketplace" ? "Published" : "Store Listing",
      type: primaryCeremonyType,
      marketplace_languages: details.languages,
      marketplace_categories: details.categories,
      marketplace_ceremony_types: details.ceremonyTypes,
      marketplace_visibility: visibility,
      marketplace_published_at: new Date().toISOString(),
      marketplace_url: marketplaceUrl,
    } as any)

    if (!result.ok) {
      alert(`Failed to publish script: ${result.error}`)
      return
    }

    setCoupleScripts(prev => prev.map(item =>
      item.id === script.id
        ? {
            ...item,
            isPublished: true,
            price,
            status: visibility === "main_marketplace" ? "Published" : "Store Listing",
            type: primaryCeremonyType,
            marketplaceLanguages: details.languages,
            marketplaceCategories: details.categories,
            marketplaceCeremonyTypes: details.ceremonyTypes,
            marketplaceVisibility: visibility,
            marketplacePublishedAt: new Date().toISOString(),
            marketplaceUrl,
          }
        : item
    ))
  }

  const handleUnpublishScriptFromMarketplace = async (script: any) => {
    if (typeof script.id !== 'number') return

    if (!confirm(`Remove "${script.title}" from the public marketplace? The script will stay in your library as a draft.`)) {
      return
    }

    const result = await updateScriptInDB(script.id, {
      is_published: false,
      status: "Marketplace Draft",
    } as any)

    if (!result.ok) {
      alert(`Failed to unpublish script: ${result.error}`)
      return
    }

    setCoupleScripts(prev => prev.map(item =>
      item.id === script.id ? { ...item, isPublished: false, status: "Marketplace Draft" } : item
    ))
  }

  const handleViewMarketplaceScript = (script: any) => {
    if (!script.isPublished) {
      handleViewScript(script)
      return
    }

    if (script.marketplaceVisibility === "store_only" && currentUser?.id) {
      window.open(`${marketplaceBaseUrl}/store/${currentUser.id}`, "_blank", "noopener,noreferrer")
      return
    }

    window.open(script.marketplaceUrl || `${marketplaceBaseUrl}/scripts/${script.id}`, "_blank", "noopener,noreferrer")
  }

  const getCurrentCoupleRecipientEmails = () => {
    const activeCouple = allCouples[activeCoupleIndex]
    const matchingCouple = editCoupleInfo?.id
      ? allCouples.find((couple: any) => String(couple.id) === String(editCoupleInfo.id))
      : null
    const source = {
      ...activeCouple,
      ...matchingCouple,
      ...editCoupleInfo,
    }

    return [
      source?.brideEmail,
      source?.groomEmail,
      source?.bride_email,
      source?.groom_email,
      source?.primaryEmail,
      source?.secondaryEmail,
      source?.email,
    ]
      .map((email) => String(email || "").trim())
      .filter(Boolean)
      .filter((email, index, all) => all.indexOf(email) === index)
  }

  const getContractEmailRecipients = () => {
    if (emailForm.to === "both") {
      return getCurrentCoupleRecipientEmails()
    }

    if (emailForm.to) {
      return [emailForm.to]
    }

    const customEmail = emailForm.customEmail.trim()
    return customEmail && customEmail !== "custom" ? [customEmail] : []
  }

  const buildContractMergeValues = () => {
    const brideName = editCoupleInfo?.brideName || ""
    const groomName = editCoupleInfo?.groomName || ""
    const coupleNames = [brideName, groomName].filter(Boolean).join(" & ")
    const coupleEmail = [editCoupleInfo?.brideEmail, editCoupleInfo?.groomEmail]
      .filter(Boolean)
      .filter((email, index, all) => all.indexOf(email) === index)
      .join(", ")
    const mailingAddress = [editCoupleInfo?.brideAddress, editCoupleInfo?.groomAddress]
      .filter(Boolean)
      .filter((address, index, all) => all.indexOf(address) === index)
      .join(" / ")
    const totalAmount = paymentInfo.totalAmount || invoiceForm.total || contractPrefillDefaults.ceremonyFee || 0
    const depositAmount = paymentInfo.depositPaid || invoiceForm.depositPaid || contractPrefillDefaults.depositAmount || 0
    const balanceDue = paymentInfo.balance || invoiceForm.balanceDue || 0
    const balanceDueDate = paymentInfo.finalPaymentDue || invoiceForm.dueDate || ""
    const venueAddress = editWeddingDetails.venueAddress || editCoupleInfo?.address || ""
    const detailsAny = editWeddingDetails as any
    const defaultsAny = contractPrefillDefaults as any
    const currentType = editCoupleInfo?.ceremonyType || editCoupleInfo?.ceremonyTypeLabel || ""
    const isMinorCeremony = /(sweet|quince|quincea|coming|baby|blessing|minor|child|honoree)/i.test(currentType)
    const isMemorialCeremony = /(funeral|memorial|celebration.*life|life.*celebration|wake|remembrance)/i.test(currentType)
    const honoreeName = isMinorCeremony ? brideName : ""
    const parentGuardian1Name = isMinorCeremony ? groomName || brideName : ""
    const parentGuardian2Name = isMinorCeremony && groomName && brideName !== groomName ? brideName : ""
    const deceasedName = isMemorialCeremony ? groomName || brideName : ""
    const primaryFamilyContactName = isMemorialCeremony ? brideName || groomName : ""
    const secondaryFamilyContactName = isMemorialCeremony && groomName && brideName !== groomName ? groomName : ""
    const getFirst = (name: string) => name.trim().split(/\s+/)[0] || ""

    return {
      agreement_date: formatContractDate(new Date().toISOString()),
      officiant_business_name: officiantProfile?.business_name || officiantProfile?.company_name || officiantLabel,
      officiant_name: officiantProfile?.full_name || officiantProfile?.name || officiantName,
      officiant_phone: officiantProfile?.phone || "",
      officiant_email: officiantProfile?.email || currentUser?.email || "",
      officiant_business_address: contractPrefillDefaults.officiantAddress || [officiantProfile?.city, officiantProfile?.state].filter(Boolean).join(", "),
      couple_names: coupleNames,
      partner_1_name: brideName,
      partner_2_name: groomName,
      wedding_date: formatContractDate(editWeddingDetails.weddingDate),
      wedding_time: formatContractTime(editWeddingDetails.startTime),
      ceremony_type: editCoupleInfo?.ceremonyTypeLabel || currentType || "Wedding",
      contract_version: "OrdainedPro custom contract",
      venue_name: editWeddingDetails.venueName || "",
      venue_address: venueAddress,
      venue_city: detailsAny.venueCity || "",
      venue_state: detailsAny.venueState || "",
      venue_zip: detailsAny.venueZip || "",
      venue_contact_name: detailsAny.venueContactName || "",
      venue_contact_phone: detailsAny.venueContactPhone || "",
      planner_coordinator_name: detailsAny.plannerName || detailsAny.coordinatorName || "",
      planner_coordinator_phone: detailsAny.plannerPhone || detailsAny.coordinatorPhone || "",
      rehearsal_date: formatContractDate(detailsAny.rehearsalDate),
      rehearsal_time: formatContractTime(detailsAny.rehearsalTime),
      rehearsal_location: detailsAny.rehearsalLocation || "",
      total_fee: formatContractMoney(totalAmount),
      deposit_amount: formatContractMoney(depositAmount),
      balance_due: formatContractMoney(balanceDue),
      balance_due_date: formatContractDate(balanceDueDate),
      payment_method: invoiceForm.paymentMethods || "",
      late_fee: formatContractMoney(contractPrefillDefaults.lateFeeHalfHour),
      travel_fee: formatContractMoney(defaultsAny.travelFee),
      add_on_fees: formatContractMoney(defaultsAny.addOnFees),
      rehearsal_fee: formatContractMoney(defaultsAny.rehearsalFee),
      package_name: defaultsAny.packageName || "",
      payment_methods: invoiceForm.paymentMethods || "",
      payment_deadlines: balanceDueDate
        ? `Final balance is due by ${formatContractDate(balanceDueDate)}.`
        : "",
      cancellation_refund_terms: invoiceForm.terms || "",
      late_fee_terms: "",
      included_travel_radius: contractPrefillDefaults.includedMiles || officiantProfile?.travel_radius_miles
        ? `${contractPrefillDefaults.includedMiles || officiantProfile.travel_radius_miles} miles`
        : "",
      travel_mileage_fees: "",
      travel_origin_or_service_area: contractPrefillDefaults.officiantAddress || [officiantProfile?.city, officiantProfile?.state].filter(Boolean).join(", "),
      additional_travel_terms: "",
      special_requests_deadline: "three weeks prior to the ceremony date",
      officiant_arrival_window: "20 minutes",
      additional_mileage_rate: formatContractMoney(contractPrefillDefaults.mileageRate).replace(/^\$/, ""),
      arrival_time_before_ceremony: contractPrefillDefaults.arrivalMinutes,
      late_grace_period: contractPrefillDefaults.lateGraceMinutes,
      extra_waiting_fee: formatContractMoney(contractPrefillDefaults.lateFeeHalfHour),
      photo_video_permission_terms: "",
      attorney_review_acknowledgment: "Attorney review acknowledged by the officiant.",
      custom_contract_acknowledgment: "Custom contract responsibility acknowledged by the officiant.",
      photo_video_permission: "",
      cancellation_policy: invoiceForm.terms || "",
      refund_policy: invoiceForm.terms || "",
      special_terms: editCoupleInfo?.specialRequests || "",
      parent_guardian_1_name: parentGuardian1Name,
      parent_guardian_2_name: parentGuardian2Name,
      parent_guardian_1_phone: isMinorCeremony ? editCoupleInfo?.groomPhone || editCoupleInfo?.bridePhone || "" : "",
      parent_guardian_2_phone: isMinorCeremony ? editCoupleInfo?.bridePhone || "" : "",
      parent_guardian_1_email: isMinorCeremony ? editCoupleInfo?.groomEmail || editCoupleInfo?.brideEmail || "" : "",
      parent_guardian_2_email: isMinorCeremony ? editCoupleInfo?.brideEmail || "" : "",
      parent_guardian_1_relationship: "",
      parent_guardian_2_relationship: "",
      parent_guardian_mailing_address: mailingAddress,
      honoree_full_name: honoreeName,
      honoree_first_name: getFirst(honoreeName),
      honoree_age: editCoupleInfo?.age || editCoupleInfo?.honoreeAge || "",
      honoree_birthday: formatContractDate(editCoupleInfo?.birthday || editCoupleInfo?.honoreeBirthday),
      honoree_celebration_type: editCoupleInfo?.ceremonyTypeLabel || currentType || "",
      honoree_pronouns: editCoupleInfo?.pronouns || "",
      honoree_special_notes: editCoupleInfo?.specialRequests || "",
      deceased_full_name: deceasedName,
      deceased_first_name: getFirst(deceasedName),
      deceased_date_of_birth: formatContractDate(editCoupleInfo?.dateOfBirth || editCoupleInfo?.deceasedDateOfBirth),
      deceased_date_of_passing: formatContractDate(editCoupleInfo?.dateOfPassing || editCoupleInfo?.deceasedDateOfPassing),
      memorial_service_date: formatContractDate(editWeddingDetails.weddingDate),
      memorial_service_time: formatContractTime(editWeddingDetails.startTime),
      memorial_venue_name: editWeddingDetails.venueName || "",
      memorial_venue_address: venueAddress,
      primary_family_contact_name: primaryFamilyContactName,
      secondary_family_contact_name: secondaryFamilyContactName,
      primary_family_contact_phone: isMemorialCeremony ? editCoupleInfo?.bridePhone || editCoupleInfo?.groomPhone || "" : "",
      primary_family_contact_email: isMemorialCeremony ? editCoupleInfo?.brideEmail || editCoupleInfo?.groomEmail || "" : "",
      partner_1_signature_date: "",
      partner_1_signature: "",
      partner_2_signature_date: "",
      partner_2_signature: "",
      parent_guardian_1_signature_date: "",
      parent_guardian_1_signature: "",
      parent_guardian_2_signature_date: "",
      parent_guardian_2_signature: "",
      primary_family_contact_signature_date: "",
      primary_family_contact_signature: "",
      secondary_family_contact_signature_date: "",
      secondary_family_contact_signature: "",
      couple_email: coupleEmail,
      couple_mailing_address: mailingAddress,
      officiant_signature_date: "",
      officiant_signature: "",
      comp_name: officiantProfile?.business_name || officiantProfile?.company_name || officiantLabel,
      bride_name: brideName,
      groom_name: groomName,
      wed_date: formatContractDate(editWeddingDetails.weddingDate),
      wed_time: formatContractTime(editWeddingDetails.startTime),
      venue: editWeddingDetails.venueName || "",
      venue_addr: venueAddress,
      ceremony_fee: formatContractMoney(totalAmount).replace(/^\$/, ""),
      late_grace_minutes: contractPrefillDefaults.lateGraceMinutes,
      late_fee_half_hour: formatContractMoney(contractPrefillDefaults.lateFeeHalfHour).replace(/^\$/, ""),
      full_day_fee: formatContractMoney(contractPrefillDefaults.fullDayFee).replace(/^\$/, ""),
      included_miles: contractPrefillDefaults.includedMiles || (officiantProfile?.travel_radius_miles ? String(officiantProfile.travel_radius_miles) : ""),
      officiant_addr: contractPrefillDefaults.officiantAddress || [officiantProfile?.city, officiantProfile?.state].filter(Boolean).join(", "),
      arrival_minutes: contractPrefillDefaults.arrivalMinutes,
      rehearsal_arrival_minutes: contractPrefillDefaults.rehearsalArrivalMinutes,
      bride_phone: editCoupleInfo?.bridePhone || "",
      groom_phone: editCoupleInfo?.groomPhone || "",
      bride_email: editCoupleInfo?.brideEmail || "",
      groom_email: editCoupleInfo?.groomEmail || "",
      mailing_addr: mailingAddress,
    }
  }

  const createPersonalizedContractUrl = async (contract: any) => {
    const originalUrl = getContractFileUrl(contract)
    if (isOrdainedProDefaultContract(contract)) {
      const currentDefaultUrl = getDefaultContractUrl()
      if (originalUrl && originalUrl !== currentDefaultUrl) {
        const updateResult = await updateContractInDB(contract.id, {
          file_url: currentDefaultUrl,
          file_type: PDF_CONTRACT_FILE_TYPE,
          file_size: DEFAULT_CONTRACT_FILE_SIZE,
        } as any)

        if (!updateResult.ok) {
          console.warn("Default contract URL update failed before BoldSign send:", updateResult.error)
        } else {
          setContracts(prev => prev.map(c =>
            c.id === contract.id
              ? {
                  ...c,
                  fileUrl: currentDefaultUrl,
                  file_url: currentDefaultUrl,
                  fileType: PDF_CONTRACT_FILE_TYPE,
                  file_type: PDF_CONTRACT_FILE_TYPE,
                  fileSize: DEFAULT_CONTRACT_FILE_SIZE,
                  file_size: DEFAULT_CONTRACT_FILE_SIZE,
                  file: c.file ? { ...c.file, url: currentDefaultUrl, type: PDF_CONTRACT_FILE_TYPE, size: DEFAULT_CONTRACT_FILE_SIZE } : c.file,
                } as any
              : c
          ))
        }
      }

      return currentDefaultUrl
    }

    if (!originalUrl || !currentUser?.id || !editCoupleInfo?.id || !isTextContract(contract)) {
      return originalUrl
    }

    const response = await fetch(originalUrl)
    if (!response.ok) {
      throw new Error("Unable to load the contract template before sending.")
    }

    const templateText = await response.text()
    const personalizedText = replaceContractPlaceholders(templateText, buildContractMergeValues())
    const textBlob = new Blob([personalizedText], { type: "text/plain;charset=utf-8" })
    const safeName = (contract.name || "contract")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "contract"
    const filePath = `${currentUser.id}/${editCoupleInfo.id}/${safeName}-personalized-${Date.now()}.txt`

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, textBlob, {
        contentType: "text/plain;charset=utf-8",
        upsert: true,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(filePath)

    const personalizedUrl = publicUrlData.publicUrl
    const updateResult = await updateContractInDB(contract.id, {
      file_url: personalizedUrl,
      file_type: "text/plain",
      file_size: textBlob.size,
    } as any)

    if (!updateResult.ok) {
      throw new Error(updateResult.error || "Personalized contract was created, but the contract record was not updated.")
    }

    setContracts(prev => prev.map(c =>
      c.id === contract.id
        ? {
            ...c,
            fileUrl: personalizedUrl,
            file_url: personalizedUrl,
            fileType: "text/plain",
            file_type: "text/plain",
            fileSize: textBlob.size,
            file_size: textBlob.size,
            file: c.file
              ? {
                  ...c.file,
                  url: personalizedUrl,
                  type: "text/plain",
                  size: textBlob.size,
                }
              : c.file,
          } as any
        : c
    ))

    return personalizedUrl
  }

  const handleSendContractRealEmail = async () => {
    if (!sendingContract || isSendingContractEmail) return

    const recipients = getContractEmailRecipients()
    if (recipients.length === 0) {
      alert('Please select a recipient or enter an email address.')
      return
    }

    if (!emailForm.subject.trim()) {
      alert('Please enter a subject.')
      return
    }

    if (!emailForm.body.trim()) {
      alert('Please enter a message body.')
      return
    }

    const originalContractUrl = getContractFileUrl(sendingContract)
    if (!originalContractUrl) {
      alert("This contract does not have a document link yet.")
      return
    }

    setIsSendingContractEmail(true)

    try {
      const contractUrl = await createPersonalizedContractUrl(sendingContract)
      const isDefaultContractSend = isOrdainedProDefaultContract(sendingContract)
      const coupleSigners = [
        ...(editCoupleInfo?.brideEmail
          ? [
              {
                emailAddress: editCoupleInfo.brideEmail,
                name: editCoupleInfo?.brideName || "Partner 1",
              },
            ]
          : []),
        ...(editCoupleInfo?.groomEmail
          ? [
              {
                emailAddress: editCoupleInfo.groomEmail,
                name: editCoupleInfo?.groomName || "Partner 2",
              },
            ]
          : []),
      ]
      const signers = [
        ...coupleSigners,
        ...(officiantEmail
          ? [
              {
                emailAddress: officiantEmail,
                name: officiantName || officiantLabel || "Wedding Officiant",
              },
            ]
          : []),
      ]

      if (isDefaultContractSend && !officiantEmail) {
        alert("The default PDF contract requires the officiant email before it can be sent for signature.")
        return
      }

      console.log("BoldSign signer roles before server cleanup:", signers)

      const response = await fetch("/api/boldsign/send-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractId: sendingContract.id,
          contractName: sendingContract.name,
          contractUrl,
          coupleId: editCoupleInfo?.id,
          officiantId: currentUser?.id,
          message: emailForm.body.trim(),
          signers,
          prefillFields: buildContractMergeValues(),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        const detailMessage =
          error?.details?.message ||
          error?.details?.error?.message ||
          error?.details?.errors?.[0]?.message ||
          error?.details?.title ||
          error?.details?.raw ||
          ""
        const message = [error?.error, detailMessage].filter(Boolean).join(" ")
        throw new Error(message || "Failed to send contract with BoldSign.")
      }

      const boldSignResult = await response.json().catch(() => null)
      const boldSignDocumentId = boldSignResult?.documentId ? String(boldSignResult.documentId) : ""
      const normalizedBoldSignStatus = String(boldSignResult?.boldSignStatus || "").toLowerCase()
      const contractWasSent = ["accepted", "sent", "waiting for me", "waiting for others", "completed", "signed"].some((status) =>
        normalizedBoldSignStatus.includes(status)
      )
      console.log("BoldSign send result:", {
        documentId: boldSignDocumentId,
        status: boldSignResult?.boldSignStatus,
        details: boldSignResult?.statusCheck,
        prefillSkipped: boldSignResult?.prefillSkipped,
      })

      if (!boldSignDocumentId) {
        throw new Error("BoldSign did not return a document ID. The contract notification was not sent.")
      }

      const sentAt = new Date()
      const updateResult = await updateContractInDB(sendingContract.id, {
        status: contractWasSent ? "sent" : "pending",
      })

      if (!updateResult.ok) {
        console.error("Contract sent to BoldSign, but status update failed:", updateResult.error)
      }

      setContracts(prev => prev.map(c =>
        c.id === sendingContract.id
          ? { ...c, status: contractWasSent ? 'sent' : 'pending', sentDate: sentAt.toLocaleDateString(), boldsignDocumentId: boldSignDocumentId } as any
          : c
      ))

      const portalMessage = [
        emailForm.body.trim(),
        "",
        `BoldSign signature request created for: ${sendingContract.name}`,
        `BoldSign document ID: ${boldSignDocumentId}`,
        `Contract file: ${contractUrl}`,
        "BoldSign will send the secure signing email separately. If you do not receive it, please let me know so I can resend the signature request.",
      ].filter(Boolean).join("\n")

      await handleSendMessage(portalMessage, [], {
        recipientEmails: recipients,
        subject: emailForm.subject.trim(),
      })

      setShowSendContractDialog(false)
      setSendingContract(null)
      setEmailForm({
        to: '',
        customEmail: '',
        subject: '',
        body: ''
      })

      console.log(`Contract "${sendingContract.name}" sent to BoldSign for: ${recipients.join(", ")}`)
    } catch (error) {
      console.error("Failed to send contract with BoldSign:", error)
      alert(error instanceof Error ? error.message : "Failed to send contract with BoldSign.")
    } finally {
      setIsSendingContractEmail(false)
    }
  }

  const getPaymentReminderTemplate = () => {
    const serviceLabel = currentCeremonyConfig?.label || "Ceremony"
    const pendingInvoice = paymentHistory
      .filter((payment: any) => payment.status === "pending" && Number(payment.amount || 0) > 0 && payment.id)
      .sort((a: any, b: any) => getPaymentDateValue(b).getTime() - getPaymentDateValue(a).getTime())[0]
    const paymentPortalUrl = pendingInvoice
      ? `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://portal.ordainedpro.com"}/pay/invoice/${pendingInvoice.id}`
      : ""
    const paymentLinkSection = paymentPortalUrl
      ? `\n\nMake a Payment:\n${paymentPortalUrl}`
      : ""
    const primaryFirst = getFirstName(editCoupleInfo?.brideName)
    const secondaryFirst = getFirstName(editCoupleInfo?.groomName)
    const greetingNames =
      currentCeremonyType === "celebration_of_life"
        ? primaryFirst || "there"
        : [primaryFirst, secondaryFirst].filter(Boolean).join(" and ") || "there"

    const templates: Record<string, { subject: string; intro: string; reminder: string; due: string; closing: string }> = {
      wedding: {
        subject: "Payment Reminder - Wedding Ceremony Services",
        intro: "I hope this message finds you well and that your wedding planning is going smoothly.",
        reminder: "This is a friendly reminder regarding your upcoming payment for our wedding ceremony services.",
        due: "Please ensure your final payment is submitted by the due date to confirm all arrangements for your special day.",
        closing: "Looking forward to officiating your beautiful ceremony!",
      },
      celebration_of_life: {
        subject: "Payment Reminder - Memorial Service",
        intro: "I hope you and your family are doing as well as possible during this time.",
        reminder: "This is a respectful reminder regarding the upcoming payment for the remembrance service.",
        due: "Please submit the remaining balance by the due date so the service arrangements can remain confirmed.",
        closing: "It is an honor to support your family with this service.",
      },
      quinceanera: {
        subject: "Payment Reminder - Quinceanera Ceremony",
        intro: "I hope the celebration planning is going smoothly.",
        reminder: "This is a friendly reminder regarding your upcoming payment for the quinceanera ceremony services.",
        due: "Please submit the remaining balance by the due date so the ceremony arrangements can remain confirmed.",
        closing: "Looking forward to helping make this celebration meaningful and memorable!",
      },
      baby_blessing: {
        subject: "Payment Reminder - Baby Blessing Ceremony",
        intro: "I hope your family is doing well.",
        reminder: "This is a friendly reminder regarding your upcoming payment for the baby blessing or naming ceremony.",
        due: "Please submit the remaining balance by the due date so the ceremony arrangements can remain confirmed.",
        closing: "Looking forward to being part of this special family moment!",
      },
      vow_renewal: {
        subject: "Payment Reminder - Vow Renewal Ceremony",
        intro: "I hope your vow renewal planning is going smoothly.",
        reminder: "This is a friendly reminder regarding your upcoming payment for the vow renewal ceremony services.",
        due: "Please submit the remaining balance by the due date so the ceremony arrangements can remain confirmed.",
        closing: "Looking forward to celebrating this meaningful milestone with you!",
      },
      other: {
        subject: `Payment Reminder - ${serviceLabel}`,
        intro: "I hope your ceremony planning is going smoothly.",
        reminder: `This is a friendly reminder regarding your upcoming payment for the ${serviceLabel.toLowerCase()} services.`,
        due: "Please submit the remaining balance by the due date so the ceremony arrangements can remain confirmed.",
        closing: "Looking forward to being part of your ceremony!",
      },
    }

    const template = templates[currentCeremonyType] || templates.other

    return {
      subject: sanitizeMessageText(template.subject),
      paymentPortalUrl,
      body: sanitizeMessageText(`Dear ${greetingNames},

${template.intro}

${template.reminder}

Payment Details:
* Total Amount: $${paymentInfo.totalAmount}
* Deposit Paid: $${paymentInfo.depositPaid}
* Balance Due: $${paymentInfo.balance}
* Due Date: ${paymentInfo.finalPaymentDue}
${paymentLinkSection}

${template.due}

If you have any questions about the payment or need to discuss payment options, please don't hesitate to reach out to me directly.

${template.closing}

Warm regards,
${officiantLabel}${officiantPhone ? `\n${officiantPhone}` : ''}${officiantEmail ? `\n${officiantEmail}` : ''}`),
    }
  }

  // Handle opening payment reminder dialog
  const handleOpenPaymentReminderDialog = () => {
    const reminderTemplate = getPaymentReminderTemplate()
    setPaymentReminderForm({
      to: 'both', // Default to both couple members
      customEmail: '',
      subject: sanitizeMessageText(reminderTemplate.subject),
      body: sanitizeMessageText(reminderTemplate.body)
    })
    setShowSendPaymentReminderDialog(true)
  }

  // Handle sending payment reminder email
  const handleSendPaymentReminderEmail = async () => {
    const recipientEmails = Array.from(
      new Set(
        (paymentReminderForm.to === 'both'
          ? [editCoupleInfo.brideEmail, editCoupleInfo.groomEmail]
          : [paymentReminderForm.to || paymentReminderForm.customEmail]
        )
          .map((email) => String(email || "").trim())
          .filter(Boolean)
      )
    )

    if (recipientEmails.length === 0) {
      alert('Please select a recipient or enter an email address.')
      return
    }

    const pendingInvoice = paymentHistory
      .filter((payment: any) => payment.status === "pending" && Number(payment.amount || 0) > 0 && payment.id)
      .sort((a: any, b: any) => getPaymentDateValue(b).getTime() - getPaymentDateValue(a).getTime())[0]
    const paymentPortalUrl = pendingInvoice
      ? `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "https://portal.ordainedpro.com"}/pay/invoice/${pendingInvoice.id}`
      : ""
    const sanitizedSubject = sanitizeMessageText(paymentReminderForm.subject).trim()
    const sanitizedBody = sanitizeMessageText(paymentReminderForm.body).trim()
    const messageWithPaymentLink = paymentPortalUrl && !sanitizedBody.includes(paymentPortalUrl)
      ? `${sanitizedBody}\n\nMake a Payment:\n${paymentPortalUrl}`
      : sanitizedBody

    if (!sanitizedSubject) {
      alert('Please enter a subject.')
      return
    }

    if (!messageWithPaymentLink) {
      alert('Please enter a message body.')
      return
    }

    if (isSendingMessage) return
    setIsSendingMessage(true)

    try {
      const coupleName = `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`

      for (const email of recipientEmails) {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: sanitizedSubject,
            message: messageWithPaymentLink,
            fromName: officiantLabel,
            coupleName,
            coupleId: editCoupleInfo?.id,
            officiantId: currentUser?.id,
            actionUrl: paymentPortalUrl || undefined,
            actionLabel: paymentPortalUrl ? "Make a payment" : undefined,
            emailTitle: "Payment Reminder",
            emailSubtitle: "From your officiant",
            attachments: []
          })
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || result?.details || `Failed to send reminder to ${email}`)
        }
      }

      setShowSendPaymentReminderDialog(false)
      setPaymentReminderForm({
        to: '',
        customEmail: '',
        subject: '',
        body: ''
      })

      console.log(`Payment reminder sent to: ${recipientEmails.join(", ")}`)
    } catch (error) {
      console.error("Failed to send payment reminder:", error)
      alert(error instanceof Error ? error.message : "Failed to send payment reminder. Please try again.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleContractUploaded = async (contractData: Omit<Contract, 'id' | 'createdDate'> & { templateContent?: string }) => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("Ã¢ÂÅ’ Cannot upload contract: No user or couple selected")
      return
    }

    console.log("[SCRIPT]Å“ Uploading contract for couple:", editCoupleInfo.id)

    const uploadedFile = contractData.file
    const templateContent = contractData.templateContent?.trim()
    if (!uploadedFile?.file && !templateContent) {
      alert("Please upload a contract file or paste/import contract text before saving.")
      return
    }

    const fileExt = templateContent ? "txt" : uploadedFile?.name.split(".").pop() || "file"
    if (!templateContent && fileExt.toLowerCase() !== "pdf") {
      alert("Contracts must be uploaded as PDF files. Please export your contract to PDF and upload it again.")
      return
    }

    const contractFile = templateContent
      ? new File([contractData.templateContent || ""], `${contractData.name || "contract"}.txt`, { type: "text/plain;charset=utf-8" })
      : uploadedFile!.file
    const fileName = `${Date.now()}_${currentUser.id}.${fileExt}`
    const filePath = `${currentUser.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, contractFile, {
        contentType: templateContent
          ? "text/plain;charset=utf-8"
          : uploadedFile?.type || uploadedFile?.file.type || "application/octet-stream",
        upsert: true
      })

    if (uploadError) {
      console.error("Failed to upload contract file:", uploadError)
      alert(`Failed to upload contract file: ${uploadError.message}`)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(filePath)

    // Save to database
    const result = await addContractToDB(currentUser.id, editCoupleInfo.id, {
      name: contractData.name,
      description: contractData.description || "",
      type: contractData.type || "Custom Contract",
      expiryDate: contractData.expiryDate || "",
      fileUrl: publicUrlData.publicUrl,
      fileType: templateContent ? "text/plain" : uploadedFile?.type || uploadedFile?.file.type || "application/octet-stream",
      fileSize: contractFile.size || uploadedFile?.size || uploadedFile?.file.size || 0,
      status: contractData.status || 'draft'
    })

    if (result.ok && result.data) {
      // Create new contract with database ID
      const newContract = {
        ...contractData,
        id: result.data.id,
        createdDate: new Date().toLocaleDateString(),
        status: contractData.status || 'draft',
        fileUrl: result.data.file_url || publicUrlData.publicUrl,
        fileType: result.data.file_type || (templateContent ? "text/plain" : uploadedFile?.type || uploadedFile?.file.type),
        fileSize: result.data.file_size || contractFile.size || uploadedFile?.size || uploadedFile?.file.size,
        file: {
          ...(uploadedFile || {}),
          id: uploadedFile?.id || `contract-text-${Date.now()}`,
          file: contractFile,
          name: templateContent ? `${contractData.name || "Contract"}.txt` : uploadedFile?.name || contractData.name,
          size: contractFile.size,
          type: templateContent ? "text/plain" : uploadedFile?.type || uploadedFile?.file.type || "application/octet-stream",
          url: result.data.file_url || publicUrlData.publicUrl,
          status: "completed" as const,
          uploadProgress: 100
        }
      }

      // Add contract to the list immediately
      setContracts(prev => [...prev, newContract as any])
      setSendingContract(newContract as any)
      setEmailForm({
        to: '',
        customEmail: '',
        subject: "Contract for Signature",
        body: `Hi,\n\nThank you for trusting me with your ceremony. Please review and sign the contract using the secure link from BoldSign.\n\nIf anything looks incorrect or you have questions before signing, reply to this message and I will be happy to help.\n\nThank you,\n${officiantLabel}`
      })
      setShowSendContractDialog(true)

      console.log("Ã¢Å“â€¦ Contract uploaded:", newContract)

    } else {
      const cleanupPath = deriveContractStoragePath(publicUrlData.publicUrl)
      if (cleanupPath) {
        const { error: cleanupError } = await supabase.storage.from("contracts").remove([cleanupPath])
        if (cleanupError) {
          console.error("Failed to clean up uploaded contract after database error:", cleanupError)
        }
      }
      console.error("Ã¢ÂÅ’ Failed to upload contract:", result.error)
      alert(`Failed to save contract: ${result.error || "Please try again."}`)
    }
  }

  // Payment info calculated from payment history
  const [paymentInfo, setPaymentInfo] = useState({
    totalAmount: 0,
    depositPaid: 0,
    balance: 0,
    refundFeesCharged: 0,
    depositDate: "",
    finalPaymentDue: "",
    paymentStatus: "pending"
  })

  // Payments are now loaded per couple from the database
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [allPaymentRecords, setAllPaymentRecords] = useState<any[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)

  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false)
  const [newPayment, setNewPayment] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    method: "Credit Card",
    notes: "",
    kind: "payment"
  })
  const [uploadingScript, setUploadingScript] = useState(false)

  // Scripts are now loaded from database
  const [coupleScripts, setCoupleScripts] = useState<any[]>([])
  const [scriptSales, setScriptSales] = useState<any[]>([])
  const [showMarketplaceAnalytics, setShowMarketplaceAnalytics] = useState(false)
  const [showPayoutHistory, setShowPayoutHistory] = useState(false)

  const accountCreatedAt = currentUser?.created_at || officiantProfile?.created_at || new Date().toISOString()
  const accountCreatedDate = new Date(accountCreatedAt)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const publishedScripts = coupleScripts.filter(script => script.isPublished)
  const marketplaceDrafts = coupleScripts.filter(script => !script.isPublished && !script.coupleId)
  const myScripts = [...publishedScripts, ...marketplaceDrafts].map(script => ({
    ...script,
    status: script.isPublished ? "active" : "draft",
    sales: script.sales || scriptSales.filter(sale => sale.script_id === script.id).length,
    earnings: script.earnings || scriptSales
      .filter(sale => sale.script_id === script.id)
      .reduce((sum, sale) => sum + Number(sale.net_amount || sale.amount || 0), 0),
    rating: script.rating || 0,
    price: script.price || 0,
  }))
  const mainMarketplaceScriptCount = coupleScripts.filter(script =>
    script.isPublished && (script.marketplaceVisibility || "main_marketplace") === "main_marketplace"
  ).length
  const marketplaceTotalEarnings = scriptSales
    .filter(sale => new Date(sale.created_at || Date.now()) >= accountCreatedDate)
    .reduce((sum, sale) => sum + Number(sale.net_amount || sale.amount || 0), 0)
  const marketplaceMonthEarnings = scriptSales
    .filter(sale => new Date(sale.created_at || Date.now()) >= monthStart)
    .reduce((sum, sale) => sum + Number(sale.net_amount || sale.amount || 0), 0)
  const marketplaceSalesCount = scriptSales.filter(sale => new Date(sale.created_at || Date.now()) >= accountCreatedDate).length
  const marketplaceAverageSale = marketplaceSalesCount > 0 ? marketplaceTotalEarnings / marketplaceSalesCount : 0
  const marketplaceTopScript = myScripts
    .slice()
    .sort((a, b) => (b.earnings || 0) - (a.earnings || 0))[0]

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const paidPaymentRecords = allPaymentRecords.filter(isPaidPayment)
  const refundPaymentRecords = allPaymentRecords.filter(isRefundPayment)
  const paymentSummaryByCouple = allPaymentRecords.reduce((groups: Record<string, any[]>, payment: any) => {
    const key = String(payment.coupleId || "unassigned")
    groups[key] = groups[key] || []
    groups[key].push(payment)
    return groups
  }, {})
  const outstandingSummaries = Object.entries(paymentSummaryByCouple)
    .map(([coupleId, records]) => ({
      coupleId,
      records,
      summary: calculatePaymentSummary(records as any[])
    }))
    .filter(({ summary }) => summary.balance > 0)
  const financialReport = {
    grossIncome: paidPaymentRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    refunds: refundPaymentRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    refundFees: refundPaymentRecords.reduce((sum, payment) => sum + Number(payment.refundFee || payment.refund_fee_amount || 0), 0),
    netIncome: 0,
    monthIncome: paidPaymentRecords
      .filter(payment => {
        const date = getPaymentDateValue(payment)
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    yearIncome: paidPaymentRecords
      .filter(payment => getPaymentDateValue(payment).getFullYear() === currentYear)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    outstanding: outstandingSummaries.reduce((sum, item) => sum + item.summary.balance, 0),
    paymentsReceived: paidPaymentRecords.length,
    refundsIssued: refundPaymentRecords.length,
  }
  financialReport.netIncome = financialReport.grossIncome - financialReport.refunds - financialReport.refundFees
  const financialRows = allPaymentRecords.map(payment => {
    const couple = allCouples.find((item: any) => item.id === payment.coupleId)
    return {
      ...payment,
      coupleName: couple ? `${couple.brideName} & ${couple.groomName}` : `Couple #${payment.coupleId || "Unassigned"}`,
      weddingDate: couple?.weddingDetails?.weddingDate || "",
    }
  })
  const outstandingBalanceRows = outstandingSummaries
    .map(({ coupleId, records, summary }) => {
      const firstCharge = (records as any[])
        .filter(isInvoiceCharge)
        .sort((a, b) => getPaymentDateValue(a).getTime() - getPaymentDateValue(b).getTime())[0]
      const couple = allCouples.find((item: any) => String(item.id) === coupleId)

      return {
        id: `outstanding-${coupleId}`,
        coupleId,
        coupleName: couple ? `${couple.brideName} & ${couple.groomName}` : `Couple #${coupleId}`,
        weddingDate: couple?.weddingDetails?.weddingDate || "",
        description: firstCharge?.description || "Outstanding ceremony balance",
        dueDate: summary.finalPaymentDue,
        amount: summary.balance,
      }
    })
    .sort((a, b) => getPaymentDateValue(a).getTime() - getPaymentDateValue(b).getTime())
  const refundRows = financialRows.filter(isRefundPayment)

  const exportFinancialCsv = () => {
    const headers = ["Date", "Couple", "Wedding Date", "Description", "Type", "Status", "Amount", "Refund Fee", "Total Officiant Charge"]
    const rows = financialRows.map(row => [
      row.dueDate || row.paidDate || row.createdAt || "",
      row.coupleName,
      row.weddingDate,
      row.description || "",
      row.type || "",
      row.status || "",
      Number(row.amount || 0).toFixed(2),
      Number(row.refundFee || 0).toFixed(2),
      Number(row.totalOfficiantCharge || 0).toFixed(2),
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ordainedpro-financial-report-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const printFinancialReport = () => {
    window.print()
  }

  const popularScripts: any[] = []

  const handleAddCeremony = async () => {
    const ceremonyConfig = getCeremonyTypeConfig(newCeremony.ceremonyType)

    // Validate that required fields are filled
    if (!newCeremony.ceremonyName || !newCeremony.brideName || !newCeremony.groomName) {
      alert(`Please fill in Ceremony Name, ${ceremonyConfig.primaryRole} Name, and ${ceremonyConfig.secondaryRole} Name`)
      return
    }

    // Save the ceremony with a unique ID and creation timestamp
    const ceremonyToSave = {
      ...newCeremony,
      id: Date.now(),
      ceremonyType: newCeremony.ceremonyType,
      ceremonyTypeLabel: ceremonyConfig.label,
      createdAt: new Date().toISOString()
    }

    const ceremonyNotes = [
      newCeremony.notes,
      `Ceremony type: ${ceremonyConfig.label}`,
      newCeremony.primaryAge ? `${ceremonyConfig.primaryRole} age: ${newCeremony.primaryAge}` : "",
      newCeremony.secondaryAge ? `${ceremonyConfig.secondaryRole} age: ${newCeremony.secondaryAge}` : "",
    ].filter(Boolean).join("\n")

    let savedCoupleId = Date.now()

    if (currentUser?.id) {
      const saveResult = await addCeremonyToDB(currentUser.id, {
        brideName: newCeremony.brideName,
        brideEmail: newCeremony.brideEmail,
        bridePhone: newCeremony.bridePhone,
        brideAddress: newCeremony.brideAddress,
        groomName: newCeremony.groomName,
        groomEmail: newCeremony.groomEmail,
        groomPhone: newCeremony.groomPhone,
        groomAddress: newCeremony.groomAddress,
        venueName: newCeremony.venueName,
        venueAddress: newCeremony.venueAddress,
        ceremonyDate: newCeremony.ceremonyDate,
        ceremonyTime: newCeremony.ceremonyTime,
        expectedGuests: newCeremony.expectedGuests,
        notes: ceremonyNotes,
      })

      if (!saveResult.ok) {
        alert(saveResult.error || "Unable to save this ceremony. Please try again.")
        return
      }

      savedCoupleId = saveResult.data?.id || savedCoupleId
    }

    setSavedCeremonies(prev => [...prev, ceremonyToSave])
    console.log("Ceremony saved:", ceremonyToSave)

    // Create the new couple object
    const newCouple = {
      id: savedCoupleId,
      ceremonyType: newCeremony.ceremonyType,
      ceremonyTypeLabel: ceremonyConfig.label,
      primaryAge: newCeremony.primaryAge,
      secondaryAge: newCeremony.secondaryAge,
      brideName: newCeremony.brideName,
      brideEmail: newCeremony.brideEmail,
      bridePhone: newCeremony.bridePhone,
      brideAddress: newCeremony.brideAddress,
      groomName: newCeremony.groomName,
      groomEmail: newCeremony.groomEmail,
      groomPhone: newCeremony.groomPhone,
      groomAddress: newCeremony.groomAddress,
      address: "",
      emergencyContact: "",
      specialRequests: ceremonyNotes,
      isActive: true, // New ceremonies are active by default
      colors: getCoupleColors(allCouples.length + 1), // Assign consistent colors based on position
      weddingDetails: {
        venueName: newCeremony.venueName,
        venueAddress: newCeremony.venueAddress,
        weddingDate: newCeremony.ceremonyDate,
        startTime: newCeremony.ceremonyTime,
        endTime: "",
        expectedGuests: newCeremony.expectedGuests,
        officiantNotes: ""
      }
    }

    // Add the new couple to allCouples array so it appears in Switch Ceremony dialog
    setAllCouples(prev => [...prev, newCouple])

    // Set the newly created couple as the active couple
    setActiveCoupleIndex(allCouples.length) // Index of the new couple
    setEditCoupleInfo(newCouple)

    // Save wedding details for this couple
    const coupleId = `${newCeremony.brideName} & ${newCeremony.groomName}`
    setSavedWeddingDetails(prev => ({
      ...prev,
      [coupleId]: {
        venueName: newCeremony.venueName,
        venueAddress: newCeremony.venueAddress,
        weddingDate: newCeremony.ceremonyDate,
        startTime: newCeremony.ceremonyTime,
        endTime: "",
        expectedGuests: newCeremony.expectedGuests,
        officiantNotes: ""
      }
    }))

    setEditWeddingDetails({
      venueName: newCeremony.venueName,
      venueAddress: newCeremony.venueAddress,
      weddingDate: newCeremony.ceremonyDate,
      startTime: newCeremony.ceremonyTime,
      endTime: "",
      expectedGuests: newCeremony.expectedGuests,
      officiantNotes: ""
    })

    console.log("New couple added to allCouples array:", newCouple)
    console.log("Total couples now:", allCouples.length + 1)

    // Reset form and close dialog
    setNewCeremony({
      ceremonyType: "wedding",
      ceremonyName: "",
      ceremonyDate: "",
      ceremonyTime: "",
      venueName: "",
      venueAddress: "",
      expectedGuests: "",
      brideName: "",
      brideEmail: "",
      bridePhone: "",
      brideAddress: "",
      primaryAge: "",
      groomName: "",
      groomEmail: "",
      groomPhone: "",
      groomAddress: "",
      secondaryAge: "",
      totalAmount: "",
      depositAmount: "",
      finalPaymentDate: "",
      notes: ""
    })
    setShowAddCeremonyDialog(false)

    // Show success message
    alert(`Ceremony "${ceremonyToSave.ceremonyName}" has been saved successfully.\n\nIt has been added to your ceremony list and you can switch to it using the "Switch Ceremony" button.`)
  }

  const handleEditCoupleInfo = async () => {
    if (!editCoupleInfo?.id) return

    const result = await updateCoupleInDB(editCoupleInfo.id, {
      bride_name: editCoupleInfo.brideName || "",
      bride_email: editCoupleInfo.brideEmail || null,
      bride_phone: editCoupleInfo.bridePhone || null,
      bride_address: editCoupleInfo.brideAddress || null,
      groom_name: editCoupleInfo.groomName || "",
      groom_email: editCoupleInfo.groomEmail || null,
      groom_phone: editCoupleInfo.groomPhone || null,
      groom_address: editCoupleInfo.groomAddress || null,
      emergency_contact: editCoupleInfo.emergencyContact || null,
    })

    if (!result.ok) {
      console.error("Failed to update couple info:", result.error)
      alert("Failed to save couple information. Please try again.")
      return
    }

    // Update the couple info in allCouples array
    const updatedCouples = [...allCouples]
    updatedCouples[activeCoupleIndex] = {
      ...updatedCouples[activeCoupleIndex],
      ...editCoupleInfo
    }
    setAllCouples(updatedCouples)
    setEditCoupleInfo(updatedCouples[activeCoupleIndex])

    console.log("Updating couple info:", editCoupleInfo)
    setShowEditCoupleDialog(false)
  }

  const handleOpenEditWeddingDialog = () => {
    const currentDetails = editCoupleInfo?.weddingDetails || allCouples[activeCoupleIndex]?.weddingDetails

    if (currentDetails) {
      setEditWeddingDetails({
        venueName: currentDetails.venueName || "",
        venueAddress: currentDetails.venueAddress || "",
        weddingDate: currentDetails.weddingDate || "",
        startTime: currentDetails.startTime || "",
        endTime: currentDetails.endTime || "",
        expectedGuests: currentDetails.expectedGuests || "",
        officiantNotes: currentDetails.officiantNotes || ""
      })
    }

    setShowEditWeddingDialog(true)
  }

  const handleEditWeddingDetails = async () => {
    const activeCoupleId = editCoupleInfo?.id || allCouples[activeCoupleIndex]?.id

    if (!activeCoupleId) {
      console.error("Cannot save wedding details: no active couple selected")
      return
    }

    if (!currentUser?.id) {
      console.error("Cannot save wedding details: no signed-in user")
      alert("Failed to save wedding details. Please sign in and try again.")
      return
    }

    const coupleId = `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
    const ceremonyUpdates = {
      venue_name: editWeddingDetails.venueName || null,
      venue_address: editWeddingDetails.venueAddress || null,
      wedding_date: editWeddingDetails.weddingDate || null,
      start_time: editWeddingDetails.startTime || null,
      end_time: editWeddingDetails.endTime || null,
      expected_guests: editWeddingDetails.expectedGuests || null,
    }

    const ceremonyResult = await upsertCeremonyDetailsInDB(
      currentUser.id,
      activeCoupleId,
      ceremonyUpdates
    )

    if (!ceremonyResult.ok) {
      console.error("Failed to save wedding details:", ceremonyResult.error)
      alert("Failed to save wedding details. Please try again.")
      return
    }

    const coupleResult = await updateCoupleInDB(activeCoupleId, {
      address: editWeddingDetails.venueAddress || null,
      special_requests: editWeddingDetails.officiantNotes || null
    })

    if (!coupleResult.ok) {
      console.error("Failed to save couple note/address fields:", coupleResult.error)
      alert("Wedding details saved, but private notes could not be saved. Please try saving notes again.")
    }

    // Save the updated wedding details for the current couple
    setSavedWeddingDetails(prev => ({
      ...prev,
      [coupleId]: { ...editWeddingDetails }
    }))

    // Update the wedding details in allCouples array
    const updatedCouples = [...allCouples]
    const activeIndex = updatedCouples.findIndex((couple: any) => couple.id === activeCoupleId)
    const indexToUpdate = activeIndex >= 0 ? activeIndex : activeCoupleIndex
    updatedCouples[indexToUpdate] = {
      ...updatedCouples[indexToUpdate],
      weddingDetails: { ...editWeddingDetails },
      address: editWeddingDetails.venueAddress || "",
      specialRequests: editWeddingDetails.officiantNotes || ""
    }
    setAllCouples(updatedCouples)
    setEditCoupleInfo((prev: any) => ({
      ...prev,
      weddingDetails: { ...editWeddingDetails },
      address: editWeddingDetails.venueAddress || "",
      specialRequests: editWeddingDetails.officiantNotes || ""
    }))

    console.log("Saving wedding details for:", coupleId, editWeddingDetails)
    setShowEditWeddingDialog(false)
  }

  const handleSwitchCouple = (index: number) => {
    // Save current couple's data before switching
    const updatedCouples = [...allCouples]
    updatedCouples[activeCoupleIndex] = {
      ...updatedCouples[activeCoupleIndex],
      ...editCoupleInfo,
      weddingDetails: { ...editWeddingDetails }
    }
    setAllCouples(updatedCouples)

    // Switch to the selected couple
    setActiveCoupleIndex(index)
    const selectedCouple = updatedCouples[index]
    setEditCoupleInfo(selectedCouple)
    setEditWeddingDetails(selectedCouple.weddingDetails || {
      venueName: "",
      venueAddress: "",
      weddingDate: "",
      startTime: "",
      endTime: "",
      expectedGuests: ""
    })

    setShowSwitchCeremonyDialog(false)
    console.log("Switched to couple:", selectedCouple?.brideName || 'Partner 1', "&", selectedCouple?.groomName || 'Partner 2')
  }

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleAddWeddingEvent = () => {
    if (addEventForm.subject && addEventForm.date && addEventForm.time) {
      const newEvent = {
        id: Date.now(),
        title: addEventForm.subject,
        date: addEventForm.date,
        time: addEventForm.time,
        location: editWeddingDetails.venueName,
        type: addEventForm.category,
        details: addEventForm.details
      }
      setUpcomingEvents([...upcomingEvents, newEvent])
      setAddEventForm({
        subject: '',
        date: '',
        time: '',
        category: 'rehearsal',
        details: ''
      })
      setShowAddEventDialog(false)
    }
  }

  const handleDeleteWeddingEvent = (eventId: number) => {
    setUpcomingEvents(upcomingEvents.filter(event => event.id !== eventId))
  }

  const handleDeleteMeeting = async (meetingId: number) => {
    if (confirm('Are you sure you want to permanently delete this meeting?')) {
      const result = await deleteMeetingFromDB(meetingId)
      if (!result.ok) {
        console.error("Failed to delete meeting:", result.error)
        alert("Failed to delete meeting. Please try again.")
        return
      }
      setMeetings(meetings.filter(meeting => meeting.id !== meetingId))
    }
  }

  const handleCancelMeeting = async (meetingId: number) => {
    if (confirm('Cancel this meeting? If this meeting has a Google Calendar event, OrdainedPro will ask Google to notify the attendees.')) {
      const meeting = meetings.find(item => item.id === meetingId)
      const googleEventId = meeting?.google_event_id || meeting?.googleEventId

      if (googleEventId) {
        const cancelResponse = await fetch("/api/google/cancel-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: googleEventId }),
        })

        if (!cancelResponse.ok) {
          const cancelError = await cancelResponse.json().catch(() => ({}))
          console.warn("Google Calendar cancellation failed:", cancelError.error || cancelResponse.statusText)
        }
      }

      const result = await updateMeetingInDB(meetingId, {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_by: 'officiant'
      } as any)
      if (!result.ok) {
        console.warn("Meeting canceled locally, but the database status was not saved:", result.error)
      }
      setMeetings(prev => prev.map(meeting =>
        meeting.id === meetingId ? { ...meeting, status: 'canceled' as const } : meeting
      ))
    }
  }

  const handleEditMeeting = (meeting: any) => {
    setEditMeetingForm({
      id: meeting.id,
      subject: meeting.subject,
      date: meeting.date,
      time: meeting.time || '',
      duration: meeting.duration || 60,
      meetingType: meeting.meetingType || 'in-person',
      location: meeting.location || '',
      body: meeting.body || '',
      responseDeadline: meeting.responseDeadline || ''
    })
    setShowEditMeetingDialog(true)
  }

  const handleUpdateMeeting = async () => {
    const updatedMeeting = {
      subject: editMeetingForm.subject,
      date: editMeetingForm.date,
      time: editMeetingForm.time,
      duration: editMeetingForm.duration,
      meetingType: editMeetingForm.meetingType as 'in-person' | 'video' | 'phone',
      meeting_type: editMeetingForm.meetingType,
      location: editMeetingForm.location,
      body: editMeetingForm.body,
      notes: editMeetingForm.body,
      responseDeadline: editMeetingForm.responseDeadline,
      response_deadline: editMeetingForm.responseDeadline || null,
      status: 'pending'
    }

    const result = await updateMeetingInDB(editMeetingForm.id, updatedMeeting as any)
    if (!result.ok) {
      console.error("Failed to update meeting:", result.error)
      alert("Failed to update meeting. Please try again.")
      return
    }

    setMeetings(meetings.map(meeting =>
      meeting.id === editMeetingForm.id
        ? { ...meeting, ...updatedMeeting, status: 'pending' as const }
        : meeting
    ))
    setShowEditMeetingDialog(false)
    setEditMeetingForm({
      id: 0,
      subject: '',
      date: '',
      time: '',
      duration: 60,
      meetingType: 'in-person',
      location: '',
      body: '',
      responseDeadline: ''
    })
  }

  const toggleCeremonyStatus = async () => {
    const selectedCoupleId = editCoupleInfo?.id || allCouples[activeCoupleIndex]?.id
    const currentCouple =
      allCouples.find(couple => String(couple.id) === String(selectedCoupleId)) ||
      allCouples[activeCoupleIndex]
    if (!currentCouple?.id) return

    const nextIsActive = currentCouple.isActive === false
    const result = await updateCoupleInDB(currentCouple.id, { is_active: nextIsActive })

    if (!result.ok) {
      alert(`Failed to ${nextIsActive ? "restore" : "archive"} ceremony on the server. Please try again.`)
      return
    }

    const updatedCouples = allCouples.map((couple) =>
      String(couple.id) === String(currentCouple.id)
        ? { ...couple, isActive: nextIsActive }
        : couple
    )
    setAllCouples(updatedCouples)

    if (!nextIsActive) {
      launchArchiveConfettiOnce(currentCouple.id)

      const archivedIndex = allCouples.findIndex(couple => String(couple.id) === String(currentCouple.id))
      const nextActiveIndex = updatedCouples.findIndex((couple, index) => index !== archivedIndex && couple.isActive)

      if (nextActiveIndex !== -1) {
        const nextActiveCouple = updatedCouples[nextActiveIndex]
        setActiveCoupleIndex(nextActiveIndex)
        setEditCoupleInfo(nextActiveCouple)
        setEditWeddingDetails(nextActiveCouple.weddingDetails || {
          venueName: "",
          venueAddress: "",
          weddingDate: "",
          startTime: "",
          endTime: "",
          expectedGuests: "",
          officiantNotes: ""
        })
      } else {
        setEditCoupleInfo({ ...currentCouple, isActive: false })
      }

      console.log(`Ceremony archived on server: ID ${currentCouple.id}`)
    } else {
      setEditCoupleInfo({ ...currentCouple, isActive: true })
      console.log(`Ceremony restored on server: ID ${currentCouple.id}`)
      alert("Ceremony has been restored on the server and is now active!")
    }
  }

  const handleArchiveCoupleFromScript = async () => {
    const currentCouple = allCouples[activeCoupleIndex]
    if (!currentCouple?.id) return

    if (!currentCouple.isActive) {
      setShowArchivedCeremoniesDialog(true)
      return
    }

    const confirmed = confirm(
      `Archive this script and couple profile?\n\nIf you archive this script, it will also archive the couple's profile. You can revitalize it later from the Officiant Dashboard under Archived Ceremonies.`
    )

    if (!confirmed) return

    await toggleCeremonyStatus()
  }

  const handleUnarchiveCouple = async (coupleId: number) => {
    const result = await updateCoupleInDB(coupleId, { is_active: true })

    if (!result.ok) {
      alert("Failed to restore ceremony on the server. Please try again.")
      return
    }

    const updatedCouples = allCouples.map(couple =>
      couple.id === coupleId ? { ...couple, isActive: true } : couple
    )
    setAllCouples(updatedCouples)
    console.log(`Ceremony restored on server: ID ${coupleId}`)
    alert("Ceremony has been restored on the server and is now active!")
  }

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'createdDate'>) => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("Ã¢ÂÅ’ Cannot add task: No user or couple selected")
      return
    }

    console.log("[SCRIPT]â€¹ Adding task for couple:", editCoupleInfo.id)

    // Save to database
    const result = await addTaskToDB(currentUser.id, editCoupleInfo.id, {
      task: newTaskData.task,
      dueDate: newTaskData.dueDate,
      dueTime: newTaskData.dueTime,
      priority: newTaskData.priority,
      category: newTaskData.category,
      details: newTaskData.details,
      emailReminder: newTaskData.emailReminder,
      reminderDays: newTaskData.reminderDays
    })

    if (result.ok && result.data) {
      // Add to local state
      const newTask: Task = {
        ...newTaskData,
        id: result.data.id,
        coupleId: editCoupleInfo.id,
        coupleName: [editCoupleInfo?.brideName, editCoupleInfo?.groomName].filter(Boolean).join(" & ") || "Unnamed ceremony",
        ceremonyDate: editWeddingDetails?.weddingDate || "",
        venueName: editWeddingDetails?.venueName || "",
        createdDate: new Date().toISOString().split('T')[0]
      }
      setTasks(prev => [...prev, newTask])

      // Send an immediate notification; future reminders are handled by the scheduled checker.
      if (newTaskData.emailReminder) {
        scheduleEmailNotification(newTask)
      }

      console.log("Ã¢Å“â€¦ Task added:", newTask)
    } else {
      console.error("Ã¢ÂÅ’ Failed to add task:", result.error)
      alert("Failed to add task. Please try again.")
    }
  }

  const scheduleEmailNotification = async (task: Task) => {
    // Calculate reminder date
    const reminderDate = new Date(task.dueDate)
    reminderDate.setDate(reminderDate.getDate() - task.reminderDays)

    console.log(`[SCRIPT]Â§ Scheduling email notification:`)
    console.log(`Task: ${task.task}`)
    console.log(`Reminder Date: ${reminderDate.toDateString()}`)
    console.log(`Due: ${task.dueDate} at ${task.dueTime}`)

    const recipients = [officiantProfile?.email || currentUser?.email].filter(Boolean)

    const coupleName = `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
    const taskOfficiantName = officiantName

    // Send immediate confirmation email about the task
    for (const email of recipients) {
      try {
        const emailContent = generateTaskReminderEmail(task, coupleName, taskOfficiantName)

        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: emailContent.subject,
            message: emailContent.body,
            fromName: taskOfficiantName
          })
        })

        if (response.ok) {
          console.log(`Ã¢Å“â€¦ Task notification sent to ${email}`)
        } else {
          console.error(`Ã¢ÂÅ’ Failed to send task notification to ${email}`)
        }
      } catch (err) {
        console.error(`Ã¢ÂÅ’ Error sending task notification to ${email}:`, err)
      }
    }

    console.log(`[SCRIPT]â€¦ Reminder scheduled for ${reminderDate.toDateString()} - Recipients: ${recipients.join(', ')}`)
  }

  const generateTaskReminderEmail = (task: Task, coupleName: string, officiantName: string) => {
    const cleanOfficiantName = officiantName === "Officiant" ? "Your Officiant" : officiantName
    const cleanOfficiantFirstName =
      cleanOfficiantName === "Your Officiant" ? cleanOfficiantName : cleanOfficiantName.split(/\s+/)[0]
    const cleanGreeting = `Dear ${cleanOfficiantName}`
    const cleanClosingNote = "Please ensure this private task is completed before the ceremony date."
    const cleanPriorityLabel: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    }
    const cleanDueDateLabel = new Date(task.dueDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const cleanDetailsSection = task.details ? `Details:\n${task.details}\n\n` : ""

    return {
      subject: `Wedding Task: ${task.task}`,
      body: `${cleanGreeting},

A new task has been created for your wedding ceremony:

Task: ${task.task}
Due Date: ${cleanDueDateLabel}
Due Time: ${task.dueTime}
Priority: ${cleanPriorityLabel[task.priority] || "Medium"}
Category: ${task.category}

${cleanDetailsSection}${cleanClosingNote}

This reminder was sent only to the officiant and was not sent to the couple or client.

Thank you,
${cleanOfficiantFirstName}
`,
    }
  }

  const toggleTaskCompletion = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCompletedState = !task.completed

    // Optimistically update local state
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: newCompletedState } : t
    ))

    // Update in database
    const result = await updateTaskInDB(taskId, { completed: newCompletedState })

    if (!result.ok) {
      // Revert on error
      console.error("Ã¢ÂÅ’ Failed to update task:", result.error)
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: !newCompletedState } : t
      ))
    } else {
      console.log("Ã¢Å“â€¦ Task completion toggled:", taskId, newCompletedState)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setTasks(prev => prev.filter(t => t.id !== taskId))

    const result = await deleteTaskFromDB(taskId)

    if (!result.ok) {
      console.error("Failed to archive task:", result.error)
      setTasks(prev => [...prev, task])
      alert("Failed to archive task. Please try again.")
    }
  }

  const getFilteredTasks = () => {
    const sortedTasks = [...tasks].sort((firstTask, secondTask) => {
      if (firstTask.completed !== secondTask.completed) return firstTask.completed ? 1 : -1

      const firstDue = firstTask.dueDate ? new Date(firstTask.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const secondDue = secondTask.dueDate ? new Date(secondTask.dueDate).getTime() : Number.MAX_SAFE_INTEGER

      if (firstDue !== secondDue) return firstDue - secondDue
      return String(firstTask.task).localeCompare(String(secondTask.task))
    })

    switch (taskFilter) {
      case 'pending':
        return sortedTasks.filter(task => !task.completed)
      case 'completed':
        return sortedTasks.filter(task => task.completed)
      case 'high-priority':
        return sortedTasks.filter(task => (task.priority === 'high' || task.priority === 'urgent') && !task.completed)
      default:
        return sortedTasks
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    // Priority is shown via badge color - no emojis needed
    return ""
    }

  const handleScheduleMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdDate' | 'status' | 'reminderSent' | 'calendarInviteSent'>) => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("Cannot schedule meeting: No user or couple selected")
      return
    }

    const savedMeeting = meetingData as Meeting
    const newMeeting: Meeting = {
      ...meetingData,
      id: Number(savedMeeting.id) || Date.now(),
      createdDate: savedMeeting.createdDate || new Date().toISOString().split('T')[0],
      status: savedMeeting.status || 'pending',
      reminderSent: savedMeeting.reminderSent || false,
      calendarInviteSent: savedMeeting.calendarInviteSent || true
    }

    setMeetings(prev => [...prev.filter(meeting => meeting.id !== newMeeting.id), newMeeting])
    console.log("Meeting scheduled:", newMeeting)
  }
  const sendMeetingInvitation = (meeting: Meeting) => {
    // In a real application, this would make API calls to:
    // 1. Send calendar invitation
    // 2. Send email notification
    // 3. Set up response tracking

    console.log(`[SCRIPT]Â§ MEETING INVITATION SENT:`)
    console.log(`Meeting: ${meeting.subject}`)
    console.log(`Date: ${meeting.date} at ${meeting.time}`)
    console.log(`Attendees: ${meeting.attendees.join(', ')}`)
    console.log(`Type: ${meeting.meetingType}`)
    console.log(`Status: ${meeting.status}`)
    console.log(`Response Deadline: ${meeting.responseDeadline}`)

    // Simulate email webhook for responses
    simulateEmailResponses(meeting)
  }

  const simulateEmailResponses = (meeting: Meeting) => {
    // Simulate receiving email responses after some time
    setTimeout(() => {
      const responses = ['accepted', 'declined', 'pending']
      const randomResponse = responses[Math.floor(Math.random() * responses.length)] as 'accepted' | 'declined' | 'pending'

      updateMeetingStatus(meeting.id, randomResponse)

      console.log(`[SCRIPT]Â¬ EMAIL RESPONSE RECEIVED:`)
      console.log(`Meeting: ${meeting.subject}`)
      console.log(`Response: ${randomResponse.toUpperCase()}`)
      console.log(`Updated meeting status in portal calendar`)
    }, 5000) // Simulate response after 5 seconds
  }

  const updateMeetingStatus = async (meetingId: number, status: 'pending' | 'accepted' | 'declined' | 'confirmed' | 'canceled' | 'completed') => {
    setMeetings(prev => prev.map(meeting =>
      meeting.id === meetingId ? { ...meeting, status } : meeting
    ))

    const result = await updateMeetingInDB(meetingId, { status } as any)
    if (!result.ok) {
      console.warn("Meeting status updated locally, but not saved to the database:", result.error)
    }
  }

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'declined':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getMeetingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return 'Confirmed'
      case 'pending':
        return 'Pending'
      case 'declined':
        return 'Declined'
      case 'canceled':
        return 'Canceled'
      case 'completed':
        return 'Completed'
      default:
        return 'Scheduled'
    }
  }

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video call'
      case 'phone':
        return 'Phone call'
      case 'in-person':
        return 'In person'
      default:
        return 'Meeting'
    }
  }


  // File viewer handler
  const handleViewFile = (file: any) => {
    setViewingFile({ ...file, startInEditMode: false })
    setShowFileViewerDialog(true)
  }

  const handleEditFile = (file: any) => {
    setViewingFile({ ...file, startInEditMode: true })
    setShowFileViewerDialog(true)
  }

  // Contract viewer content generator
  const getContractViewerContent = (contract: any) => {
    // If contract has a file attachment, show the file
    if (contract.file) {
      const fileType = contract.file.type?.toLowerCase() || ''

      if (fileType.includes('image/')) {
        return (
          <div className="flex justify-center">
            <img
              src={contract.file.url || `/api/placeholder/800/600`}
              alt={contract.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        )
      } else if (fileType.includes('pdf')) {
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl">[SCRIPT]â€ž</div>
            <p className="text-gray-600">PDF Contract</p>
            <p className="font-medium">{contract.name}</p>
            <p className="text-sm text-gray-500">File type: {contract.file.type}</p>
            <Button
              onClick={() => window.open(contract.file.url || '#', '_blank')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Eye className="w-4 h-4 mr-2" />
              Open PDF in New Tab
            </Button>
          </div>
        )
      } else {
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl">[SCRIPT]Â</div>
            <p className="text-gray-600">Contract Document</p>
            <p className="font-medium">{contract.name}</p>
            <p className="text-sm text-gray-500">File type: {contract.file.type}</p>
            <Button
              onClick={() => window.open(contract.file.url || '#', '_blank')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Contract
            </Button>
          </div>
        )
      }
    } else {
      // If no file, show contract details
      return (
        <div className="text-center space-y-6">
          <div className="text-6xl">[SCRIPT]â€¹</div>
          <div>
            <p className="text-gray-600 mb-2">Contract Information</p>
            <p className="font-medium text-xl">{contract.name}</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Contract Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900 capitalize">{contract.type.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className="text-gray-900 capitalize">{contract.status}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-900">{contract.createdDate}</p>
              </div>
              {contract.signedDate && (
                <div>
                  <span className="font-medium text-gray-700">Signed:</span>
                  <p className="text-gray-900">{contract.signedDate}</p>
                </div>
              )}
              {contract.signedBy && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Signed by:</span>
                  <p className="text-gray-900">{contract.signedBy}</p>
                </div>
              )}
              {contract.description && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-900">{contract.description}</p>
                </div>
              )}
            </div>
          </div>

          {contract.signature && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
              <h4 className="font-medium text-green-900 mb-2">Digital Signature</h4>
              <img
                src={contract.signature}
                alt="Digital Signature"
                className="h-16 border rounded bg-white mx-auto"
                style={{ maxWidth: '200px' }}
              />
              <p className="text-sm text-green-700 mt-2">Signed on {contract.signedDate}</p>
            </div>
          )}
        </div>
      )
    }
  }

  const getFileViewerContent = (file: any) => {
    const fileType = file.type.toLowerCase()

    if (fileType.includes('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={file.url || `/api/placeholder/800/600`}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      )
    } else if (fileType.includes('pdf')) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">[SCRIPT]â€ž</div>
          <p className="text-gray-600">PDF Preview</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">Size: {file.size}</p>
          <Button
            onClick={() => window.open(file.url || '#', '_blank')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Open PDF in New Tab
          </Button>
        </div>
      )
    } else if (fileType.includes('text/') || fileType.includes('txt')) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">[SCRIPT]Â</div>
          <p className="text-gray-600">Text Document</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">Size: {file.size}</p>
          <div className="bg-gray-50 p-4 rounded-lg text-left max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-700">Text content preview would appear here...</p>
          </div>
        </div>
      )
    } else if (fileType.includes('document') || fileType.includes('word') || fileType.includes('doc')) {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">[SCRIPT]Â</div>
          <p className="text-gray-600">Word Document</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">Size: {file.size}</p>
          <Button
            onClick={() => window.open(file.url || '#', '_blank')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Document
          </Button>
        </div>
      )
    } else {
      return (
        <div className="text-center space-y-4">
          <div className="text-6xl">{getFileIcon(file.type)}</div>
          <p className="text-gray-600">File Preview</p>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-400">This file type cannot be previewed</p>
          <Button
            onClick={() => window.open(file.url || '#', '_blank')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      )
    }
  }

  // File management handlers
  const handleFilesUploaded = async (uploadedFiles: UploadedFile[]) => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("Ã¢ÂÅ’ Cannot upload files: No user or couple selected")
      return
    }

    console.log("[SCRIPT]Â Uploading", uploadedFiles.length, "files for couple:", editCoupleInfo.id)

    for (const file of uploadedFiles) {
      // Check if file already exists
      const exists = files.some(existingFile =>
        existingFile.name === file.name &&
        existingFile.size === formatFileSize(file.size)
      )

      if (exists) {
        console.log("Ã¢ÂÂ­Ã¯Â¸Â Skipping duplicate file:", file.name)
        continue
      }

      try {
        // Upload file to Supabase Storage
        const safeFileName = sanitizeStorageFileName(file.name)
        const filePath = `${currentUser.id}/${editCoupleInfo.id}/${Date.now()}-${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from('couple-files')
          .upload(filePath, file.file, { upsert: true })

        if (uploadError) {
          console.error("Ã¢ÂÅ’ Storage upload error:", uploadError)
          alert(`Failed to upload ${file.name}: ${uploadError.message}`)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('couple-files')
          .getPublicUrl(filePath)

        const publicUrl = urlData.publicUrl

        // Save to database with real URL
        const result = await addFileToDB(currentUser.id, editCoupleInfo.id, {
          fileName: file.name,
          fileUrl: publicUrl,
          fileType: file.type,
          fileSize: file.size,
          category: "Uploaded"
        })

        if (result.ok && result.data) {
          // Add to local state
          const newFile = {
            id: result.data.id,
            name: file.name,
            size: formatFileSize(file.size),
            uploadedBy: officiantProfile?.name || "Officiant",
            date: new Date().toLocaleDateString(),
            type: file.type,
            url: publicUrl
          }
          setFiles(prev => [...prev, newFile])
          console.log("Ã¢Å“â€¦ File uploaded and saved:", file.name, publicUrl)
        } else {
          console.error("Ã¢ÂÅ’ Failed to save file to database:", file.name, result.error)
        }
      } catch (err: any) {
        console.error("Ã¢ÂÅ’ Exception uploading file:", file.name, err)
        alert(`Failed to upload ${file.name}: ${err.message}`)
      }
    }
  }

  const handleFileRemoved = async (fileId: string) => {
    const numericId = parseInt(fileId)

    // Optimistically remove from local state
    const removedFile = files.find(f => f.id.toString() === fileId)
    setFiles(prev => prev.filter(f => f.id.toString() !== fileId))

    // Delete from database
    const result = await deleteFileFromDB(numericId)

    if (!result.ok) {
      // Revert on error
      console.error("Ã¢ÂÅ’ Failed to delete file:", result.error)
      if (removedFile) {
        setFiles(prev => [...prev, removedFile])
      }
    } else {
      console.log("Ã¢Å“â€¦ File deleted:", fileId)
    }
  }

  const handleMessageAttachmentsUploaded = (uploadedFiles: UploadedFile[]) => {
    setMessageAttachments(prev => [...prev, ...uploadedFiles])
    setShowAttachments(true)
  }

  const handleMessageAttachmentRemoved = (fileId: string) => {
    setMessageAttachments(prev => prev.filter(f => f.id !== fileId))
    if (messageAttachments.length <= 1) {
      setShowAttachments(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'IMG'
    if (fileType.startsWith('video/')) return 'VID'
    if (fileType.startsWith('audio/')) return 'AUD'
    if (fileType.includes('pdf')) return 'PDF'
    if (fileType.includes('document') || fileType.includes('word')) return 'DOC'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'XLS'
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'PPT'
    if (fileType.includes('zip') || fileType.includes('archive')) return 'ZIP'
    return 'FILE'
  }

  const handleSendMessage = async (
    messageOverride?: string,
    attachmentsOverride?: UploadedFile[],
    options?: { recipientEmails?: string[]; subject?: string }
  ) => {
    const outgoingMessage = typeof messageOverride === "string" ? messageOverride : newMessage
    const outgoingAttachments = attachmentsOverride || messageAttachments

    if (!outgoingMessage.trim() && outgoingAttachments.length === 0) {
      return
    }

    if (isSendingMessage) return
    setIsSendingMessage(true)

    try {
      // Get couple info
      const coupleId = editCoupleInfo?.id || allCouples[activeCoupleIndex]?.id
      const coupleName = `${editCoupleInfo?.brideName || allCouples[activeCoupleIndex]?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || allCouples[activeCoupleIndex]?.groomName || 'Partner 2'}`

      // Determine recipient emails
      const recipientEmails = options?.recipientEmails?.length
        ? options.recipientEmails
        : getCurrentCoupleRecipientEmails()

      if (recipientEmails.length === 0) {
        alert("No recipient email is saved for this ceremony. Add a primary or secondary contact email before sending a message.")
        return
      }

      console.log("[SCRIPT]Â§ Sending message to:", { coupleId, coupleName, recipientEmails, message: outgoingMessage })

      // 1. Save message to Supabase
      if (currentUser) {
        const messageData = {
          user_id: currentUser.id,
          couple_id: coupleId,
          sender: "officiant",
          sender_name: officiantLabel,
          content: outgoingMessage || "(File attachments)",
          read: true, // Officiant's own message is read
          created_at: new Date().toISOString(),
        }

        const { data: savedMessage, error: saveError } = await supabase
          .from("messages")
          .insert([messageData])
          .select()

        if (saveError) {
          console.error("Ã¢ÂÅ’ Error saving message to Supabase:", saveError)
        } else {
          console.log("Ã¢Å“â€¦ Message saved to Supabase:", savedMessage)

          // Add to local messages state, unless the realtime listener already added it.
          setMessages(prev => {
            const messageExists = prev.some((message) => String(message.id) === String(savedMessage[0].id))
            if (messageExists) return prev

            const createdAt = savedMessage[0].created_at || new Date().toISOString()

            return [{
              id: savedMessage[0].id,
              sender: officiantLabel,
              role: "officiant",
              message: outgoingMessage || "(File attachments)",
              timestamp: "Just now",
              createdAt,
              avatar: "/api/placeholder/40/40"
            }, ...prev]
          })
        }
      }

      // 2. Send email via API
      let emailsSent = 0
      let emailErrors: string[] = []

      for (const email of recipientEmails) {
        if (!email) continue

        try {
          console.log(`[SCRIPT]Â§ Attempting to send email to: ${email}`)

          // Build attachments array - include both scripts (textContent) and files (base64Content)
          const emailAttachments = outgoingAttachments
            .filter(att => att.textContent || att.base64Content)
            .map(att => {
              if (att.textContent) {
                // Script: text content
                return {
                  filename: att.name,
                  content: att.textContent,
                  contentType: 'text'
                }
              } else if (att.base64Content) {
                // File: base64 content
                return {
                  filename: att.name,
                  content: att.base64Content,
                  contentType: 'base64'
                }
              }
              return null
            })
            .filter(Boolean)

          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: options?.subject || `Message from ${officiantLabel} - Wedding Planning`,
              message: outgoingMessage || "(File attachments)",
              fromName: officiantLabel,
              coupleName: coupleName,
              coupleId: coupleId,
              officiantId: currentUser?.id,
              // Include all attachments (scripts and files)
              attachments: emailAttachments
            })
          })

          const result = await response.json()
          console.log(`[SCRIPT]Â§ API Response for ${email}:`, result)

          if (response.ok && result.success) {
            console.log(`Ã¢Å“â€¦ Email sent to ${email}:`, result)
            emailsSent++
          } else {
            const errorMsg = result.error || result.details || "Unknown error"
            console.error(`Ã¢ÂÅ’ Failed to send email to ${email}:`, result)
            emailErrors.push(`${email}: ${errorMsg}`)
          }
        } catch (emailError) {
          console.error(`Ã¢ÂÅ’ Error sending email to ${email}:`, emailError)
          emailErrors.push(`${email}: Network error`)
        }
      }

      // Clear message and attachments
      setNewMessage("")
      setMessageAttachments([])
      setShowAttachments(false)

      // Log results (no popup - the message appears in the conversation)
      if (emailsSent > 0) {
        console.log(`Ã¢Å“â€¦ Emails sent to: ${recipientEmails.join(", ")}`)
      }
      if (emailErrors.length > 0) {
        console.warn(`[WARNING]Â Ã¯Â¸Â Some emails failed:`, emailErrors)
        if (emailsSent === 0) {
          alert(`Message saved in the portal, but email delivery failed: ${emailErrors.join("; ")}`)
        }
      }

    } catch (error) {
      console.error("Ã¢ÂÅ’ Error in handleSendMessage:", error)
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const saveInvoiceServiceItem = async (item: any) => {
    if (!currentUser?.id || !item.service?.trim()) return null

    const result = await addInvoiceServiceToDB(currentUser.id, {
      service: item.service,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      rate: item.rate,
    })

    if (result.ok && result.data) {
      setSavedInvoiceServices(prev => {
        const withoutDuplicate = prev.filter(service => service.id !== result.data?.id && service.service !== result.data?.service)
        return [...withoutDuplicate, result.data].sort((a, b) => a.service.localeCompare(b.service))
      })
      return result.data
    }

    console.error("Failed to save invoice service:", result.error)
    return null
  }

  const handleSaveInvoiceService = async (item: any) => {
    const saved = await saveInvoiceServiceItem(item)
    if (!saved) {
      alert("Please add a service name before saving it.")
    }
  }

  const handleDeleteInvoiceService = async (serviceId: number) => {
    const result = await deleteInvoiceServiceFromDB(serviceId)
    if (!result.ok) {
      alert(`Failed to delete service: ${result.error}`)
      return
    }

    setSavedInvoiceServices(prev => prev.filter(service => service.id !== serviceId))
  }

  const handleQuickAddInvoiceService = (serviceId: string) => {
    const savedService = savedInvoiceServices.find(service => service.id.toString() === serviceId)
    if (!savedService) return

    const newItem = {
      id: Date.now(),
      service: savedService.service,
      description: savedService.description || "",
      category: savedService.category || "Ceremony Services",
      quantity: savedService.quantity || 1,
      rate: Number(savedService.rate) || 0,
      amount: (savedService.quantity || 1) * (Number(savedService.rate) || 0),
    }

    setInvoiceForm(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  // Handle opening invoice generation dialog
  const handleOpenInvoiceDialog = () => {
    // Generate invoice number with ceremony-specific format
    const invoiceNumber = `WED-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30) // 30 days from today
    const weddingDetails = editCoupleInfo?.weddingDetails || editWeddingDetails

    setInvoiceForm(prev => ({
      ...prev,
      invoiceNumber,
      invoiceDate: today,
      dueDate: dueDate.toISOString().split('T')[0],
      coupleName: `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`,
      weddingDate: weddingDetails?.weddingDate || "",
      venue: weddingDetails?.venueName || "",
      depositPaid: 0,
      balanceDue: 0
    }))

    setShowGenerateInvoiceDialog(true)
  }

  // Calculate invoice totals
  const calculateInvoiceTotals = () => {
    const subtotal = invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const taxAmount = subtotal * (invoiceForm.taxRate / 100)
    const total = subtotal + taxAmount

    setInvoiceForm(prev => ({
      ...prev,
      subtotal,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    }))
  }

  // Generate invoice email content
  const generateLegacyInvoiceContent = () => {
    const totals = calculateInvoiceValues(invoiceForm)

    return `Dear ${getFirstName(editCoupleInfo?.brideName)} and ${getFirstName(editCoupleInfo?.groomName)},

Congratulations on your upcoming wedding! Please find your ceremony services invoice attached.

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
Å½Å  WEDDING CEREMONY INVOICE Å½Å 
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

COUPLE: ${invoiceForm.coupleName}
WEDDING DATE: ${new Date(invoiceForm.weddingDate).toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})}
VENUE: ${invoiceForm.venue}

INVOICE DETAILS:
* Invoice #: ${invoiceForm.invoiceNumber}
* Invoice Date: ${new Date(invoiceForm.invoiceDate).toLocaleDateString()}
* Due Date: ${new Date(invoiceForm.dueDate).toLocaleDateString()}

SERVICES PROVIDED:
${invoiceForm.items.map(item =>
  `* ${item.service}
  Description: ${item.description}
  Category: ${item.category || 'Ceremony Services'}
  Rate: ${item.quantity}x ${item.rate} = ${item.quantity * item.rate}`
).join('\n\n')}

PAYMENT SUMMARY:
* Subtotal: ${formatCurrency(totals.subtotal)}
${invoiceForm.taxRate > 0 ? `* Tax (${invoiceForm.taxRate}%): ${formatCurrency(totals.taxAmount)}` : ''}
* Deposit Previously Paid: -${formatCurrency(totals.depositPaid)}
* Balance Due: ${formatCurrency(totals.balanceDue)}
* TOTAL INVOICE AMOUNT: ${formatCurrency(totals.total)}

PAYMENT METHODS ACCEPTED:
${invoiceForm.paymentMethods}

ONLINE PAYMENT:
Stripe payment link will be added here once the officiant Stripe setup is connected.

${invoiceForm.bankDetails ? `BANKING INFORMATION:\n${invoiceForm.bankDetails}\n` : ''}

TERMS & CONDITIONS:
${invoiceForm.terms}

ADDITIONAL NOTES:
${invoiceForm.notes}

We're honored to be part of your special day and look forward to creating a beautiful ceremony that reflects your love story!

Blessings,
${officiantLabel}${officiantPhone ? `\n[SCRIPT]Å¾ ${officiantPhone}` : ''}${officiantEmail ? `\n[SCRIPT]Â§ ${officiantEmail}` : ''}${officiantProfile?.website ? `\nÅ’Â ${officiantProfile.website}` : ''}

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â`
  }

  const generateInvoiceContent = (paymentUrl?: string) => {
    const totals = calculateInvoiceValues(invoiceForm)
    const weddingDate = invoiceForm.weddingDate
      ? new Date(invoiceForm.weddingDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'To be confirmed'
    const invoiceDate = invoiceForm.invoiceDate ? new Date(invoiceForm.invoiceDate).toLocaleDateString() : ''
    const dueDate = invoiceForm.dueDate ? new Date(invoiceForm.dueDate).toLocaleDateString() : ''
    const services = invoiceForm.items.map(item => {
      const lineTotal = item.quantity * item.rate
      return [
        `- ${item.service}`,
        item.description ? `  Description: ${item.description}` : '',
        `  Category: ${item.category || 'Ceremony Services'}`,
        `  Quantity x Rate: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(lineTotal)}`,
      ].filter(Boolean).join('\n')
    }).join('\n\n')

    return `Dear ${getFirstName(editCoupleInfo?.brideName)} and ${getFirstName(editCoupleInfo?.groomName)},

Please find your ceremony services invoice below.

Ceremony Invoice

Client / honoree names: ${invoiceForm.coupleName}
Ceremony date: ${weddingDate}
Venue: ${invoiceForm.venue || 'To be confirmed'}

Invoice Details
Invoice #: ${invoiceForm.invoiceNumber}
Invoice date: ${invoiceDate}
Due date: ${dueDate}

Services Provided
${services}

Payment Summary
Subtotal: ${formatCurrency(totals.subtotal)}
${invoiceForm.taxRate > 0 ? `Tax (${invoiceForm.taxRate}%): ${formatCurrency(totals.taxAmount)}\n` : ''}Deposit previously paid: -${formatCurrency(totals.depositPaid)}
Balance due: ${formatCurrency(totals.balanceDue)}
Total invoice amount: ${formatCurrency(totals.total)}

Payment Methods Accepted
${invoiceForm.paymentMethods}

Make a Payment
${paymentUrl || 'Your officiant will send a secure online payment link separately.'}

${invoiceForm.bankDetails ? `Banking Information\n${invoiceForm.bankDetails}\n` : ''}
Terms and Conditions
${invoiceForm.terms}

Additional Notes
${invoiceForm.notes}

We're honored to be part of your special day and look forward to creating a meaningful ceremony.

Warm regards,
${officiantLabel}${officiantPhone ? `\nPhone: ${officiantPhone}` : ''}${officiantEmail ? `\nEmail: ${officiantEmail}` : ''}${officiantProfile?.website ? `\nWebsite: ${officiantProfile.website}` : ''}`
  }

  const getInvoiceRecipients = () => {
    if (invoiceForm.emailRecipients === 'both') {
      return [editCoupleInfo.brideEmail, editCoupleInfo.groomEmail]
        .filter((email): email is string => Boolean(email?.trim()))
        .filter((email, index, all) => all.indexOf(email) === index)
    }

    if (invoiceForm.emailRecipients === 'bride') {
      return editCoupleInfo.brideEmail ? [editCoupleInfo.brideEmail] : []
    }

    if (invoiceForm.emailRecipients === 'groom') {
      return editCoupleInfo.groomEmail ? [editCoupleInfo.groomEmail] : []
    }

    if (invoiceForm.emailRecipients === 'custom') {
      return []
    }

    return invoiceForm.emailRecipients?.trim() ? [invoiceForm.emailRecipients.trim()] : []
  }

  // Handle invoice generation and sending
  const handleGenerateAndSendInvoice = async () => {
    if (isSendingInvoice) return

    if (!invoiceForm.invoiceNumber.trim()) {
      alert('Please enter an invoice number.')
      return
    }

    if (!invoiceForm.invoiceDate) {
      alert('Please select an invoice date.')
      return
    }

    if (!invoiceForm.dueDate) {
      alert('Please select a due date.')
      return
    }

    if (invoiceForm.items.some(item => !item.service.trim())) {
      alert('Please fill in all service names.')
      return
    }

    const recipients = getInvoiceRecipients()
    if (recipients.length === 0) {
      alert('Please select at least one valid invoice recipient.')
      return
    }

    const totals = calculateInvoiceValues(invoiceForm)
    setInvoiceForm(prev => ({ ...prev, ...totals }))

    if (!currentUser?.id || !editCoupleInfo?.id) {
      alert('Unable to save this invoice because the user or couple record is missing.')
      return
    }

    setIsSendingInvoice(true)
    let invoiceContent = ""

    try {
      await Promise.all(invoiceForm.items.map(item => saveInvoiceServiceItem(item)))

      const paymentResult = await addPaymentToDB(currentUser.id, editCoupleInfo.id, {
        invoiceNumber: invoiceForm.invoiceNumber,
        description: `Invoice ${invoiceForm.invoiceNumber} - ${invoiceForm.coupleName}`,
        amount: totals.balanceDue,
        paymentType: "invoice",
        status: "pending",
        dueDate: invoiceForm.dueDate,
      })

      if (!paymentResult.ok || !paymentResult.data?.id) {
        throw new Error(paymentResult.error || "Invoice email was not sent because the payment record could not be saved.")
      }

      const siteUrl = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://portal.ordainedpro.com"
      const paymentPortalUrl = `${siteUrl}/pay/invoice/${paymentResult.data.id}`
      invoiceContent = generateInvoiceContent(paymentPortalUrl)

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipients,
          subject: "Ceremony Invoice From Your Officiant",
          message: invoiceContent,
          fromName: officiantName,
          coupleName: invoiceForm.coupleName,
          coupleId: editCoupleInfo?.id,
          officiantId: currentUser?.id,
          emailTitle: "Ceremony Invoice",
          emailSubtitle: "From Your Officiant",
          actionUrl: paymentPortalUrl,
          actionLabel: "Make a payment",
          attachments: [
            {
              filename: `${invoiceForm.invoiceNumber}.txt`,
              content: invoiceContent,
              contentType: "text",
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Failed to send invoice email.")
      }

      loadPaymentsForCouple()
      loadFinancialPaymentsForUser()

      setShowGenerateInvoiceDialog(false)
      console.log(`Invoice ${invoiceForm.invoiceNumber} generated and sent to ${recipients.join(", ")}`)
      return
    } catch (error) {
      console.error("Failed to generate/send invoice:", error)
      alert(error instanceof Error ? error.message : "Failed to send invoice.")
      return
    } finally {
      setIsSendingInvoice(false)
    }
    setNewMessage(`[SCRIPT]Â§ Wedding Invoice Sent

Couple: ${invoiceForm.coupleName}
Sent to: ${recipients}
Â§Â¾ Invoice #: ${invoiceForm.invoiceNumber}
â€™â€™ Wedding Date: ${new Date(invoiceForm.weddingDate).toLocaleDateString()}
Ââ€ºÃ¯Â¸Â Venue: ${invoiceForm.venue}

â€™Â° FINANCIAL SUMMARY:
* Total Services: ${invoiceForm.total}
* Deposit Paid: ${invoiceForm.depositPaid}
* Balance Due: ${invoiceForm.balanceDue}
[SCRIPT]â€¦ Payment Due: ${new Date(invoiceForm.dueDate).toLocaleDateString()}

[SCRIPT]â€¹ SERVICES INCLUDED:
${invoiceForm.items.map(item => `* ${item.service} - ${item.quantity * item.rate}`).join('\n')}

â€™Â³ Payment Methods: ${invoiceForm.paymentMethods}

${invoiceContent}`)
    setShowAttachments(true)

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage()
    }, 100)

    // Close dialog
    setShowGenerateInvoiceDialog(false)

    console.log(`Invoice ${invoiceForm.invoiceNumber} generated and sent to ${recipients}`)
    alert(`Invoice ${invoiceForm.invoiceNumber} has been generated and sent successfully to ${recipients}!`)
  }

  // Effect to handle script editor setup and formatting preservation
  useEffect(() => {
    if (showScriptEditorDialog && editingScript) {
      // Use a longer delay to ensure the dialog and editor are fully rendered
      const timeoutId = setTimeout(() => {
        const editorElement = editorRef.current || document.getElementById('script-editor') as HTMLDivElement

        if (editorElement) {
          // Ensure proper formatting preservation
          editorElement.style.whiteSpace = 'pre-wrap'
          editorElement.style.wordWrap = 'break-word'

          // Always set the content, whether it's empty or not
          editorElement.innerHTML = scriptContent || ''
          console.log('Editor setup - Content set:', scriptContent ? scriptContent.substring(0, 100) + '...' : 'EMPTY')

          // Focus the editor
          editorElement.focus()

          // Place cursor at the end of content
          const range = document.createRange()
          const selection = window.getSelection()

          if (editorElement.childNodes.length > 0) {
            const lastNode = editorElement.childNodes[editorElement.childNodes.length - 1]
            if (lastNode.nodeType === Node.TEXT_NODE) {
              range.setStart(lastNode, lastNode.textContent?.length || 0)
            } else {
              range.setStartAfter(lastNode)
            }
          } else {
            range.setStart(editorElement, 0)
          }

          range.collapse(true)
          selection?.removeAllRanges()
          selection?.addRange(range)

          console.log('Script editor fully initialized:', {
            scriptTitle: editingScript.title,
            contentLength: scriptContent?.length || 0,
            editorReady: true
          })
        } else {
          console.error('Editor element not found!')
        }
      }, 200) // Increased delay

      return () => clearTimeout(timeoutId)
    }
  }, [showScriptEditorDialog, editingScript, scriptContent])

  // Additional effect to ensure content stays synced during editing
  useEffect(() => {
    if (showScriptEditorDialog && scriptContent !== undefined) {
      const editorElement = editorRef.current || document.getElementById('script-editor') as HTMLDivElement

      if (editorElement && editorElement.innerHTML !== scriptContent) {
        // Only update if the content is actually different to avoid cursor issues
        const currentPlainText = editorElement.innerText || ''
        const statePlainText = scriptContent.replace(/<[^>]*>/g, '') || ''

        if (currentPlainText !== statePlainText) {
          editorElement.innerHTML = scriptContent
          console.log('Content sync - Updated editor:', scriptContent?.substring(0, 50) + '...')
        }
      }
    }
  }, [scriptContent, showScriptEditorDialog])

  // Handle sending generated script to editor
  const handleSendToEditor = async () => {
    if (!hasGeneratedScript || !generatedScriptContent) {
      alert('No script has been generated yet. Please complete the ceremony planning process first.')
      return
    }

    // [CELEBRATE] Trigger confetti celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#ec4899']
    })

    // Multiple confetti bursts for extra celebration
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#ec4899']
      })
    }, 200)

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#ec4899']
      })
    }, 400)

    // Create a new script object similar to existing scripts
    const newScript = {
      id: Date.now(),
      coupleId: editCoupleInfo?.id,
      title: `Generated Ceremony Script - ${selectedCeremonyStyle || 'Custom'}`,
      content: generatedScriptContent,
      createdDate: new Date().toLocaleDateString(),
      type: selectedCeremonyStyle || 'Custom',
      status: 'draft'
    }
    const savedScript = await saveGeneratedScriptDraft({
      ...newScript,
      description: "Generated by Mr. Script"
    })
    const scriptForEditor = savedScript || newScript

    if (savedScript) {
      setGeneratedScripts(prev => [
        savedScript,
        ...prev.filter(script => String(script.id) !== String(savedScript.id))
      ])
    }

    // Set up the editor with the generated content
    setEditingScript(scriptForEditor)
    setScriptContent(generatedScriptContent)
    setShowScriptEditorDialog(true)
  }

  const cleanScriptText = (content: string) =>
    content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<p>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim()

  const handlePrintScript = () => {
    const contentToPrint = scriptContent || generatedScriptContent
    if (!contentToPrint.trim()) {
      alert("Please generate or open a script before printing.")
      return
    }

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${editingScript?.title || "Ceremony Script"}</title>
          <style>
            body { font-family: Georgia, serif; font-size: 16px; line-height: 1.7; padding: 48px; color: #111827; }
            h1 { font-family: Arial, sans-serif; font-size: 24px; margin-bottom: 8px; }
            .meta { font-family: Arial, sans-serif; color: #4b5563; margin-bottom: 32px; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          <h1>${editingScript?.title || "Ceremony Script"}</h1>
          <div class="meta">Prepared with Mr. Script</div>
          <main>${contentToPrint}</main>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const handleEmailCoupleScriptReview = () => {
    const recipients = [editCoupleInfo?.brideEmail, editCoupleInfo?.groomEmail]
      .filter(Boolean)
      .join(",")

    if (!recipients) {
      alert("No couple email addresses are available for this ceremony.")
      return
    }

    const subject = encodeURIComponent(`Script review: ${editingScript?.title || "Ceremony Script"}`)
    const body = encodeURIComponent(`Hi ${getFirstName(editCoupleInfo?.brideName)} and ${getFirstName(editCoupleInfo?.groomName)},

I prepared a ceremony script draft for your review.

Please look it over and reply with any edits, favorite parts, details you would like added, or anything you would like softened or removed.

Thank you,
${officiantProfile?.name || "Your officiant"}`)

    window.location.href = `mailto:${recipients}?subject=${subject}&body=${body}`
  }

  // Handle script modification requests
  const handleScriptModification = (request: string) => {
    setIsTyping(true)

    setTimeout(() => {
      // Create modified script based on request
      let updatedScript = generatedScriptContent
      const lowerRequest = request.toLowerCase()

      // AI response acknowledging the modification
      let modificationResponse = `I'll update your ceremony script based on your request: "${request}"\n\n`

      // Apply common modifications
      if (lowerRequest.includes('shorter') || lowerRequest.includes('brief')) {
        modificationResponse += "Ã¢Å“â€¦ Made the ceremony more concise and streamlined\n"
        updatedScript = updatedScript.replace(/\[.*?\]/g, '') // Remove bracketed instructions
      } else if (lowerRequest.includes('longer') || lowerRequest.includes('more detail')) {
        modificationResponse += "Ã¢Å“â€¦ Added more detailed elements and explanations\n"
        updatedScript += `\n\nADDITIONAL ELEMENTS\n[Additional ceremonial elements and personal touches as requested]\n`
      } else if (lowerRequest.includes('personal') || lowerRequest.includes('customize')) {
        modificationResponse += "Ã¢Å“â€¦ Added more personalized elements\n"
        updatedScript = updatedScript.replace('EXCHANGE OF VOWS', 'PERSONALIZED EXCHANGE OF VOWS\n[Customized vows reflecting the couple\'s unique relationship]')
      } else if (lowerRequest.includes('music') || lowerRequest.includes('song')) {
        modificationResponse += "Ã¢Å“â€¦ Added music cues and recommendations\n"
        updatedScript = updatedScript.replace('PROCESSIONAL', 'PROCESSIONAL\n[Suggested music: "Canon in D" or couple\'s chosen processional song]')
      } else if (lowerRequest.includes('reading') || lowerRequest.includes('poem')) {
        modificationResponse += "Ã¢Å“â€¦ Added reading section\n"
        updatedScript = updatedScript.replace('EXCHANGE OF VOWS', 'SPECIAL READING\n[Insert chosen reading, poem, or scripture here]\n\nEXCHANGE OF VOWS')
      } else {
        modificationResponse += "Ã¢Å“â€¦ Applied your requested changes to the script\n"
        updatedScript += `\n\nCUSTOM MODIFICATION\n[Modified based on request: ${request}]\n`
      }

      // Update the script content
      setGeneratedScriptContent(updatedScript)

      modificationResponse += "\nYour updated script is ready! The 'Generate Final Script' button will now include these changes."

      const responseMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: modificationResponse,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, responseMessage])
      setIsTyping(false)
    }, 1500)
  }
  const mrScriptServiceSelection = selectedCeremonyStyle || userResponses['ceremony-type']
  const activeGuidedQuestions = getActiveGuidedQuestions({
    ...userResponses,
    'ceremony-type': mrScriptServiceSelection
  })
  const selectedMrScriptService = getMrScriptServiceByResponse(mrScriptServiceSelection)
  const storyPromptSuggestions = getMrScriptStoryPrompts(mrScriptServiceSelection)
  const getGuidedQuickResponseOptions = () => {
    const mergedResponses = buildQuickSetupResponses(userResponses)
    const activeQuestions = getActiveGuidedQuestions(mergedResponses)
    const currentQuestion = activeQuestions[currentQuestionIndex]
    const service = getMrScriptServiceByResponse(mergedResponses["ceremony-type"])

    if (mergedResponses[PENDING_LOVED_ONE_HONOR_KEY] === "true") {
      return ["Keep it general", "Mention by name", "Skip"]
    }

    if (!currentQuestion) return []

    if (currentQuestion.type === "multiple-choice") {
      return currentQuestion.options || []
    }

    if (currentQuestion.id === "core-details") {
      const detailQuestions = getGuidedDetailQuestions(currentQuestion, mergedResponses)
      const detailIndex = getFirstUnansweredGuidedDetailIndex(currentQuestion, mergedResponses)
      const detailPrompt = detailQuestions[detailIndex]?.toLowerCase() || ""

      if (/\btone\b|\bfeel\b/.test(detailPrompt)) {
        return getToneQuickChoices(service)
      }

      if (/\bwhat kind of piece\b|\bpiece should be written\b/.test(detailPrompt)) {
        return ["Eulogy", "Vows", "Toast", "Speech", "Reading", "Ceremony outline"]
      }
    }

    if (currentQuestion.id === "story-notes") {
      return service.sensitivity === "grief"
        ? ["Warm tribute", "Funny memory", "Family story", "Legacy", "Faith", "Skip"]
        : ["Romantic", "Funny story", "How they met", "Proposal", "Family", "Future hopes", "Skip"]
    }

    if (currentQuestion.id === "special-inclusions") {
      return ["Reading", "Prayer", "Remembrance", "Family involvement", "Music", "None"]
    }

    if (currentQuestion.id === "avoidances") {
      return ["None", "Keep it secular", "Avoid humor", "Avoid long readings", "Keep it general"]
    }

    return []
  }

  const portalContextValue = {
    getCoupleColors,
    GUIDED_QUESTIONS,
    activeGuidedQuestions,
    selectedMrScriptService,
    storyPromptSuggestions,
    getGuidedQuickResponseOptions,
    generateAIResponse,
    generateRecommendation,
    generateCompleteScript,
    currentUser,
    setCurrentUser,
    officiantProfile,
    setOfficiantProfile,
    messages,
    setMessages,
    isSendingMessage,
    setIsSendingMessage,
    selectedDate,
    setSelectedDate,
    newMessage,
    setNewMessage,
    newTask,
    setNewTask,
    showAddCeremonyDialog,
    setShowAddCeremonyDialog,
    showEditCoupleDialog,
    setShowEditCoupleDialog,
    showAddTaskDialog,
    setShowAddTaskDialog,
    showScheduleMeetingDialog,
    setShowScheduleMeetingDialog,
    showContractUploadDialog,
    setShowContractUploadDialog,
    editingContractForUpload,
    setEditingContractForUpload,
    showEditWeddingDialog,
    setShowEditWeddingDialog,
    showAddEventDialog,
    setShowAddEventDialog,
    showEditMeetingDialog,
    setShowEditMeetingDialog,
    showFileViewerDialog,
    setShowFileViewerDialog,
    showContractViewerDialog,
    setShowContractViewerDialog,
    showSendContractDialog,
    setShowSendContractDialog,
    showSendPaymentReminderDialog,
    setShowSendPaymentReminderDialog,
    showGenerateInvoiceDialog,
    setShowGenerateInvoiceDialog,
    sendingContract,
    setSendingContract,
    isSendingContractEmail,
    emailForm,
    setEmailForm,
    contractPrefillDefaults,
    setContractPrefillDefaults,
    hasAcceptedDefaultContractLegal,
    acceptDefaultContractLegalAcknowledgment,
    acceptUploadedContractLegalAcknowledgment,
    paymentReminderForm,
    setPaymentReminderForm,
    invoiceForm,
    setInvoiceForm,
    savedInvoiceServices,
    setSavedInvoiceServices,
    isSendingInvoice,
    viewingContract,
    setViewingContract,
    viewingFile,
    setViewingFile,
    editMeetingForm,
    setEditMeetingForm,
    addEventForm,
    setAddEventForm,
    isCeremonyActive,
    setIsCeremonyActive,
    taskFilter,
    setTaskFilter,
    messageAttachments,
    setMessageAttachments,
    ceremonyFiles,
    setCeremonyFiles,
    showAttachments,
    setShowAttachments,
    savedCeremonies,
    setSavedCeremonies,
    allCouples,
    setAllCouples,
    activeCoupleIndex,
    setActiveCoupleIndex,
    showSwitchCeremonyDialog,
    setShowSwitchCeremonyDialog,
    showArchivedCeremoniesDialog,
    setShowArchivedCeremoniesDialog,
    showDashboardDialog,
    setShowDashboardDialog,
    dashboardInitialView,
    setDashboardInitialView,
    showRefundsDialog,
    setShowRefundsDialog,
    newCeremony,
    setNewCeremony,
    ceremonyTypeOptions: CEREMONY_TYPE_OPTIONS,
    getCeremonyTypeConfig,
    editCoupleInfo,
    setEditCoupleInfo,
    savedWeddingDetails,
    setSavedWeddingDetails,
    currentCoupleId,
    editWeddingDetails,
    setEditWeddingDetails,
    aiChatMessages,
    setAiChatMessages,
    aiInput,
    setAiInput,
    isGeneratingScript,
    setIsGeneratingScript,
    generatedScripts,
    setGeneratedScripts,
    scriptBuilderTab,
    setScriptBuilderTab,
    scriptMode,
    setScriptMode,
    showGuidedChatbot,
    setShowGuidedChatbot,
    chatMessages,
    setChatMessages,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    userResponses,
    setUserResponses,
    isTyping,
    setIsTyping,
    chatInput,
    setChatInput,
    ceremonyProfile,
    setCeremonyProfile,
    selectedCeremonyStyle,
    setSelectedCeremonyStyle,
    selectedCeremonyLength,
    setSelectedCeremonyLength,
    selectedUnityCeremony,
    setSelectedUnityCeremony,
    selectedVowsType,
    setSelectedVowsType,
    selectedOfficiantStyle,
    setSelectedOfficiantStyle,
    storyNotes,
    setStoryNotes,
    hasGeneratedScript,
    setHasGeneratedScript,
    generatedScriptContent,
    setGeneratedScriptContent,
    premiumScriptUses,
    premiumScriptUsesRemaining,
    premiumScriptLimit: PREMIUM_SCRIPT_LIMIT,
    scriptVersionHistory,
    setScriptVersionHistory,
    chatMessagesRef,
    loadMessages,
    formatMessageTime,
    showScriptEditorDialog,
    setShowScriptEditorDialog,
    showScriptViewerDialog,
    setShowScriptViewerDialog,
    showShareScriptDialog,
    setShowShareScriptDialog,
    editingScript,
    setEditingScript,
    viewingScript,
    setViewingScript,
    sharingScript,
    setSharingScript,
    scriptContent,
    setScriptContent,
    editorFontSize,
    setEditorFontSize,
    editorRef,
    cursorPositionRef,
    shareScriptForm,
    setShareScriptForm,
    selectedItemsToShare,
    setSelectedItemsToShare,
    displayMessages,
    tasks,
    setTasks,
    files,
    setFiles,
    meetings,
    setMeetings,
    currentCeremonyType,
    currentCeremonyConfig,
    isCurrentCeremonyWedding,
    upcomingEvents,
    setUpcomingEvents,
    calendarEvents,
    getSelectedDateDetails,
    getEventTypeIcon,
    getEventTypeColor,
    contracts,
    setContracts,
    handleAiMessage,
    generateAiResponse,
    handleGenerateScript,
    generateScriptContent,
    uploadedFiles,
    setUploadedFiles,
    handleModeSelect,
    initializeChatbot,
    askNextQuestion,
    handleChatSubmit,
    handleQuickResponse,
    generateFinalRecommendation,
    generateAndSaveScript,
    resetChatbot,
    handleGenerateRequest,
    insertTextAtCursor,
    applyFormatting,
    applyTextColor,
    increaseFontSize,
    decreaseFontSize,
    autoSave,
    handlePrintScript,
    handleEmailCoupleScriptReview,
    saveCursorPosition,
    restoreCursorPosition,
    handleEditScript,
    handleViewScript,
    handleDownloadScript,
    handleDeleteScript,
    handleRecordPayment,
    handleUploadScript,
    handleCreateNewScript,
    handleShareScript,
    handleSaveScript,
    handleSendScript,
    handleContractAction,
    handleContractUpdated,
    handleSendContractEmail: handleSendContractRealEmail,
    addDefaultContractForCurrentCouple,
    handleOpenPaymentReminderDialog,
    handleSendPaymentReminderEmail,
    handleContractUploaded,
    handleSaveInvoiceService,
    handleDeleteInvoiceService,
    handleQuickAddInvoiceService,
    paymentInfo,
    setPaymentInfo,
    paymentHistory,
    setPaymentHistory,
    allPaymentRecords,
    financialReport,
    financialRows,
    outstandingBalanceRows,
    refundRows,
    exportFinancialCsv,
    printFinancialReport,
    showInvoiceDialog,
    setShowInvoiceDialog,
    showRecordPaymentDialog,
    setShowRecordPaymentDialog,
    newPayment,
    setNewPayment,
    REFUND_FEE_RATE,
    uploadingScript,
    setUploadingScript,
    coupleScripts,
    setCoupleScripts,
    scriptSales,
    mainMarketplaceScriptCount,
    marketplaceTotalEarnings,
    marketplaceMonthEarnings,
    marketplaceSalesCount,
    marketplaceAverageSale,
    marketplaceTopScript,
    accountCreatedAt,
    showMarketplaceAnalytics,
    setShowMarketplaceAnalytics,
    showPayoutHistory,
    setShowPayoutHistory,
    handleUploadMarketplaceScript,
    handlePublishScriptToMarketplace,
    handleUnpublishScriptFromMarketplace,
    handleViewMarketplaceScript,
    myScripts,
    popularScripts,
    handleAddCeremony,
    handleEditCoupleInfo,
    handleOpenEditWeddingDialog,
    handleEditWeddingDetails,
    handleSwitchCouple,
    formatEventDate,
    handleAddWeddingEvent,
    handleDeleteWeddingEvent,
    handleDeleteMeeting,
    handleCancelMeeting,
    handleEditMeeting,
    handleUpdateMeeting,
    toggleCeremonyStatus,
    handleArchiveCoupleFromScript,
    handleUnarchiveCouple,
    handleAddTask,
    scheduleEmailNotification,
    generateTaskReminderEmail,
    toggleTaskCompletion,
    handleDeleteTask,
    getFilteredTasks,
    getPriorityColor,
    getPriorityIcon,
    handleScheduleMeeting,
    sendMeetingInvitation,
    simulateEmailResponses,
    updateMeetingStatus,
    getMeetingStatusColor,
    getMeetingStatusIcon,
    getMeetingTypeIcon,
    handleViewFile,
    handleEditFile,
    getContractViewerContent,
    getFileViewerContent,
    handleFilesUploaded,
    handleFileRemoved,
    handleMessageAttachmentsUploaded,
    handleMessageAttachmentRemoved,
    formatFileSize,
    getFileIcon,
    handleSendMessage,
    handleOpenInvoiceDialog,
    stripeConnectAccount,
    stripeConnectLoading,
    stripeConnectMessage,
    refreshStripeConnectStatus,
    handleStartStripeConnectOnboarding,
    handleOpenStripeExpressDashboard,
    calculateInvoiceTotals,
    generateInvoiceContent,
    handleGenerateAndSendInvoice,
    handleSendToEditor,
    handleScriptModification,
  }


  // Show loading state while couples are loading
  if (isLoadingCouples) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-900 font-medium">Loading your ceremonies...</p>
        </div>
      </div>
    )
  }

  // Show message if no couples exist
  if (!editCoupleInfo || allCouples.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">â€™â€™</div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">No Ceremonies Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't added any couples/ceremonies yet. Add your first ceremony to get started!
          </p>
          <Button
            onClick={() => setShowAddCeremonyDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Your First Ceremony
          </Button>
        </div>
      </div>
    )
  }

  return (
    <CommunicationPortalProvider value={portalContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <PortalHeader />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <PortalOverview />
          <PortalTabs />
        </div>
        <PortalDialogs />
      </div>
    </CommunicationPortalProvider>
  )
}
