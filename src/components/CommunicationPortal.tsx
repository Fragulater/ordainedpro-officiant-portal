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
  updateCouple as updateCoupleInDB,
  loadTasks as loadTasksFromDB,
  addTask as addTaskToDB,
  updateTask as updateTaskInDB,
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

// Safe helper to get first name from a full name (null-safe)
const getFirstName = (fullName: string | null | undefined): string => {
  if (!fullName || typeof fullName !== 'string') return 'Partner'
  return fullName.split(' ')[0] || 'Partner'
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

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

const formatContractMoney = (amount: number | string | null | undefined) => {
  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : Number(amount || 0)
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
  const balanceDue = Math.max(0, total - (form.depositPaid || 0))

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
  }
}

const marketplaceBaseUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://scripts.ordainedpro.com"
const MAIN_MARKETPLACE_SCRIPT_LIMIT = 10

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
    question: "What type of ceremony are you looking to officiate?",
    options: ['Traditional', 'Modern', 'Religious', 'Secular', 'Interfaith', 'Custom'],
    required: true,
    category: 'ceremony-type',
    aiRecommendation: "Traditional ceremonies include classic vows and ring exchanges, while modern ceremonies offer more flexibility for personalization."
  },
  {
    id: 'ceremony-duration',
    type: 'multiple-choice',
    question: "How long should the ceremony be?",
    options: ['15-20 minutes', '20-30 minutes', '30-45 minutes', '45+ minutes'],
    required: true,
    category: 'logistics',
    aiRecommendation: "Most wedding ceremonies are 20-30 minutes. Shorter ceremonies focus on essentials, while longer ones include more personal elements."
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

// AI Assistant Functions
const generateAIResponse = (question: Question, previousResponses: Record<string, string>): string => {
  const responses = [
    `Great! Let me ask you about ${question.category === 'ceremony-type' ? 'the type of ceremony' :
      question.category === 'logistics' ? 'the practical details' :
      question.category === 'personal' ? 'personal touches' : 'your preferences'}.`,

    `${question.question}`,

    question.aiRecommendation ? `’¡ ${question.aiRecommendation}` : ''
  ].filter(Boolean)

  return responses.join('\n\n')
}

const generateRecommendation = (responses: Record<string, string>): string => {
  const ceremonyType = responses['ceremony-type']
  const duration = responses['ceremony-duration']
  const tone = responses['ceremony-tone']

  let recommendation = "Based on your preferences, here's what I recommend for your ceremony script:\n\n"

  if (ceremonyType) {
    recommendation += `[SCRIPT] **Ceremony Style**: Since you've chosen a ${ceremonyType.toLowerCase()} ceremony, `
    if (ceremonyType === 'Traditional') {
      recommendation += "I'll include classic elements like traditional vows, ring exchange, and formal language.\n\n"
    } else if (ceremonyType === 'Modern') {
      recommendation += "I'll create a contemporary script with flexible elements and personalized touches.\n\n"
    } else if (ceremonyType === 'Religious') {
      recommendation += "I'll incorporate appropriate religious elements and blessings.\n\n"
    }
  }

  if (duration) {
    recommendation += `â° **Timing**: For a ${duration.toLowerCase()} ceremony, I'll structure the script with appropriate pacing and content.\n\n`
  }

  if (tone) {
    recommendation += `[STYLE] **Tone**: The ${tone.toLowerCase()} approach will be reflected in the language and style throughout.\n\n`
  }

  recommendation += "Would you like me to start generating your personalized ceremony script now? I can always adjust it based on any additional preferences you have!"

  return recommendation
}

// Generate a complete ceremony script based on user responses
const generateCompleteScript = (responses: Record<string, string>, coupleInfo: any, weddingDetails: any): string => {
  const ceremonyType = responses['ceremony-type'] || 'Traditional'
  const duration = responses['ceremony-duration'] || '20-30 minutes'
  const tone = responses['ceremony-tone'] || 'Warm and Personal'
  const unityCeremony = responses['special-elements'] || 'None'
  const vowsType = responses['vows-type'] || 'Traditional Vows'

  const brideName = coupleInfo.brideName || 'Sarah'
  const groomName = coupleInfo.groomName || 'David'
  const venue = weddingDetails.venueName || 'Sunset Gardens'
  const date = new Date(weddingDetails.weddingDate || '2024-08-25').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let script = `${ceremonyType.toUpperCase()} WEDDING CEREMONY SCRIPT
Generated by Mr. Script for ${brideName} & ${groomName}
${venue} - ${date}

PROCESSIONAL
[Music begins as wedding party enters]

OPENING WORDS
"Family and friends, we are gathered here today at ${venue} to celebrate the union of ${brideName} and ${groomName} in marriage. On this beautiful ${date}, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

${brideName} and ${groomName}, you have chosen to share your lives together, and we are honored to be part of this special moment."

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

export function CommunicationPortal({ onScriptUploaded }: CommunicationPortalProps = {}) {
  // Auth and profile state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [officiantProfile, setOfficiantProfile] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [isSendingMessage, setIsSendingMessage] = useState(false)

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
    weddingDate: '2024-08-25',
    coupleName: 'Sarah Johnson & David Chen',
    venue: 'Sunset Gardens',
    items: [
      {
        id: 1,
        service: 'Wedding Ceremony Officiant',
        description: 'Professional wedding ceremony officiation services including pre-ceremony consultation, personalized script, and ceremony performance',
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
    terms: 'Payment due within 30 days of invoice date. Final payment must be received at least 7 days before the wedding ceremony. Late payments may incur additional fees.',
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

  // Form states for Add New Ceremony
  const [newCeremony, setNewCeremony] = useState({
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
    groomName: "",
    groomEmail: "",
    groomPhone: "",
    groomAddress: "",
    totalAmount: "",
    depositAmount: "",
    finalPaymentDate: "",
    notes: ""
  })

  // Form states for Edit Couple Info - loaded from active couple (set when couples load)
  const [editCoupleInfo, setEditCoupleInfo] = useState<any>(null)

  // Persistent storage for wedding details per couple
  const [savedWeddingDetails, setSavedWeddingDetails] = useState<Record<string, any>>({
    "Sarah Johnson & David Chen": {
      venueName: "Sunset Gardens",
      venueAddress: "123 Rose Avenue, Garden City, CA 90210",
      weddingDate: "2024-08-25",
      startTime: "16:00",
      endTime: "18:00",
      expectedGuests: "75"
    }
  })

  // Get current couple identifier
  // Get current couple identifier (with null safety)
  const currentCoupleId = editCoupleInfo?.brideName
    ? `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
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
      content: "Hello! I'm Mr. Script, your personal wedding ceremony script creator. I specialize in crafting beautiful, meaningful ceremonies tailored to Sarah Johnson & David Chen. What type of ceremony are you looking to create today?",
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString()
    }
  ])
  const [aiInput, setAiInput] = useState("")
  const [isGeneratingScript, setIsGeneratingScript] = useState(false)
  const [generatedScripts, setGeneratedScripts] = useState([
    {
      id: 1,
      title: "Traditional Ceremony Script - Sarah & David",
      content: "SAMPLE GENERATED SCRIPT:\n\nDearly beloved, we are gathered here today to witness and celebrate the union of Sarah Johnson and David Chen in marriage...",
      createdDate: "Aug 10, 2024",
      type: "Traditional",
      status: "completed"
    }
  ])
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

  // Generated script tracking
  const [hasGeneratedScript, setHasGeneratedScript] = useState(false)
  const [generatedScriptContent, setGeneratedScriptContent] = useState("")

  // Chat scroll ref
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages, isTyping])

  // Log saved ceremonies for debugging
  useEffect(() => {
    if (savedCeremonies.length > 0) {
      console.log("[SCRIPT]‹ Saved Ceremonies:", savedCeremonies)
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
        console.log("âœ… Loaded user:", user.id)
        setCurrentUser(user)

        // Load officiant profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (profile) {
          console.log("âœ… Loaded profile:", profile.business_name)
          setOfficiantProfile(profile)
        }
      } catch (err) {
        console.error("Error loading user/profile:", err)
      }
    }

    loadUserAndProfile()
  }, [])

  // Load couples from database
  useEffect(() => {
    const loadCouples = async () => {
      if (!currentUser?.id) return

      setIsLoadingCouples(true)
      console.log("[USERS] Loading couples for user:", currentUser.id)

      const result = await loadCouplesFromDB(currentUser.id)

      if (result.ok && result.data && result.data.length > 0) {
        // Transform database format to component format
        const transformedCouples = result.data.map((c: any, index: number) => ({
          id: c.id, // This is the REAL database ID
          brideName: c.bride_name || "",
          brideEmail: c.bride_email || "",
          bridePhone: c.bride_phone || "",
          brideAddress: c.bride_address || "",
          groomName: c.groom_name || "",
          groomEmail: c.groom_email || "",
          groomPhone: c.groom_phone || "",
          groomAddress: c.groom_address || "",
          address: c.venue_address || "",
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
        }))

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
        console.log("âœ… Loaded", transformedCouples.length, "couples from database")
      } else {
        console.log("[SCRIPT]­ No couples found in database")
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
      console.log("[SCRIPT]¨ Loading messages for couple:", editCoupleInfo.id)

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("couple_id", editCoupleInfo.id)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("âŒ Error loading messages:", error)
        return
      }

      if (messagesData && messagesData.length > 0) {
        console.log("âœ… Loaded", messagesData.length, "messages")

        // Transform to display format
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          sender: msg.sender_name || (msg.sender === "officiant" ? "Officiant" : "Couple"),
          role: msg.sender,
          message: msg.content,
          timestamp: formatMessageTime(msg.created_at),
          avatar: "/api/placeholder/40/40"
        }))

        setMessages(formattedMessages)
      } else {
        console.log("[SCRIPT]­ No messages found for this couple")
        setMessages([])
      }
    } catch (err) {
      console.error("âŒ Error in loadMessages:", err)
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

            return [
              ...previousMessages,
              {
                id: newMessageRecord.id,
                sender:
                  newMessageRecord.sender_name ||
                  (newMessageRecord.sender === "officiant" ? officiantLabel : "Couple"),
                role: newMessageRecord.sender,
                message: newMessageRecord.content || newMessageRecord.body || "",
                timestamp: formatMessageTime(newMessageRecord.created_at || newMessageRecord.timestamp),
                avatar: "/api/placeholder/40/40",
              },
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

  // Load tasks when couple changes
  const loadTasksForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingTasks(true)
    console.log("[SCRIPT]‹ Loading tasks for couple:", editCoupleInfo.id)

    const result = await loadTasksFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedTasks: Task[] = result.data.map((t: any) => ({
        id: t.id,
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
      }))
      setTasks(transformedTasks)
      console.log("âœ… Loaded", transformedTasks.length, "tasks for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]­ No tasks found or error for couple", editCoupleInfo.id)
      setTasks([])
    }

    setIsLoadingTasks(false)
  }, [currentUser?.id, editCoupleInfo?.id])

  useEffect(() => {
    loadTasksForCouple()
  }, [loadTasksForCouple])

  // Load files when couple changes
  const loadFilesForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingFiles(true)
    console.log("[SCRIPT] Loading files for couple:", editCoupleInfo.id)

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
      console.log("âœ… Loaded", transformedFiles.length, "files for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]­ No files found or error for couple", editCoupleInfo.id)
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
    console.log("[SCRIPT]… Loading meetings for couple:", editCoupleInfo.id)

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
      console.log("âœ… Loaded", transformedMeetings.length, "meetings for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]­ No meetings found or error for couple", editCoupleInfo.id)
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
    console.log("[SCRIPT]œ Loading contracts for couple:", editCoupleInfo.id)

    const result = await loadContractsFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedContracts = result.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        status: c.status || "draft",
        signedDate: c.signed_date ? new Date(c.signed_date).toLocaleDateString() : "",
        sentDate: c.sent_date ? new Date(c.sent_date).toLocaleDateString() : "",
        createdDate: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
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
      }))
      setContracts(transformedContracts)
      console.log("âœ… Loaded", transformedContracts.length, "contracts for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]­ No contracts found or error for couple", editCoupleInfo.id)
      setContracts([])
    }

    setIsLoadingContracts(false)
  }, [currentUser?.id, editCoupleInfo?.id])

  useEffect(() => {
    loadContractsForCouple()
  }, [loadContractsForCouple])

  // Load payments when couple changes
  const loadPaymentsForCouple = useCallback(async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) return

    setIsLoadingPayments(true)
    console.log("’° Loading payments for couple:", editCoupleInfo.id)

    const result = await loadPaymentsFromDB(currentUser.id, editCoupleInfo.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedPayments = result.data.map((p: any) => ({
        id: p.id,
        date: p.paid_date || p.due_date || new Date(p.created_at).toLocaleDateString(),
        amount: p.amount,
        type: p.invoice_number || p.description || "Invoice",
        method: p.status === "paid" ? "Completed" : "Pending",
        status: p.status,
        description: p.notes || p.description || p.invoice_number || "Wedding ceremony invoice",
        dueDate: p.due_date
      }))
      setPaymentHistory(transformedPayments)

      // Calculate payment info from history
      const paidPayments = transformedPayments.filter((p: any) => p.status === "paid")
      const pendingPayments = transformedPayments.filter((p: any) => p.status === "pending")
      const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
      const totalPending = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)

      setPaymentInfo({
        totalAmount: totalPaid + totalPending,
        depositPaid: totalPaid,
        balance: totalPending,
        depositDate: paidPayments.length > 0 ? paidPayments[0].date : "",
        finalPaymentDue: pendingPayments.length > 0 ? pendingPayments[0].dueDate || "" : "",
        paymentStatus: totalPending === 0 && totalPaid > 0 ? "paid_in_full" : totalPaid > 0 ? "deposit_paid" : "pending"
      })

      console.log("âœ… Loaded", transformedPayments.length, "payments for couple", editCoupleInfo.id)
    } else {
      console.log("[SCRIPT]­ No payments found or error for couple", editCoupleInfo.id)
      setPaymentHistory([])
      setPaymentInfo({
        totalAmount: 0,
        depositPaid: 0,
        balance: 0,
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
        description: payment.notes || payment.description || payment.invoice_number || "Wedding ceremony invoice",
        amount: Number(payment.amount) || 0,
        type: payment.payment_method || payment.payment_type || "invoice",
        status: payment.status || "pending",
        dueDate: payment.due_date || "",
        paidDate: payment.paid_date || payment.created_at || "",
        createdAt: payment.created_at || "",
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
    console.log("[SCRIPT]œ Loading scripts for user:", currentUser.id)

    const result = await loadScriptsFromDB(currentUser.id, editCoupleInfo?.id)

    if (result.ok && result.data) {
      // Transform database format to component format
      const transformedScripts = result.data.map((s: any) => ({
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
        coupleId: s.couple_id,
        isPublished: s.is_published || false,
        price: Number(s.price) || 0,
        sales: s.sales_count || 0,
        earnings: Number(s.earnings_total) || 0,
        rating: Number(s.rating) || 0,
        marketplaceLanguages: Array.isArray(s.marketplace_languages) ? s.marketplace_languages : [],
        marketplaceCategories: Array.isArray(s.marketplace_categories) ? s.marketplace_categories : [],
        marketplaceCeremonyTypes: Array.isArray(s.marketplace_ceremony_types) ? s.marketplace_ceremony_types : [],
        marketplaceVisibility: s.marketplace_visibility || "main_marketplace",
        marketplacePublishedAt: s.marketplace_published_at,
        marketplaceUrl: s.marketplace_url || `${marketplaceBaseUrl}/scripts/${s.id}`,
        stripeProductId: s.stripe_product_id,
        stripePriceId: s.stripe_price_id
      }))
      setCoupleScripts(transformedScripts)
      console.log("âœ… Loaded", transformedScripts.length, "scripts from database")
    } else {
      console.log("[SCRIPT]­ No scripts found or error")
      // Keep default demo scripts if no database scripts
    }

    setIsLoadingScripts(false)
  }, [currentUser?.id, editCoupleInfo?.id])

  useEffect(() => {
    loadScriptsForUser()
  }, [loadScriptsForUser])

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

  // Display messages from Supabase (or empty state)
  const displayMessages = messages

  // Tasks are now loaded per couple from the database
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)

  // Files are now loaded per couple from the database
  const [files, setFiles] = useState<any[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)

  // Meetings are now loaded per couple from the database
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)

  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: 1, title: "Rehearsal", date: "2024-08-24", time: "6:00 PM", location: "Sunset Gardens", type: "rehearsal", details: "Final walkthrough of ceremony proceedings with all wedding party members" },
    { id: 2, title: "Wedding Ceremony", date: "2024-08-25", time: "4:00 PM", location: "Sunset Gardens", type: "ceremony", details: "The main wedding ceremony with family and friends" }
  ])

  // Calendar events data
  const calendarEvents = {
    "2024-08-15": {
      events: [
        { id: 1, time: "2:00 PM", title: "Pre-marriage Consultation", type: "meeting", location: `${officiantLabel}'s Office`, attendees: ["Sarah Johnson", "David Chen"] }
      ]
    },
    "2024-08-20": {
      events: [
        { id: 2, time: "3:00 PM", title: "Ceremony Planning Review", type: "meeting", location: "Video Call", attendees: ["Sarah Johnson", "David Chen"] }
      ]
    },
    "2024-08-22": {
      events: [
        { id: 3, time: "11:00 AM", title: "Final venue walkthrough", type: "task", location: "Sunset Gardens", attendees: [officiantLabel] },
        { id: 4, time: "2:00 PM", title: "Marriage license review", type: "task", location: "City Hall", attendees: [officiantLabel] }
      ]
    },
    "2024-08-24": {
      events: [
        { id: 5, time: "6:00 PM", title: "Wedding Rehearsal", type: "rehearsal", location: "Sunset Gardens", attendees: ["Wedding Party", officiantLabel] }
      ]
    },
    "2024-08-25": {
      events: [
        { id: 6, time: "3:00 PM", title: "Setup and preparation", type: "preparation", location: "Sunset Gardens", attendees: [officiantLabel] },
        { id: 7, time: "4:00 PM", title: "Wedding Ceremony", type: "ceremony", location: "Sunset Gardens", attendees: ["75 guests"] }
      ]
    },
    "2024-08-26": {
      events: [
        { id: 8, time: "10:00 AM", title: "Follow-up call", type: "follow-up", location: "Phone", attendees: ["Sarah Johnson", "David Chen"] }
      ]
    }
  }

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null
    const dateKey = selectedDate.toISOString().split('T')[0]
    return (calendarEvents as any)[dateKey] || null
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '[HANDSHAKE]'
      case 'task': return 'âœ…'
      case 'rehearsal': return '[STYLE]'
      case 'ceremony': return '’’'
      case 'preparation': return '[WARNING]™ï¸'
      case 'follow-up': return '[SCRIPT]ž'
      default: return '[SCRIPT]…'
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
      return "Great choice! Modern ceremonies offer wonderful flexibility. Let me know:\n\n1. Do you prefer a spiritual but non-religious approach?\n2. Are there personal vows being exchanged?\n3. Any unity ceremonies (sand, candle, etc.)?\n\nShould I create a contemporary script outline for Sarah and David?"
    }

    if (lowerInput.includes('generate') || lowerInput.includes('create') || lowerInput.includes('yes')) {
      return "Excellent! I'm generating a personalized ceremony script for Sarah Johnson & David Chen. This will include:\n\n* Processional guidance\n* Opening words\n* Exchange of vows section\n* Ring ceremony\n* Unity ceremony (optional)\n* Pronouncement and kiss\n* Recessional\n\nThe script is being created and will be saved to your files. Would you like me to customize any specific sections?"
    }

    if (lowerInput.includes('vows') || lowerInput.includes('rings')) {
      return "For the vow exchange, I can provide:\n\n* Traditional vows template\n* Guide for personal vow writing\n* Sample vow examples\n* Ring exchange wording\n\nWould you like me to create a complete vows section for their ceremony?"
    }

    return "I understand! Let me help you with that. I can assist with:\n\n* Creating ceremony scripts from scratch\n* Customizing existing templates\n* Adding personal touches and stories\n* Incorporating special readings or music\n* Adjusting tone and style\n\nWhat specific aspect of the ceremony script would you like to work on first?"
  }

  const handleGenerateScript = (scriptType: string) => {
    setIsGeneratingScript(true)

    setTimeout(() => {
      const newScript = {
        id: generatedScripts.length + 1,
        title: `${scriptType} Ceremony Script - Sarah & David`,
        content: generateScriptContent(scriptType),
        createdDate: new Date().toLocaleDateString(),
        type: scriptType,
        status: "completed"
      }

      setGeneratedScripts(prev => [...prev, newScript])

      // Add to files as well
      const scriptFile: UploadedFile = {
        id: `script_${newScript.id}_${Date.now()}`,
        file: new File([newScript.content], `${newScript.title}.txt`, { type: 'text/plain' }),
        name: `${newScript.title}.txt`,
        size: newScript.content.length,
        type: 'text/plain',
        url: '#',
        uploadProgress: 100,
        status: 'completed'
      }

      setUploadedFiles(prev => [...prev, scriptFile])
      setIsGeneratingScript(false)

      const confirmationMessage = {
        id: aiChatMessages.length + 1,
        role: "assistant",
        content: `Perfect! I've generated a ${scriptType.toLowerCase()} ceremony script for Sarah & David. The script is now open in the Script Editor tab where you can customize it. - Mr. Script`,
        timestamp: new Date().toLocaleTimeString()
      }

      setAiChatMessages(prev => [...prev, confirmationMessage])

      // Auto-switch to Script Editor tab and load the script
      setEditingScript(newScript)
      const htmlContent = newScript.content.replace(/\n/g, '<br>')
      setScriptContent(htmlContent)
      setEditorFontSize(16)
      setScriptBuilderTab('editor')
    }, 3000)
  }

  const generateScriptContent = (scriptType: string) => {
    const couple = `${editCoupleInfo?.brideName || 'Partner 1'} and ${editCoupleInfo?.groomName || 'Partner 2'}`
    const venue = editWeddingDetails.venueName
    const date = new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

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

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    {
      id: 'ai_script_1',
      file: new File(['Sample content'], 'Traditional Ceremony Script - Sarah & David.txt', { type: 'text/plain' }),
      name: 'Traditional Ceremony Script - Sarah & David.txt',
      size: 2048,
      type: 'text/plain',
      url: '#',
      uploadProgress: 100,
      status: 'completed'
    }
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
    // Start with empty chat - no automatic welcome message
    setChatMessages([])
    setCurrentQuestionIndex(0)
    setUserResponses({})

    // No automatic questions - wait for user to interact via Quick Setup
  }

  const askNextQuestion = (questionIndex: number) => {
    if (questionIndex >= GUIDED_QUESTIONS.length) {
      // All questions completed, generate recommendation
      generateFinalRecommendation()
      return
    }

    const question = GUIDED_QUESTIONS[questionIndex]

    // Skip questions that have already been answered via Quick Setup
    if (userResponses[question.id]) {
      // Question already answered, move to next one
      setCurrentQuestionIndex(prev => prev + 1)
      askNextQuestion(questionIndex + 1)
      return
    }

    setIsTyping(true)

    setTimeout(() => {
      const aiResponse = generateAIResponse(question, userResponses)
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

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])

    // Check if user wants to generate the script
    const lowerInput = chatInput.toLowerCase()
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

    // Save user response
    const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex]
    if (currentQuestion) {
      setUserResponses(prev => ({
        ...prev,
        [currentQuestion.id]: chatInput
      }))
    }

    setChatInput("")

    // Ask next question
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1)
      askNextQuestion(currentQuestionIndex + 1)
    }, 500)
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

    // Save user response
    const currentQuestion = GUIDED_QUESTIONS[currentQuestionIndex]
    if (currentQuestion) {
      setUserResponses(prev => ({
        ...prev,
        [currentQuestion.id]: response
      }))
    }

    // Ask next question
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1)
      askNextQuestion(currentQuestionIndex + 1)
    }, 500)
  }

  const generateFinalRecommendation = () => {
    setIsTyping(true)

    setTimeout(() => {
      const recommendation = generateRecommendation(userResponses)
      const recommendationMessage: ChatMessage = {
        id: `ai-final-${Date.now()}`,
        type: 'ai',
        content: recommendation,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, recommendationMessage])
      setIsTyping(false)

      // After showing recommendation, offer to generate the script
      setTimeout(() => {
        const scriptOfferMessage: ChatMessage = {
          id: `ai-script-offer-${Date.now()}`,
          type: 'ai',
          content: "Perfect! I have everything I need. Would you like me to generate your complete ceremony script now? Just say 'yes' or 'generate script' and I'll create your personalized wedding ceremony!",
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, scriptOfferMessage])
      }, 2000)
    }, 1500)
  }

  const generateAndSaveScript = () => {
    setIsTyping(true)

    setTimeout(() => {
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
âœ… Opening words and processional
âœ… Declaration of intent
âœ… ${userResponses['vows-type'] || selectedVowsType} vows
${(userResponses['special-elements'] || selectedUnityCeremony) !== 'None' ? `âœ… ${userResponses['special-elements'] || selectedUnityCeremony} unity ceremony` : ''}
âœ… Ring exchange ceremony
âœ… Pronouncement and recessional

**Your script is ready!** Click the "Generate Final Script" button below to open it in the full editor where you can make any final adjustments.`,
        timestamp: new Date()
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
      alert('Please select both ceremony style and duration to generate a script request for Mr. Script')
      return
    }

    // Pre-populate responses based on Quick Setup selections
    const quickSetupResponses: Record<string, string> = {}

    if (selectedCeremonyStyle) {
      quickSetupResponses['ceremony-type'] = selectedCeremonyStyle
    }

    if (selectedCeremonyLength) {
      quickSetupResponses['ceremony-duration'] = selectedCeremonyLength
    }

    if (selectedUnityCeremony && selectedUnityCeremony !== "None") {
      quickSetupResponses['special-elements'] = selectedUnityCeremony
    } else if (selectedUnityCeremony === "None") {
      quickSetupResponses['special-elements'] = "None"
    }

    if (selectedVowsType) {
      // Map the vows selection to match the guided question options
      if (selectedVowsType === "Traditional") {
        quickSetupResponses['vows-type'] = "Traditional Vows"
      } else if (selectedVowsType === "Personal") {
        quickSetupResponses['vows-type'] = "Personal Written Vows"
      } else if (selectedVowsType === "Personal and Modern") {
        quickSetupResponses['vows-type'] = "Mix of Both"
      } else {
        quickSetupResponses['vows-type'] = selectedVowsType
      }
    }

    // Set the responses immediately
    setUserResponses(quickSetupResponses)

    // Build description with all selections
    let ceremonyDescription = `${selectedCeremonyStyle} ceremony script that's ${selectedCeremonyLength} long`

    if (selectedUnityCeremony && selectedUnityCeremony !== "None") {
      ceremonyDescription += ` with a ${selectedUnityCeremony} unity ceremony`
    }

    if (selectedVowsType) {
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

âœ… **Ceremony Style**: ${selectedCeremonyStyle}
âœ… **Duration**: ${selectedCeremonyLength}
âœ… **Unity Ceremony**: ${selectedUnityCeremony || "None selected"}
âœ… **Vows**: ${selectedVowsType || "Not specified"}

Based on these selections, I'll create a beautiful ceremony for ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}. Let me focus on the remaining details to perfect your script:`

      // Add specific recommendations based on style
      if (selectedCeremonyStyle === 'Traditional') {
        aiResponse += `\n\nFor your traditional ceremony, I'll include classic elements like formal processional music, traditional ring exchange, and time-honored language that creates a dignified atmosphere.`
      } else if (selectedCeremonyStyle === 'Modern') {
        aiResponse += `\n\nFor your modern ceremony, I'll incorporate contemporary elements with personalized touches, flexible structure, and current language that reflects today's relationships.`
      } else if (selectedCeremonyStyle === 'Religious') {
        aiResponse += `\n\nFor your religious ceremony, I'll include appropriate blessings, scripture readings, and faith-based elements that honor your spiritual traditions.`
      }

      // Check if we need to ask about ceremony tone (since it's not covered in Quick Setup)
      const stillNeedTone = !quickSetupResponses['ceremony-tone']

      if (stillNeedTone) {
        aiResponse += `\n\nTo complete your ceremony script, I just need to know: What tone would you like for the ceremony? Would you prefer it to be Formal and Traditional, Warm and Personal, Light and Joyful, Intimate and Romantic, or Fun and Casual?`

        // Set up to ask only the remaining question
        setCurrentQuestionIndex(2) // ceremony-tone is index 2
      } else {
        aiResponse += `\n\nI have everything I need! I'll now generate your complete ceremony script.`
        setCurrentQuestionIndex(GUIDED_QUESTIONS.length) // Skip all questions

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
            alert(`’¾ Auto-saved "${editingScript.title}" to server at ${timestamp}`)
          } else {
            console.error("Failed to auto-save to database:", result.error)
            alert(`[WARNING] ï¸ Failed to auto-save to server. Please try again.`)
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
    if (!confirm(`Are you sure you want to delete "${script.title}"? This action cannot be undone.`)) {
      return
    }

    // Check if it's a database script (has numeric id) or generated script (has string id)
    const isDbScript = typeof script.id === 'number'

    if (isDbScript) {
      // Delete from database
      const result = await deleteScriptFromDB(script.id)
      if (result.ok) {
        setCoupleScripts(prev => prev.filter(s => s.id !== script.id))
        console.log('âœ… Script deleted from database:', script.title)
        alert(`Script "${script.title}" has been deleted.`)
      } else {
        console.error('âŒ Failed to delete script:', result.error)
        alert(`Failed to delete script: ${result.error}`)
      }
    } else {
      // Remove from generated scripts (local state only)
      setGeneratedScripts(prev => prev.filter(s => s.id !== script.id))
      console.log('âœ… Generated script removed:', script.title)
      alert(`Script "${script.title}" has been removed.`)
    }
  }

  const handleRecordPayment = async () => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("âŒ Cannot record payment: No user or couple selected")
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

    console.log("’° Recording payment for couple:", editCoupleInfo.id)

    // Save to database
    const result = await addPaymentToDB(currentUser.id, editCoupleInfo.id, {
      description: isRefund ? `Refund - ${newPayment.notes || "Manual refund"}` : amount === paymentInfo.balance ? "Final Payment" : "Partial Payment",
      amount: amount,
      paymentType: isRefund ? "refund" : newPayment.method,
      status: isRefund ? "refunded" : "paid",
      dueDate: newPayment.date
    })

    if (result.ok && result.data) {
      // Create new payment record for local state
      const payment = {
        id: result.data.id,
        date: new Date(newPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        amount: amount,
        type: isRefund ? "Refund" : amount === paymentInfo.balance ? "Final Payment" : "Partial Payment",
        method: newPayment.method,
        status: isRefund ? "refunded" : "paid",
        notes: newPayment.notes
      }

      // Update payment history
      setPaymentHistory(prev => [...prev, payment])

      // Update payment info
      const newDepositPaid = isRefund ? Math.max(0, paymentInfo.depositPaid - amount) : paymentInfo.depositPaid + amount
      const newBalance = isRefund ? paymentInfo.balance + amount : Math.max(0, paymentInfo.balance - amount)

      setPaymentInfo(prev => ({
        ...prev,
        depositPaid: newDepositPaid,
        balance: newBalance,
        paymentStatus: newBalance === 0 ? "paid_in_full" : prev.paymentStatus
      }))

      // Reset form and close dialog
      setNewPayment({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        method: "Credit Card",
        notes: "",
        kind: "payment"
      })
      setShowRecordPaymentDialog(false)
      loadFinancialPaymentsForUser()

      // Show success message
      console.log("âœ… Payment recorded:", payment)
      if (isRefund) {
        alert(`Refund of ${amount} recorded successfully.`)
      } else if (newBalance === 0) {
        alert("Payment recorded successfully! This ceremony is now PAID IN FULL! [CELEBRATE]")
      } else {
        alert(`Payment of ${amount} recorded successfully!\n\nRemaining balance: ${newBalance}`)
      }
    } else {
      console.error("âŒ Failed to record payment:", result.error)
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
        id: generatedScripts.length + 1,
        title: `Imported Script - ${getFirstName(editCoupleInfo?.brideName)} & ${getFirstName(editCoupleInfo?.groomName)}`,
        type: 'Custom',
        content: personalizedScript,
        createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        status: 'completed'
      }

      setGeneratedScripts(prev => [...prev, newScript])

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
      setEditingScript(newScript)
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
    const existingDbScript = coupleScripts.find(script => script.id === editingScript.id)
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
      alert(`âŒ Script must be at least ${MIN_CHARACTERS} characters long.\n\nCurrent length: ${plainTextContent.length} characters\nPlease add more content before saving.`)
      return
    }

    if (plainTextContent.length > MAX_CHARACTERS) {
      alert(`âŒ Script cannot exceed ${MAX_CHARACTERS} characters.\n\nCurrent length: ${plainTextContent.length} characters\nPlease reduce the content before saving.`)
      return
    }

    // Get the current date for last modified
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

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
            ...result.data,
            lastModified: currentDate
          }
          setCoupleScripts(prevScripts => [newScript, ...prevScripts])
          console.log('âœ… New script created in database:', result.data.id)
          alert(`âœ… Script "${editingScript.title}" created successfully!\n\nSaved to server on: ${currentDate}\nContent: ${plainTextContent.length} characters`)
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
              script.id === editingScript.id
                ? {
                    ...script,
                    content: currentContent,
                    lastModified: currentDate,
                    status: 'Latest Draft'
                  }
                : script
            )
          )
          console.log('âœ… Script updated in database:', editingScript.id)
          alert(`âœ… Script "${editingScript.title}" saved successfully!\n\nSaved to server on: ${currentDate}\nContent: ${plainTextContent.length} characters`)
        } else {
          throw new Error(result.error || 'Failed to update script')
        }
      }

      setShowScriptEditorDialog(false)
      setEditingScript(null)
      setScriptContent("")
      setEditorFontSize(16)
    } catch (err: any) {
      console.error('âŒ Error saving script:', err)
      alert(`[WARNING] ï¸ Failed to save script to server.\n\nError: ${err.message}\n\nPlease try again.`)
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

    // Add to messaging platform
    setMessageAttachments(allAttachments)
    setNewMessage(`[SHARED] Wedding Documents

For: ${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}
Sent to: ${recipient}

${itemsDescription}
${shareScriptForm.body}`)
    setShowAttachments(true)

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage()
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
      case 'view':
        console.log(`${action === 'edit' ? 'Editing' : 'Viewing'} contract:`, contract.name)
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
          subject: `Contract: ${contract.name}`,
          body: `Hi,\n\nI've prepared your "${contract.name}" for review and signature. Please use the document link below to take a look, and let me know if you have any questions.\n\nBest regards,\n${officiantLabel}`
        })
        setShowSendContractDialog(true)
        console.log('Opening send dialog for contract:', contract.name)
        break
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

    // Add to messaging platform
    setMessageAttachments([contractAttachment])
    setNewMessage(`[SCRIPT]§ Email sent to: ${recipient}\n[SCRIPT]„ Subject: ${emailForm.subject}\n\n${emailForm.body}`)
    setShowAttachments(true)

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage()
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

  const handleUploadMarketplaceScript = async (file: File, details: MarketplaceScriptDetails) => {
    if (!file || !currentUser?.id) return

    try {
      const canSell = await userHasActiveSellerSubscription(currentUser.id)
      if (!canSell) {
        alert("An active Aspirant or Professional subscription is required to sell scripts in the marketplace.")
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

  const getContractEmailRecipients = () => {
    if (emailForm.to === "both") {
      return [editCoupleInfo?.brideEmail, editCoupleInfo?.groomEmail]
        .filter((email): email is string => Boolean(email?.trim()))
        .filter((email, index, all) => all.indexOf(email) === index)
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
    const totalAmount = paymentInfo.totalAmount || invoiceForm.total || 0
    const depositAmount = paymentInfo.depositPaid || invoiceForm.depositPaid || 0
    const balanceDue = paymentInfo.balance || invoiceForm.balanceDue || 0
    const balanceDueDate = paymentInfo.finalPaymentDue || invoiceForm.dueDate || ""
    const venueAddress = editWeddingDetails.venueAddress || editCoupleInfo?.address || ""

    return {
      agreement_date: formatContractDate(new Date().toISOString()),
      officiant_business_name: officiantProfile?.business_name || officiantProfile?.company_name || officiantLabel,
      officiant_name: officiantProfile?.full_name || officiantProfile?.name || officiantName,
      couple_names: coupleNames,
      partner_1_name: brideName,
      partner_2_name: groomName,
      wedding_date: formatContractDate(editWeddingDetails.weddingDate),
      wedding_time: formatContractTime(editWeddingDetails.startTime),
      venue_name: editWeddingDetails.venueName || "",
      venue_address: venueAddress,
      total_fee: formatContractMoney(totalAmount),
      deposit_amount: formatContractMoney(depositAmount),
      balance_due: formatContractMoney(balanceDue),
      balance_due_date: formatContractDate(balanceDueDate),
      payment_methods: invoiceForm.paymentMethods || "",
      payment_deadlines: balanceDueDate
        ? `Final balance is due by ${formatContractDate(balanceDueDate)}.`
        : "",
      cancellation_refund_terms: invoiceForm.terms || "",
      late_fee_terms: "",
      included_travel_radius: officiantProfile?.travel_radius_miles
        ? `${officiantProfile.travel_radius_miles} miles`
        : "",
      travel_mileage_fees: "",
      travel_origin_or_service_area: [officiantProfile?.city, officiantProfile?.state].filter(Boolean).join(", "),
      additional_travel_terms: "",
      special_requests_deadline: "three weeks prior to the ceremony date",
      officiant_arrival_window: "20 minutes",
      photo_video_permission_terms: "",
      partner_1_signature_date: "",
      partner_1_signature: "",
      partner_2_signature_date: "",
      partner_2_signature: "",
      couple_email: coupleEmail,
      couple_mailing_address: mailingAddress,
      officiant_signature_date: "",
      officiant_signature: "",
    }
  }

  const createPersonalizedContractUrl = async (contract: any) => {
    const originalUrl = getContractFileUrl(contract)
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
      const messageWithLink = `${emailForm.body.trim()}\n\nView/download contract:\n${contractUrl}`
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipients,
          subject: emailForm.subject.trim(),
          message: messageWithLink,
          fromName: officiantName,
          coupleName: `${editCoupleInfo?.brideName || ""} & ${editCoupleInfo?.groomName || ""}`.trim(),
          coupleId: editCoupleInfo?.id,
          officiantId: currentUser?.id,
          emailTitle: "Wedding Contract",
          actionUrl: contractUrl,
          actionLabel: "View contract",
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Failed to send contract email.")
      }

      const sentAt = new Date()
      const updateResult = await updateContractInDB(sendingContract.id, {
        status: "sent",
        sent_date: sentAt.toISOString(),
      })

      if (!updateResult.ok) {
        console.error("Contract email sent, but status update failed:", updateResult.error)
      }

      setContracts(prev => prev.map(c =>
        c.id === sendingContract.id
          ? { ...c, status: 'sent', sentDate: sentAt.toLocaleDateString(), sent_date: sentAt.toISOString() } as any
          : c
      ))

      setShowSendContractDialog(false)
      setSendingContract(null)
      setEmailForm({
        to: '',
        customEmail: '',
        subject: '',
        body: ''
      })

      console.log(`Contract "${sendingContract.name}" sent to: ${recipients.join(", ")}`)
    } catch (error) {
      console.error("Failed to send contract email:", error)
      alert(error instanceof Error ? error.message : "Failed to send contract email.")
    } finally {
      setIsSendingContractEmail(false)
    }
  }

  // Handle opening payment reminder dialog
  const handleOpenPaymentReminderDialog = () => {
    setPaymentReminderForm({
      to: 'both', // Default to both couple members
      customEmail: '',
      subject: 'Payment Reminder - Wedding Ceremony Services',
      body: `Dear ${getFirstName(editCoupleInfo?.brideName)} and ${getFirstName(editCoupleInfo?.groomName)},

I hope this message finds you well and that your wedding planning is going smoothly!

This is a friendly reminder regarding your upcoming payment for our wedding ceremony services.

Payment Details:
* Total Amount: $${paymentInfo.totalAmount}
* Deposit Paid: $${paymentInfo.depositPaid}
* Balance Due: $${paymentInfo.balance}
* Due Date: ${paymentInfo.finalPaymentDue}

Please ensure your final payment is submitted by the due date to confirm all arrangements for your special day.

If you have any questions about the payment or need to discuss payment options, please don't hesitate to reach out to me directly.

Looking forward to officiating your beautiful ceremony!

Warm regards,
${officiantLabel}${officiantPhone ? `\n${officiantPhone}` : ''}${officiantEmail ? `\n${officiantEmail}` : ''}`
    })
    setShowSendPaymentReminderDialog(true)
  }

  // Handle sending payment reminder email
  const handleSendPaymentReminderEmail = () => {
    const recipient = paymentReminderForm.to === 'both'
      ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
      : paymentReminderForm.to || paymentReminderForm.customEmail

    if (!recipient.trim()) {
      alert('Please select a recipient or enter an email address.')
      return
    }

    if (!paymentReminderForm.subject.trim()) {
      alert('Please enter a subject.')
      return
    }

    if (!paymentReminderForm.body.trim()) {
      alert('Please enter a message body.')
      return
    }

    // Add to messaging platform
    setNewMessage(`’° Payment Reminder sent to: ${recipient}\n[SCRIPT]„ Subject: ${paymentReminderForm.subject}\n\n${paymentReminderForm.body}`)

    // Auto-send the message
    setTimeout(() => {
      handleSendMessage()
    }, 100)

    // Close dialog and reset form
    setShowSendPaymentReminderDialog(false)
    setPaymentReminderForm({
      to: '',
      customEmail: '',
      subject: '',
      body: ''
    })

    console.log(`Payment reminder sent to: ${recipient}`)
  }

  const handleContractUploaded = async (contractData: Omit<Contract, 'id' | 'createdDate'>) => {
    if (!currentUser?.id || !editCoupleInfo?.id) {
      console.error("âŒ Cannot upload contract: No user or couple selected")
      return
    }

    console.log("[SCRIPT]œ Uploading contract for couple:", editCoupleInfo.id)

    const uploadedFile = contractData.file
    if (!uploadedFile?.file) {
      alert("Please upload a contract file before saving.")
      return
    }

    const fileExt = uploadedFile.name.split(".").pop() || "file"
    const fileName = `${Date.now()}_${currentUser.id}.${fileExt}`
    const filePath = `${currentUser.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, uploadedFile.file, {
        contentType: uploadedFile.type || uploadedFile.file.type || "application/octet-stream",
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
      fileType: uploadedFile.type || uploadedFile.file.type || "application/octet-stream",
      fileSize: uploadedFile.size || uploadedFile.file.size || 0,
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
        fileType: result.data.file_type || uploadedFile.type || uploadedFile.file.type,
        fileSize: result.data.file_size || uploadedFile.size || uploadedFile.file.size,
        file: {
          ...uploadedFile,
          url: result.data.file_url || publicUrlData.publicUrl,
          status: "completed" as const,
          uploadProgress: 100
        }
      }

      // Add contract to the list immediately
      setContracts(prev => [...prev, newContract as any])
      setViewingContract(newContract as any)
      setShowContractViewerDialog(true)

      console.log("âœ… Contract uploaded:", newContract)

    } else {
      const cleanupPath = deriveContractStoragePath(publicUrlData.publicUrl)
      if (cleanupPath) {
        const { error: cleanupError } = await supabase.storage.from("contracts").remove([cleanupPath])
        if (cleanupError) {
          console.error("Failed to clean up uploaded contract after database error:", cleanupError)
        }
      }
      console.error("âŒ Failed to upload contract:", result.error)
      alert(`Failed to save contract: ${result.error || "Please try again."}`)
    }
  }

  // Payment info calculated from payment history
  const [paymentInfo, setPaymentInfo] = useState({
    totalAmount: 0,
    depositPaid: 0,
    balance: 0,
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

  // Demo scripts for marketplace (not editable)
  const demoScriptsForMarketplace = [
    {
      id: 'demo-1',
      title: "Traditional Ceremony Script v3",
      type: "Traditional",
      status: "Latest Draft",
      lastModified: "Aug 12, 2024",
      description: "Personalized for sunset garden ceremony with unity candle",
      content: `TRADITIONAL WEDDING CEREMONY SCRIPT
Sarah Johnson & David Chen
Sunset Gardens - August 25, 2024

PROCESSIONAL
[Bridal party enters to "Canon in D"]
[Bride enters with father to "Here Comes the Bride"]

OPENING WORDS
Dearly beloved, we are gathered here today at this beautiful Sunset Gardens to celebrate the union of Sarah Johnson and David Chen in marriage. On this lovely August afternoon, we witness not just the joining of two hearts, but the creation of a new family built on love, trust, and commitment.

Sarah and David, you have chosen to share your lives together, and we are honored to be part of this special moment in your journey.

DECLARATION OF INTENT
Sarah, do you take David to be your lawfully wedded husband, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?

David, do you take Sarah to be your lawfully wedded wife, to have and to hold, in sickness and in health, for richer or poorer, for better or worse, for as long as you both shall live?

EXCHANGE OF VOWS
[Personal vows to be exchanged]

RING CEREMONY
These rings serve as a symbol of your unending love and commitment. As you place them on each other's hands, remember that love is not just a feeling, but a choice you make every day.

UNITY CANDLE CEREMONY
Sarah and David will now light the unity candle together, symbolizing the joining of their two lives into one shared journey.

PRONOUNCEMENT
By the power vested in me, and in the presence of these witnesses, I now pronounce you husband and wife. You may kiss!

RECESSIONAL
[Couple exits to "Wedding March"]

---
This script has been personalized for Sarah & David's sunset garden ceremony.`
    },
    {
      id: 2,
      title: "Modern Outdoor Ceremony v2",
      type: "Modern",
      status: "In Review",
      lastModified: "Aug 8, 2024",
      description: "Alternative script for outdoor setting with personal vows",
      content: `MODERN OUTDOOR WEDDING CEREMONY
Sarah Johnson & David Chen
Sunset Gardens - August 25, 2024

GATHERING
[Guests are seated as soft music plays]
[Wedding party processes in together]

WELCOME
Welcome, everyone! We're here today because Sarah and David have something important to share with all of us - their love for each other and their commitment to building a life together.

Love is what brings us together today. Not just Sarah and David's love for each other, but the love and support of all of you who have traveled here to celebrate with them.

READING
[Selected reading about love and partnership]

PERSONAL VOWS
Sarah and David have written their own vows to express their personal promises to each other.

Sarah, please share your vows with David.
[Sarah's personal vows]

David, please share your vows with Sarah.
[David's personal vows]

RING EXCHANGE
The rings you exchange today are a symbol of the promises you've just made. They represent your commitment to each other and the love you share.

[Ring exchange]

PRONOUNCEMENT
Sarah and David, having witnessed your vows and the exchange of rings, and by the power vested in me, I now pronounce you married! You may kiss!

CELEBRATION
Let's celebrate the new Mr. and Mrs. Chen!

[Couple exits together as guests celebrate]

---
Modern ceremony focused on personal expression and celebration.`
    },
    {
      id: 3,
      title: "Interfaith Ceremony Draft v1",
      type: "Interfaith",
      status: "Draft",
      lastModified: "Aug 5, 2024",
      description: "Initial draft incorporating both cultural backgrounds",
      content: `INTERFAITH WEDDING CEREMONY DRAFT
Sarah Johnson & David Chen
Sunset Gardens - August 25, 2024

OPENING
[Incorporation of both traditions to be developed]

WELCOME IN BOTH TRADITIONS
We gather today to celebrate the union of Sarah and David, honoring both the traditions that have shaped them and the new path they create together.

[Details to be added for specific cultural elements]

EXCHANGE OF PROMISES
[Traditional vows and cultural-specific promises]

SYMBOLIC CEREMONIES
[Unity ceremony incorporating elements from both backgrounds]

BLESSINGS
[Blessings from both traditions]

PRONOUNCEMENT
[Closing incorporating both cultural elements]

---
Note: This is an initial draft. Further development needed to incorporate specific cultural and religious elements from both Sarah's and David's backgrounds.`
    }
  ]

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

  const getPaymentDateValue = (payment: any) => new Date(payment.dueDate || payment.paidDate || payment.createdAt || Date.now())
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const paidPaymentRecords = allPaymentRecords.filter(payment => payment.status === "paid")
  const refundPaymentRecords = allPaymentRecords.filter(payment => payment.status === "refunded" || payment.type === "refund")
  const pendingPaymentRecords = allPaymentRecords.filter(payment => payment.status === "pending")
  const financialReport = {
    grossIncome: paidPaymentRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    refunds: refundPaymentRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
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
    outstanding: pendingPaymentRecords.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    paymentsReceived: paidPaymentRecords.length,
    refundsIssued: refundPaymentRecords.length,
  }
  financialReport.netIncome = financialReport.grossIncome - financialReport.refunds
  const financialRows = allPaymentRecords.map(payment => {
    const couple = allCouples.find((item: any) => item.id === payment.coupleId)
    return {
      ...payment,
      coupleName: couple ? `${couple.brideName} & ${couple.groomName}` : `Couple #${payment.coupleId || "Unassigned"}`,
      weddingDate: couple?.weddingDetails?.weddingDate || "",
    }
  })
  const outstandingBalanceRows = financialRows
    .filter(payment => payment.status === "pending")
    .sort((a, b) => getPaymentDateValue(a).getTime() - getPaymentDateValue(b).getTime())
  const refundRows = financialRows.filter(payment => payment.status === "refunded" || payment.type === "refund")

  const exportFinancialCsv = () => {
    const headers = ["Date", "Couple", "Wedding Date", "Description", "Type", "Status", "Amount"]
    const rows = financialRows.map(row => [
      row.dueDate || row.paidDate || row.createdAt || "",
      row.coupleName,
      row.weddingDate,
      row.description || "",
      row.type || "",
      row.status || "",
      Number(row.amount || 0).toFixed(2),
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

  const popularScripts = [
    { id: 1, title: "Beach Wedding Ceremony", author: "Rev. Sarah M.", price: 22, rating: 4.9, sales: 156 },
    { id: 2, title: "Garden Party Wedding", author: "Pastor John D.", price: 18, rating: 4.8, sales: 134 },
    { id: 3, title: "Rustic Barn Wedding", author: "Minister Lisa K.", price: 24, rating: 4.7, sales: 98 }
  ]

  const handleAddCeremony = () => {
    // Validate that required fields are filled
    if (!newCeremony.ceremonyName || !newCeremony.brideName || !newCeremony.groomName) {
      alert("Please fill in Ceremony Name, Bride Name, and Groom Name")
      return
    }

    // Save the ceremony with a unique ID and creation timestamp
    const ceremonyToSave = {
      ...newCeremony,
      id: Date.now(),
      createdAt: new Date().toISOString()
    }

    setSavedCeremonies(prev => [...prev, ceremonyToSave])
    console.log("Ceremony saved:", ceremonyToSave)

    // Create the new couple object
    const newCouple = {
      id: Date.now(), // Generate a unique ID
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
      specialRequests: newCeremony.notes,
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
      groomName: "",
      groomEmail: "",
      groomPhone: "",
      groomAddress: "",
      totalAmount: "",
      depositAmount: "",
      finalPaymentDate: "",
      notes: ""
    })
    setShowAddCeremonyDialog(false)

    // Show success message
    alert(`Ceremony "${ceremonyToSave.ceremonyName}" for ${newCeremony.brideName} & ${newCeremony.groomName} has been saved successfully!\n\nThis couple has been added to your ceremony list and you can now switch to them using the "Switch Ceremony" button.`)
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

    const coupleId = `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
    const updates = {
      venue_name: editWeddingDetails.venueName || null,
      venue_address: editWeddingDetails.venueAddress || null,
      wedding_date: editWeddingDetails.weddingDate || null,
      start_time: editWeddingDetails.startTime || null,
      end_time: editWeddingDetails.endTime || null,
      expected_guests: editWeddingDetails.expectedGuests ? Number.parseInt(editWeddingDetails.expectedGuests, 10) : null,
      notes: editWeddingDetails.officiantNotes || null
    }

    const result = await updateCoupleInDB(activeCoupleId, updates)

    if (!result.ok) {
      console.error("Failed to save wedding details:", result.error)
      alert("Failed to save wedding details. Please try again.")
      return
    }

    // Save the updated wedding details for the current couple
    setSavedWeddingDetails(prev => ({
      ...prev,
      [coupleId]: { ...editWeddingDetails }
    }))

    // Update the wedding details in allCouples array
    const updatedCouples = [...allCouples]
    updatedCouples[activeCoupleIndex] = {
      ...updatedCouples[activeCoupleIndex],
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
    if (confirm('Are you sure you want to delete this wedding event?')) {
      setUpcomingEvents(upcomingEvents.filter(event => event.id !== eventId))
    }
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
    const currentCouple = allCouples[activeCoupleIndex]
    if (!currentCouple?.id) return

    const nextIsActive = !currentCouple.isActive
    const result = await updateCoupleInDB(currentCouple.id, { is_active: nextIsActive })

    if (!result.ok) {
      alert(`Failed to ${nextIsActive ? "restore" : "archive"} ceremony on the server. Please try again.`)
      return
    }

    const updatedCouples = allCouples.map((couple, index) =>
      index === activeCoupleIndex
        ? { ...couple, isActive: nextIsActive }
        : couple
    )
    setAllCouples(updatedCouples)

    if (!nextIsActive) {
      const nextActiveIndex = updatedCouples.findIndex((couple, index) => index !== activeCoupleIndex && couple.isActive)

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
      console.error("âŒ Cannot add task: No user or couple selected")
      return
    }

    console.log("[SCRIPT]‹ Adding task for couple:", editCoupleInfo.id)

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
        createdDate: new Date().toISOString().split('T')[0]
      }
      setTasks(prev => [...prev, newTask])

      // Send an immediate notification; future reminders are handled by the scheduled checker.
      if (newTaskData.emailReminder) {
        scheduleEmailNotification(newTask)
      }

      console.log("âœ… Task added:", newTask)
    } else {
      console.error("âŒ Failed to add task:", result.error)
      alert("Failed to add task. Please try again.")
    }
  }

  const scheduleEmailNotification = async (task: Task) => {
    // Calculate reminder date
    const reminderDate = new Date(task.dueDate)
    reminderDate.setDate(reminderDate.getDate() - task.reminderDays)

    console.log(`[SCRIPT]§ Scheduling email notification:`)
    console.log(`Task: ${task.task}`)
    console.log(`Reminder Date: ${reminderDate.toDateString()}`)
    console.log(`Due: ${task.dueDate} at ${task.dueTime}`)

    // Get recipients - both couple and officiant
    const recipients = [
      editCoupleInfo?.brideEmail,
      editCoupleInfo?.groomEmail,
      officiantProfile?.email || currentUser?.email
    ].filter(Boolean)

    const coupleName = `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
    const taskOfficiantName = officiantName

    // Send immediate confirmation email about the task
    for (const email of recipients) {
      try {
        const isOfficiant = email === officiantProfile?.email || email === currentUser?.email
        const emailContent = generateTaskReminderEmail(task, isOfficiant, coupleName, taskOfficiantName)

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
          console.log(`âœ… Task notification sent to ${email}`)
        } else {
          console.error(`âŒ Failed to send task notification to ${email}`)
        }
      } catch (err) {
        console.error(`âŒ Error sending task notification to ${email}:`, err)
      }
    }

    console.log(`[SCRIPT]… Reminder scheduled for ${reminderDate.toDateString()} - Recipients: ${recipients.join(', ')}`)
  }

  const generateTaskReminderEmail = (task: Task, isOfficiant: boolean, coupleName: string, officiantName: string) => {
    const cleanOfficiantName = officiantName === "Officiant" ? "Your Officiant" : officiantName
    const cleanOfficiantFirstName =
      cleanOfficiantName === "Your Officiant" ? cleanOfficiantName : cleanOfficiantName.split(/\s+/)[0]
    const cleanGreeting = isOfficiant ? `Dear ${cleanOfficiantName}` : `Dear ${coupleName}`
    const cleanClosingNote = isOfficiant
      ? "Please ensure this task is completed before the wedding date."
      : `${cleanOfficiantName} has created this task for your wedding planning. Please review and complete it as needed.`
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
    const cleanContactLine = isOfficiant ? "" : "If you have any questions, please contact your officiant.\n\n"

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

${cleanContactLine}Thank you,
${cleanOfficiantFirstName}
`,
    }

    const priorityEmoji: Record<string, string> = {
      low: 'Ÿ¢',
      medium: 'Ÿ¡',
      high: 'Ÿ ',
      urgent: '[DOC]´'
    }

    const greeting = isOfficiant ? `Dear ${officiantName}` : `Dear ${coupleName}`
    const closingNote = isOfficiant
      ? `Please ensure this task is completed before the wedding date.`
      : `Your officiant ${officiantName} has created this task for your wedding planning. Please review and complete as needed.`

    return {
      subject: `[SCRIPT]‹ Wedding Task: ${task.task}`,
      body: `${greeting},

A new task has been created for your wedding ceremony:

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

[SCRIPT]‹ Task: ${task.task}
[SCRIPT]… Due Date: ${new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
â° Due Time: ${task.dueTime}
${priorityEmoji[task.priority] || '[SCRIPT]Œ'} Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
[SCRIPT] Category: ${task.category}

${task.details ? `[SCRIPT] Details:\n${task.details}` : ''}

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

${closingNote}

${isOfficiant ? '' : `If you have any questions, please contact your officiant.`}

Best regards,
OrdainedPro Wedding Portal
`
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
      console.error("âŒ Failed to update task:", result.error)
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: !newCompletedState } : t
      ))
    } else {
      console.log("âœ… Task completion toggled:", taskId, newCompletedState)
    }
  }

  const getFilteredTasks = () => {
    switch (taskFilter) {
      case 'pending':
        return tasks.filter(task => !task.completed)
      case 'completed':
        return tasks.filter(task => task.completed)
      case 'high-priority':
        return tasks.filter(task => (task.priority === 'high' || task.priority === 'urgent') && !task.completed)
      default:
        return tasks
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

    console.log(`[SCRIPT]§ MEETING INVITATION SENT:`)
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

      console.log(`[SCRIPT]¬ EMAIL RESPONSE RECEIVED:`)
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
            <div className="text-6xl">[SCRIPT]„</div>
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
            <div className="text-6xl">[SCRIPT]</div>
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
          <div className="text-6xl">[SCRIPT]‹</div>
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
          <div className="text-6xl">[SCRIPT]„</div>
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
          <div className="text-6xl">[SCRIPT]</div>
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
          <div className="text-6xl">[SCRIPT]</div>
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
      console.error("âŒ Cannot upload files: No user or couple selected")
      return
    }

    console.log("[SCRIPT] Uploading", uploadedFiles.length, "files for couple:", editCoupleInfo.id)

    for (const file of uploadedFiles) {
      // Check if file already exists
      const exists = files.some(existingFile =>
        existingFile.name === file.name &&
        existingFile.size === formatFileSize(file.size)
      )

      if (exists) {
        console.log("â­ï¸ Skipping duplicate file:", file.name)
        continue
      }

      try {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const filePath = `${currentUser.id}/${editCoupleInfo.id}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('couple-files')
          .upload(filePath, file.file, { upsert: true })

        if (uploadError) {
          console.error("âŒ Storage upload error:", uploadError)
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
          console.log("âœ… File uploaded and saved:", file.name, publicUrl)
        } else {
          console.error("âŒ Failed to save file to database:", file.name, result.error)
        }
      } catch (err: any) {
        console.error("âŒ Exception uploading file:", file.name, err)
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
      console.error("âŒ Failed to delete file:", result.error)
      if (removedFile) {
        setFiles(prev => [...prev, removedFile])
      }
    } else {
      console.log("âœ… File deleted:", fileId)
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() && messageAttachments.length === 0) {
      return
    }

    if (isSendingMessage) return
    setIsSendingMessage(true)

    try {
      // Get couple info
      const coupleId = editCoupleInfo.id
      const coupleName = `${editCoupleInfo?.brideName || 'Partner 1'} & ${editCoupleInfo?.groomName || 'Partner 2'}`
      const brideEmail = editCoupleInfo.brideEmail
      const groomEmail = editCoupleInfo.groomEmail

      // Determine recipient emails
      const recipientEmails = [brideEmail, groomEmail].filter(Boolean)

      console.log("[SCRIPT]§ Sending message to:", { coupleId, coupleName, recipientEmails, message: newMessage })

      // 1. Save message to Supabase
      if (currentUser) {
        const messageData = {
          user_id: currentUser.id,
          couple_id: coupleId,
          sender: "officiant",
          sender_name: officiantLabel,
          content: newMessage || "(File attachments)",
          read: true, // Officiant's own message is read
          created_at: new Date().toISOString(),
        }

        const { data: savedMessage, error: saveError } = await supabase
          .from("messages")
          .insert([messageData])
          .select()

        if (saveError) {
          console.error("âŒ Error saving message to Supabase:", saveError)
        } else {
          console.log("âœ… Message saved to Supabase:", savedMessage)

          // Add to local messages state, unless the realtime listener already added it.
          setMessages(prev => {
            const messageExists = prev.some((message) => String(message.id) === String(savedMessage[0].id))
            if (messageExists) return prev

            return [...prev, {
              id: savedMessage[0].id,
              sender: officiantLabel,
              role: "officiant",
              message: newMessage,
              timestamp: "Just now",
              avatar: "/api/placeholder/40/40"
            }]
          })
        }
      }

      // 2. Send email via API
      let emailsSent = 0
      let emailErrors: string[] = []

      for (const email of recipientEmails) {
        if (!email) continue

        try {
          console.log(`[SCRIPT]§ Attempting to send email to: ${email}`)

          // Build attachments array - include both scripts (textContent) and files (base64Content)
          const emailAttachments = messageAttachments
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
              subject: `Message from ${officiantLabel} - Wedding Planning`,
              message: newMessage,
              fromName: officiantLabel,
              coupleName: coupleName,
              coupleId: coupleId,
              officiantId: currentUser?.id,
              // Include all attachments (scripts and files)
              attachments: emailAttachments
            })
          })

          const result = await response.json()
          console.log(`[SCRIPT]§ API Response for ${email}:`, result)

          if (response.ok && result.success) {
            console.log(`âœ… Email sent to ${email}:`, result)
            emailsSent++
          } else {
            const errorMsg = result.error || result.details || "Unknown error"
            console.error(`âŒ Failed to send email to ${email}:`, result)
            emailErrors.push(`${email}: ${errorMsg}`)
          }
        } catch (emailError) {
          console.error(`âŒ Error sending email to ${email}:`, emailError)
          emailErrors.push(`${email}: Network error`)
        }
      }

      // Clear message and attachments
      setNewMessage("")
      setMessageAttachments([])
      setShowAttachments(false)

      // Log results (no popup - the message appears in the conversation)
      if (emailsSent > 0) {
        console.log(`âœ… Emails sent to: ${recipientEmails.join(", ")}`)
      }
      if (emailErrors.length > 0) {
        console.warn(`[WARNING] ï¸ Some emails failed:`, emailErrors)
      }

    } catch (error) {
      console.error("âŒ Error in handleSendMessage:", error)
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
      depositPaid: paymentInfo.depositPaid,
      balanceDue: paymentInfo.balance
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

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
ŽŠ WEDDING CEREMONY INVOICE ŽŠ
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
  Category: ${item.category || 'Wedding Services'}
  Rate: ${item.quantity}x ${item.rate} = ${item.quantity * item.rate}`
).join('\n\n')}

PAYMENT SUMMARY:
* Subtotal: ${formatCurrency(totals.subtotal)}
${invoiceForm.taxRate > 0 ? `* Tax (${invoiceForm.taxRate}%): ${formatCurrency(totals.taxAmount)}` : ''}
* Deposit Previously Paid: -${formatCurrency(invoiceForm.depositPaid)}
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
${officiantLabel}${officiantPhone ? `\n[SCRIPT]ž ${officiantPhone}` : ''}${officiantEmail ? `\n[SCRIPT]§ ${officiantEmail}` : ''}${officiantProfile?.website ? `\nŒ ${officiantProfile.website}` : ''}

â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•`
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
        `  Category: ${item.category || 'Wedding Services'}`,
        `  Quantity x Rate: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(lineTotal)}`,
      ].filter(Boolean).join('\n')
    }).join('\n\n')

    return `Dear ${getFirstName(editCoupleInfo?.brideName)} and ${getFirstName(editCoupleInfo?.groomName)},

Congratulations on your upcoming wedding! Please find your ceremony services invoice below.

Wedding Ceremony Invoice

Couple: ${invoiceForm.coupleName}
Wedding date: ${weddingDate}
Venue: ${invoiceForm.venue || 'To be confirmed'}

Invoice Details
Invoice #: ${invoiceForm.invoiceNumber}
Invoice date: ${invoiceDate}
Due date: ${dueDate}

Services Provided
${services}

Payment Summary
Subtotal: ${formatCurrency(totals.subtotal)}
${invoiceForm.taxRate > 0 ? `Tax (${invoiceForm.taxRate}%): ${formatCurrency(totals.taxAmount)}\n` : ''}Deposit previously paid: -${formatCurrency(invoiceForm.depositPaid)}
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

We're honored to be part of your special day and look forward to creating a beautiful ceremony that reflects your love story!

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
        status: totals.balanceDue > 0 ? "pending" : "paid",
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
          subject: `Wedding Invoice ${invoiceForm.invoiceNumber}`,
          message: invoiceContent,
          fromName: officiantName,
          coupleName: invoiceForm.coupleName,
          coupleId: editCoupleInfo?.id,
          officiantId: currentUser?.id,
          emailTitle: "Wedding Invoice",
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
    setNewMessage(`[SCRIPT]§ Wedding Invoice Sent

Couple: ${invoiceForm.coupleName}
Sent to: ${recipients}
§¾ Invoice #: ${invoiceForm.invoiceNumber}
’’ Wedding Date: ${new Date(invoiceForm.weddingDate).toLocaleDateString()}
›ï¸ Venue: ${invoiceForm.venue}

’° FINANCIAL SUMMARY:
* Total Services: ${invoiceForm.total}
* Deposit Paid: ${invoiceForm.depositPaid}
* Balance Due: ${invoiceForm.balanceDue}
[SCRIPT]… Payment Due: ${new Date(invoiceForm.dueDate).toLocaleDateString()}

[SCRIPT]‹ SERVICES INCLUDED:
${invoiceForm.items.map(item => `* ${item.service} - ${item.quantity * item.rate}`).join('\n')}

’³ Payment Methods: ${invoiceForm.paymentMethods}

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
  const handleSendToEditor = () => {
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
      title: `Generated Ceremony Script - ${selectedCeremonyStyle || 'Custom'}`,
      content: generatedScriptContent,
      createdDate: new Date().toLocaleDateString(),
      type: selectedCeremonyStyle || 'Custom',
      status: 'draft'
    }

    // Set up the editor with the generated content
    setEditingScript(newScript)
    setScriptContent(generatedScriptContent)
    setShowScriptEditorDialog(true)
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
        modificationResponse += "âœ… Made the ceremony more concise and streamlined\n"
        updatedScript = updatedScript.replace(/\[.*?\]/g, '') // Remove bracketed instructions
      } else if (lowerRequest.includes('longer') || lowerRequest.includes('more detail')) {
        modificationResponse += "âœ… Added more detailed elements and explanations\n"
        updatedScript += `\n\nADDITIONAL ELEMENTS\n[Additional ceremonial elements and personal touches as requested]\n`
      } else if (lowerRequest.includes('personal') || lowerRequest.includes('customize')) {
        modificationResponse += "âœ… Added more personalized elements\n"
        updatedScript = updatedScript.replace('EXCHANGE OF VOWS', 'PERSONALIZED EXCHANGE OF VOWS\n[Customized vows reflecting the couple\'s unique relationship]')
      } else if (lowerRequest.includes('music') || lowerRequest.includes('song')) {
        modificationResponse += "âœ… Added music cues and recommendations\n"
        updatedScript = updatedScript.replace('PROCESSIONAL', 'PROCESSIONAL\n[Suggested music: "Canon in D" or couple\'s chosen processional song]')
      } else if (lowerRequest.includes('reading') || lowerRequest.includes('poem')) {
        modificationResponse += "âœ… Added reading section\n"
        updatedScript = updatedScript.replace('EXCHANGE OF VOWS', 'SPECIAL READING\n[Insert chosen reading, poem, or scripture here]\n\nEXCHANGE OF VOWS')
      } else {
        modificationResponse += "âœ… Applied your requested changes to the script\n"
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


  const portalContextValue = {
    getCoupleColors,
    GUIDED_QUESTIONS,
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
    newCeremony,
    setNewCeremony,
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
    hasGeneratedScript,
    setHasGeneratedScript,
    generatedScriptContent,
    setGeneratedScriptContent,
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
    handleSendContractEmail: handleSendContractRealEmail,
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
          <div className="text-6xl mb-4">’’</div>
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
