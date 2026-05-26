"use client"

import { createContext, useContext, type ReactNode } from "react"

type PersonName = {
  brideName: string
  groomName: string
  brideEmail: string
  groomEmail: string
}

type CoupleLike = PersonName & {
  id: number
  bridePhone: string
  brideAddress?: string
  groomPhone: string
  groomAddress?: string
  address: string
  emergencyContact: string
  specialRequests: string
  isActive: boolean
  weddingDetails: {
    venueName: string
    venueAddress: string
    weddingDate: string
    startTime: string
    endTime: string
    expectedGuests: string
    [key: string]: any
  }
  [key: string]: any
}

type ScriptLike = {
  id?: any
  content: string
  description?: string
  lastModified?: string
  status?: string
  title?: string
  type?: string
  [key: string]: any
}

type InvoiceLike = {
  items: any[]
  [key: string]: any
}

type SharedItemsLike = {
  scripts: any[]
  contracts?: any[]
  files: any[]
}

// Default empty couple info to prevent null errors
export const EMPTY_COUPLE_INFO: PersonName & Record<string, any> = {
  brideName: "",
  groomName: "",
  brideEmail: "",
  groomEmail: "",
  bridePhone: "",
  groomPhone: "",
  brideAddress: "",
  groomAddress: "",
  address: "",
  emergencyContact: "",
  specialRequests: "",
  isActive: false,
  id: 0
}

type CommunicationPortalContextValue = {
  [key: string]: any
  GUIDED_QUESTIONS: Array<{ options?: string[]; [key: string]: any }>
  activeGuidedQuestions: Array<{ options?: string[]; [key: string]: any }>
  aiChatMessages: any[]
  allCouples: CoupleLike[]
  chatMessages: any[]
  contracts: any[]
  coupleScripts: any[]
  editCoupleInfo: PersonName & Record<string, any>  // Never null - always has default values
  editingScript: ScriptLike | null
  files: any[]
  generatedScripts: any[]
  generatedScriptContent: string
  invoiceForm: InvoiceLike
  meetings: any[]
  messageAttachments: any[]
  messages: any[]
  myScripts: any[]
  paymentHistory: any[]
  popularScripts: any[]
  selectedItemsToShare: SharedItemsLike
  sharingScript: ScriptLike | null
  scriptContent: string
  tasks: any[]
  upcomingEvents: any[]
  uploadedFiles: any[]
  viewingScript: ScriptLike | null
  getFilteredTasks: () => any[]
}

const CommunicationPortalContext = createContext<CommunicationPortalContextValue | null>(null)

export function CommunicationPortalProvider({ value, children }: { value: CommunicationPortalContextValue; children: ReactNode }) {
  return (
    <CommunicationPortalContext.Provider value={value}>
      {children}
    </CommunicationPortalContext.Provider>
  )
}

export function useCommunicationPortal(): CommunicationPortalContextValue {
  const context = useContext(CommunicationPortalContext)

  if (!context) {
    throw new Error("useCommunicationPortal must be used within CommunicationPortalProvider")
  }

  return context
}
