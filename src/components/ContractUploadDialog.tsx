"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload, UploadedFile } from "@/components/FileUpload"
import {
  AlertCircle,
  CalendarDays,
  Clipboard,
  FileBadge,
  FileSignature,
  FileText,
  NotebookPen,
  Save,
  Upload,
} from "lucide-react"
import {
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_LABEL,
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_TEXT,
  DEFAULT_CONTRACT_ACKNOWLEDGMENT_TITLE,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_LABEL,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_TEXT,
  UPLOADED_CONTRACT_ACKNOWLEDGMENT_TITLE,
} from "@/lib/contract-legal-acknowledgment"

type SmartFieldContext = "wedding" | "minor" | "memorial" | "all"

type SmartField = {
  label: string
  tag: string
  group: string
  keywords?: string
  contexts?: SmartFieldContext[]
}

const SMART_FIELD_GROUPS = [
  "Recommended Fields",
  "All Fields",
  "Common Agreement Fields",
  "Officiant / Business Fields",
  "Client / Partner Fields",
  "Parent / Guardian Fields",
  "Honoree Fields",
  "Deceased Person / Memorial Fields",
  "Ceremony / Event Details",
  "Payment / Invoice Fields",
  "Travel / Timing Fields",
  "Signature Fields",
  "Legal / Acknowledgment Fields",
]

const BOLDSIGN_CONTRACT_TAGS: SmartField[] = [
  { group: "Common Agreement Fields", label: "Agreement date", tag: "{{editdate|3|*|Agreement date|agreement_date}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Common Agreement Fields", label: "Ceremony/Event date", tag: "{{editdate|3|*|Wedding date|wedding_date}}", contexts: ["wedding", "minor", "memorial"], keywords: "wedding date event date service date" },
  { group: "Common Agreement Fields", label: "Ceremony/Event time", tag: "{{text|3|*|Wedding time|wedding_time}}", contexts: ["wedding", "minor", "memorial"], keywords: "wedding time event time service time" },
  { group: "Common Agreement Fields", label: "Ceremony/Event type", tag: "{{text|3|*|Ceremony type|ceremony_type}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Common Agreement Fields", label: "Contract version", tag: "{{text|3|*|Contract version|contract_version}}", contexts: ["all"] },

  { group: "Officiant / Business Fields", label: "Officiant business", tag: "{{text|3|*|Officiant business|officiant_business_name}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Officiant / Business Fields", label: "Officiant name", tag: "{{text|3|*|Officiant name|officiant_name}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Officiant / Business Fields", label: "Officiant phone", tag: "{{text|3|*|Officiant phone|officiant_phone}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Officiant / Business Fields", label: "Officiant email", tag: "{{text|3|*|Officiant email|officiant_email}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Officiant / Business Fields", label: "Officiant business address", tag: "{{text|3|*|Officiant business address|officiant_business_address}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Officiant / Business Fields", label: "Travel origin / service area", tag: "{{text|3|*|Travel origin|travel_origin_or_service_area}}", contexts: ["wedding", "minor", "memorial"] },

  { group: "Client / Partner Fields", label: "Partner 1 name", tag: "{{text|1|*|Partner 1 name|partner_1_name}}", contexts: ["wedding"], keywords: "bride client primary signer" },
  { group: "Client / Partner Fields", label: "Partner 2 name", tag: "{{text|2|*|Partner 2 name|partner_2_name}}", contexts: ["wedding"], keywords: "groom client secondary signer" },
  { group: "Client / Partner Fields", label: "Partner 1 phone", tag: "{{text|1|*|Partner 1 phone|bride_phone}}", contexts: ["wedding"], keywords: "bride phone client phone" },
  { group: "Client / Partner Fields", label: "Partner 2 phone", tag: "{{text|2|*|Partner 2 phone|groom_phone}}", contexts: ["wedding"], keywords: "groom phone client phone" },
  { group: "Client / Partner Fields", label: "Partner 1 email", tag: "{{text|1|*|Partner 1 email|bride_email}}", contexts: ["wedding"], keywords: "bride email client email" },
  { group: "Client / Partner Fields", label: "Partner 2 email", tag: "{{text|2|*|Partner 2 email|groom_email}}", contexts: ["wedding"], keywords: "groom email client email" },
  { group: "Client / Partner Fields", label: "Mailing address", tag: "{{text|1|*|Mailing address|mailing_addr}}", contexts: ["wedding", "minor", "memorial"], keywords: "address client address parent address family address" },

  { group: "Parent / Guardian Fields", label: "Parent/Guardian 1 name", tag: "{{text|1|*|Parent/Guardian 1 name|parent_guardian_1_name}}", contexts: ["minor"], keywords: "parent guardian primary client" },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 2 name", tag: "{{text|2|*|Parent/Guardian 2 name|parent_guardian_2_name}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 1 phone", tag: "{{text|1|*|Parent/Guardian 1 phone|parent_guardian_1_phone}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 2 phone", tag: "{{text|2|*|Parent/Guardian 2 phone|parent_guardian_2_phone}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 1 email", tag: "{{text|1|*|Parent/Guardian 1 email|parent_guardian_1_email}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 2 email", tag: "{{text|2|*|Parent/Guardian 2 email|parent_guardian_2_email}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 1 relationship", tag: "{{text|1|*|Parent/Guardian 1 relationship|parent_guardian_1_relationship}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian 2 relationship", tag: "{{text|2|*|Parent/Guardian 2 relationship|parent_guardian_2_relationship}}", contexts: ["minor"] },
  { group: "Parent / Guardian Fields", label: "Parent/Guardian mailing address", tag: "{{text|1|*|Parent/Guardian mailing address|parent_guardian_mailing_address}}", contexts: ["minor"] },

  { group: "Honoree Fields", label: "Honoree full name", tag: "{{text|3|*|Honoree full name|honoree_full_name}}", contexts: ["minor"] },
  { group: "Honoree Fields", label: "Honoree first name", tag: "{{text|3|*|Honoree first name|honoree_first_name}}", contexts: ["minor"] },
  { group: "Honoree Fields", label: "Honoree age", tag: "{{text|3|*|Honoree age|honoree_age}}", contexts: ["minor"] },
  { group: "Honoree Fields", label: "Honoree birthday", tag: "{{editdate|3|*|Honoree birthday|honoree_birthday}}", contexts: ["minor"] },
  { group: "Honoree Fields", label: "Honoree celebration type", tag: "{{text|3|*|Honoree celebration type|honoree_celebration_type}}", contexts: ["minor"] },
  { group: "Honoree Fields", label: "Honoree pronouns", tag: "{{text|3|*|Honoree pronouns|honoree_pronouns}}", contexts: ["minor"] },
  { group: "Honoree Fields", label: "Honoree special notes", tag: "{{text|3|*|Honoree special notes|honoree_special_notes}}", contexts: ["minor"] },

  { group: "Deceased Person / Memorial Fields", label: "Deceased full name", tag: "{{text|3|*|Deceased full name|deceased_full_name}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Deceased first name", tag: "{{text|3|*|Deceased first name|deceased_first_name}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Deceased date of birth", tag: "{{editdate|3|*|Deceased date of birth|deceased_date_of_birth}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Deceased date of passing", tag: "{{editdate|3|*|Deceased date of passing|deceased_date_of_passing}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Memorial service date", tag: "{{editdate|3|*|Memorial service date|memorial_service_date}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Memorial service time", tag: "{{text|3|*|Memorial service time|memorial_service_time}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Memorial venue name", tag: "{{text|3|*|Memorial venue name|memorial_venue_name}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Memorial venue address", tag: "{{text|3|*|Memorial venue address|memorial_venue_address}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Primary family contact name", tag: "{{text|1|*|Primary family contact name|primary_family_contact_name}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Secondary family contact name", tag: "{{text|2|*|Secondary family contact name|secondary_family_contact_name}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Primary family contact phone", tag: "{{text|1|*|Primary family contact phone|primary_family_contact_phone}}", contexts: ["memorial"] },
  { group: "Deceased Person / Memorial Fields", label: "Primary family contact email", tag: "{{text|1|*|Primary family contact email|primary_family_contact_email}}", contexts: ["memorial"] },

  { group: "Ceremony / Event Details", label: "Venue name", tag: "{{text|3|*|Venue name|venue_name}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Venue address", tag: "{{text|3|*|Venue address|venue_address}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Venue city", tag: "{{text|3|*|Venue city|venue_city}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Venue state", tag: "{{text|3|*|Venue state|venue_state}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Venue ZIP", tag: "{{text|3|*|Venue ZIP|venue_zip}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Venue contact name", tag: "{{text|3|*|Venue contact name|venue_contact_name}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Venue contact phone", tag: "{{text|3|*|Venue contact phone|venue_contact_phone}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Planner/coordinator name", tag: "{{text|3|*|Planner/coordinator name|planner_coordinator_name}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Planner/coordinator phone", tag: "{{text|3|*|Planner/coordinator phone|planner_coordinator_phone}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Ceremony / Event Details", label: "Rehearsal date", tag: "{{editdate|3|*|Rehearsal date|rehearsal_date}}", contexts: ["wedding", "minor"] },
  { group: "Ceremony / Event Details", label: "Rehearsal time", tag: "{{text|3|*|Rehearsal time|rehearsal_time}}", contexts: ["wedding", "minor"] },
  { group: "Ceremony / Event Details", label: "Rehearsal location", tag: "{{text|3|*|Rehearsal location|rehearsal_location}}", contexts: ["wedding", "minor"] },

  { group: "Payment / Invoice Fields", label: "Total fee", tag: "{{text|3|*|Total fee|total_fee}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Deposit amount", tag: "{{text|3|*|Deposit amount|deposit_amount}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Balance due", tag: "{{text|3|*|Balance due|balance_due}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Balance due date", tag: "{{editdate|3|*|Balance due date|balance_due_date}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Payment method", tag: "{{text|3|*|Payment method|payment_method}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Late fee", tag: "{{text|3|*|Late fee|late_fee}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Travel fee", tag: "{{text|3|*|Travel fee|travel_fee}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Mileage rate", tag: "{{text|3|*|Mileage rate|mileage_rate}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Add-on fees", tag: "{{text|3|*|Add-on fees|add_on_fees}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Payment / Invoice Fields", label: "Rehearsal fee", tag: "{{text|3|*|Rehearsal fee|rehearsal_fee}}", contexts: ["wedding", "minor"] },
  { group: "Payment / Invoice Fields", label: "Package name", tag: "{{text|3|*|Package name|package_name}}", contexts: ["wedding", "minor", "memorial"] },

  { group: "Travel / Timing Fields", label: "Included travel radius", tag: "{{text|3|*|Included travel radius|included_travel_radius}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Travel / Timing Fields", label: "Additional mileage rate", tag: "{{text|3|*|Additional mileage rate|additional_mileage_rate}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Travel / Timing Fields", label: "Arrival time before ceremony", tag: "{{text|3|*|Arrival time before ceremony|arrival_time_before_ceremony}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Travel / Timing Fields", label: "Late grace period", tag: "{{text|3|*|Late grace period|late_grace_period}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Travel / Timing Fields", label: "Extra waiting fee", tag: "{{text|3|*|Extra waiting fee|extra_waiting_fee}}", contexts: ["wedding", "minor", "memorial"] },

  { group: "Signature Fields", label: "Partner 1 signature", tag: "{{sign|1|*|Partner 1 signature|partner_1_signature}}", contexts: ["wedding"], keywords: "bride signature client signature" },
  { group: "Signature Fields", label: "Partner 1 signed date", tag: "{{date|1|*|Partner 1 signed date|partner_1_signature_date}}", contexts: ["wedding"] },
  { group: "Signature Fields", label: "Partner 2 signature", tag: "{{sign|2|*|Partner 2 signature|partner_2_signature}}", contexts: ["wedding"], keywords: "groom signature client signature" },
  { group: "Signature Fields", label: "Partner 2 signed date", tag: "{{date|2|*|Partner 2 signed date|partner_2_signature_date}}", contexts: ["wedding"] },
  { group: "Signature Fields", label: "Parent/Guardian 1 signature", tag: "{{sign|1|*|Parent/Guardian 1 signature|parent_guardian_1_signature}}", contexts: ["minor"] },
  { group: "Signature Fields", label: "Parent/Guardian 1 signed date", tag: "{{date|1|*|Parent/Guardian 1 signed date|parent_guardian_1_signature_date}}", contexts: ["minor"] },
  { group: "Signature Fields", label: "Parent/Guardian 2 signature", tag: "{{sign|2|*|Parent/Guardian 2 signature|parent_guardian_2_signature}}", contexts: ["minor"] },
  { group: "Signature Fields", label: "Parent/Guardian 2 signed date", tag: "{{date|2|*|Parent/Guardian 2 signed date|parent_guardian_2_signature_date}}", contexts: ["minor"] },
  { group: "Signature Fields", label: "Primary family contact signature", tag: "{{sign|1|*|Primary family contact signature|primary_family_contact_signature}}", contexts: ["memorial"] },
  { group: "Signature Fields", label: "Primary family contact signed date", tag: "{{date|1|*|Primary family contact signed date|primary_family_contact_signature_date}}", contexts: ["memorial"] },
  { group: "Signature Fields", label: "Secondary family contact signature", tag: "{{sign|2|*|Secondary family contact signature|secondary_family_contact_signature}}", contexts: ["memorial"] },
  { group: "Signature Fields", label: "Secondary family contact signed date", tag: "{{date|2|*|Secondary family contact signed date|secondary_family_contact_signature_date}}", contexts: ["memorial"] },
  { group: "Signature Fields", label: "Officiant signature", tag: "{{sign|3|*|Officiant signature|officiant_signature}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Signature Fields", label: "Officiant signed date", tag: "{{date|3|*|Officiant signed date|officiant_signature_date}}", contexts: ["wedding", "minor", "memorial"] },

  { group: "Legal / Acknowledgment Fields", label: "Attorney review acknowledgment", tag: "{{text|3|*|Attorney review acknowledgment|attorney_review_acknowledgment}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Legal / Acknowledgment Fields", label: "Custom contract acknowledgment", tag: "{{text|3|*|Custom contract acknowledgment|custom_contract_acknowledgment}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Legal / Acknowledgment Fields", label: "Photo/video permission", tag: "{{text|3|*|Photo/video permission|photo_video_permission}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Legal / Acknowledgment Fields", label: "Cancellation policy", tag: "{{text|3|*|Cancellation policy|cancellation_policy}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Legal / Acknowledgment Fields", label: "Refund policy", tag: "{{text|3|*|Refund policy|refund_policy}}", contexts: ["wedding", "minor", "memorial"] },
  { group: "Legal / Acknowledgment Fields", label: "Special terms", tag: "{{text|3|*|Special terms|special_terms}}", contexts: ["wedding", "minor", "memorial"] },
]

const BOLDSIGN_SIGNER_OPTIONS = [
  { value: "1", label: "Partner 1" },
  { value: "2", label: "Partner 2" },
  { value: "3", label: "Officiant" },
]

const createBoldSignFieldId = (label: string) => (
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "misc_text"
)

const getSmartFieldContext = (ceremonyType?: string): SmartFieldContext => {
  const value = String(ceremonyType || "").toLowerCase()

  if (/(funeral|memorial|celebration.*life|life.*celebration|wake|remembrance)/.test(value)) {
    return "memorial"
  }

  if (/(sweet|quince|quincea|coming|baby|blessing|minor|child|honoree)/.test(value)) {
    return "minor"
  }

  return "wedding"
}

const getTagFieldId = (tag: string) => tag.match(/\|([^|{}]+)}}$/)?.[1] || ""

const findBrokenTags = (content: string) => {
  const brokenTags = new Set<string>()
  const openCount = (content.match(/{{/g) || []).length
  const closeCount = (content.match(/}}/g) || []).length

  if (openCount !== closeCount) {
    brokenTags.add("One or more smart fields appears incomplete.")
  }

  const possibleTags = content.match(/{{[^}]*}}/g) || []
  possibleTags.forEach((tag) => {
    if (!/^\{\{(text|sign|date|editdate)\|[123]\|\*\|[^|{}]+\|[a-z0-9_]+\}\}$/.test(tag)) {
      brokenTags.add(tag)
    }
  })

  return Array.from(brokenTags)
}

const getSmartFieldWarnings = (content: string) => {
  const warnings: string[] = []
  const fieldIds = new Set((content.match(/{{[^}]+}}/g) || []).map(getTagFieldId).filter(Boolean))
  const hasPaymentTerms = /fee|deposit|balance|payment|refund|invoice/i.test(content)

  findBrokenTags(content).forEach((tag) => {
    warnings.push(tag.startsWith("{{") ? `Unknown or malformed smart field: ${tag}` : tag)
  })

  if (content.trim()) {
    const hasSignature = Array.from(fieldIds).some((id) => id.includes("signature") && !id.includes("date"))
    const hasSignatureDate = Array.from(fieldIds).some((id) => id.includes("signature_date"))
    const hasClientField = Array.from(fieldIds).some((id) =>
      /partner_1|bride_|parent_guardian_1|primary_family_contact/.test(id)
    )
    const hasEventDate = Array.from(fieldIds).some((id) =>
      /wedding_date|memorial_service_date|honoree_birthday|agreement_date/.test(id)
    )

    if (!hasSignature) warnings.push("A required signature field may be missing.")
    if (!hasSignatureDate) warnings.push("A required signer date field may be missing.")
    if (!hasClientField) warnings.push("A required client, parent/guardian, or family contact field may be missing.")
    if (!hasEventDate) warnings.push("A required ceremony/event date field may be missing.")
    if (hasPaymentTerms && !fieldIds.has("total_fee") && !fieldIds.has("deposit_amount") && !fieldIds.has("balance_due")) {
      warnings.push("Payment terms are mentioned, but fee/deposit smart fields may be missing.")
    }
  }

  return warnings
}

export interface Contract {
  id: number
  name: string
  description: string
  type: string
  status: "draft" | "sent" | "signed" | "expired"
  createdDate: string
  sentDate?: string
  signedDate?: string
  signedBy?: string
  expiryDate?: string
  file?: UploadedFile
  fileUrl?: string
  fileType?: string
  fileSize?: number
}

interface ContractUploadDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onContractUploaded: (contract: Omit<Contract, "id" | "createdDate">) => void
  onUseDefaultContract?: () => Promise<{ ok: boolean; error?: string; alreadyExists?: boolean } | void>
  contractPrefillDefaults?: Record<string, string>
  setContractPrefillDefaults?: (defaults: Record<string, string>) => void
  hasAcceptedDefaultContractLegal?: boolean
  onAcceptDefaultContractLegal?: () => Promise<{ ok: boolean; error?: string } | void>
  onAcceptUploadedContractLegal?: (details: { contractName: string; fileName: string }) => Promise<{ ok: boolean; error?: string } | void>
  allowDefaultContract?: boolean
  ceremonyType?: string
}

export function ContractUploadDialog({
  isOpen,
  onOpenChange,
  onContractUploaded,
  onUseDefaultContract,
  contractPrefillDefaults = {},
  setContractPrefillDefaults,
  hasAcceptedDefaultContractLegal = false,
  onAcceptDefaultContractLegal,
  onAcceptUploadedContractLegal,
  allowDefaultContract = true,
  ceremonyType = "wedding",
}: ContractUploadDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    expiryDate: "",
    status: "draft" as "draft" | "sent" | "signed" | "expired"
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [copiedTag, setCopiedTag] = useState("")
  const [miscTextLabel, setMiscTextLabel] = useState("Additional notes")
  const [miscTextSigner, setMiscTextSigner] = useState("3")
  const [contractMode, setContractMode] = useState<"default" | "custom">("default")
  const [isAddingDefaultContract, setIsAddingDefaultContract] = useState(false)
  const [isSavingUploadedContractAcknowledgment, setIsSavingUploadedContractAcknowledgment] = useState(false)
  const [isSavingTemplateToFiles, setIsSavingTemplateToFiles] = useState(false)
  const [attorneyReviewChecked, setAttorneyReviewChecked] = useState(false)
  const [uploadedAttorneyReviewChecked, setUploadedAttorneyReviewChecked] = useState(false)
  const [smartFieldGroup, setSmartFieldGroup] = useState("Recommended Fields")
  const [smartFieldSearch, setSmartFieldSearch] = useState("")
  const [smartFieldWorkspace, setSmartFieldWorkspace] = useState("")
  const smartFieldWorkspaceRef = useRef<HTMLTextAreaElement | null>(null)
  const smartFieldContext = getSmartFieldContext(ceremonyType)
  const smartFieldWarnings = useMemo(
    () => getSmartFieldWarnings(smartFieldWorkspace),
    [smartFieldWorkspace]
  )
  const filteredSmartFields = useMemo(() => {
    const query = smartFieldSearch.trim().toLowerCase()

    return BOLDSIGN_CONTRACT_TAGS.filter((field) => {
      const matchesGroup =
        Boolean(query) ||
        smartFieldGroup === "All Fields" ||
        (smartFieldGroup === "Recommended Fields"
          ? field.contexts?.includes(smartFieldContext) || field.contexts?.includes("all")
          : field.group === smartFieldGroup)
      const searchable = `${field.label} ${field.group} ${field.tag} ${field.keywords || ""}`.toLowerCase()
      return matchesGroup && (!query || searchable.includes(query))
    })
  }, [smartFieldContext, smartFieldGroup, smartFieldSearch])
  const smartFieldCategories = SMART_FIELD_GROUPS.filter((group) => group !== "All Fields")

  const updateContractDefault = (field: string, value: string) => {
    setContractPrefillDefaults?.({
      ...contractPrefillDefaults,
      [field]: value,
    })
  }

  const contractTypes = [
    "Wedding Service Agreement",
    "Photography Permission Release",
    "Music Selection Agreement",
    "Venue Requirements Form",
    "Payment Agreement",
    "Liability Waiver",
    "Vendor Coordination Agreement",
    "Rehearsal Agreement",
    "Custom Contract"
  ]

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      expiryDate: "",
      status: "draft"
    })
    setUploadedFiles([])
    setErrors({})
    setCopiedTag("")
    setMiscTextLabel("Additional notes")
    setMiscTextSigner("3")
    setSmartFieldGroup("Recommended Fields")
    setSmartFieldSearch("")
    setSmartFieldWorkspace("")
    setContractMode(allowDefaultContract ? "default" : "custom")
    setIsAddingDefaultContract(false)
    setIsSavingUploadedContractAcknowledgment(false)
    setAttorneyReviewChecked(false)
    setUploadedAttorneyReviewChecked(false)
  }

  useEffect(() => {
    if (!allowDefaultContract && contractMode === "default") {
      setContractMode("custom")
    }
  }, [allowDefaultContract, contractMode])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = "Contract name is required"
    }

    if (!formData.type) {
      newErrors.type = "Contract type is required"
    }

    if (uploadedFiles.length === 0) {
      newErrors.file = "Please upload a contract file"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files)

    if (!formData.name && files.length > 0) {
      const fileName = files[0].name.replace(/\.[^/.]+$/, "")
      handleInputChange("name", fileName)
    }

    if (errors.file) {
      setErrors((prev) => ({
        ...prev,
        file: ""
      }))
    }
  }

  const copyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag)
      setCopiedTag(tag)
    } catch (error) {
      console.error("Failed to copy contract tag:", error)
    }
  }

  const saveTaggedTemplateToFiles = async () => {
    if (!smartFieldWorkspace.trim()) return

    const suggestedName = formData.name?.trim() || "Tagged Contract Template"
    const contractName = window.prompt("Name this contract before saving it to My Files:", suggestedName)
    const cleanName = contractName?.trim()

    if (!cleanName) return

    setIsSavingTemplateToFiles(true)

    try {
      const savedName = cleanName.toLowerCase().endsWith(".txt") ? cleanName : `${cleanName}.txt`
      const blob = new Blob([smartFieldWorkspace], { type: "text/plain;charset=utf-8" })
      const formData = new FormData()

      formData.append("file", blob, savedName)
      formData.append("name", savedName)
      formData.append("folder", "contracts")

      const response = await fetch("/api/user-files", {
        method: "POST",
        body: formData,
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.error || "Unable to save this contract to My Files.")
      }

      window.dispatchEvent(new CustomEvent("ordainedpro:user-files-updated"))
      alert("Contract saved to My Files.")
    } catch (error) {
      console.error("Failed to save contract template to My Files:", error)
      alert(error instanceof Error ? error.message : "Unable to save this contract to My Files.")
    } finally {
      setIsSavingTemplateToFiles(false)
    }
  }

  const insertSmartField = async (field: SmartField) => {
    const tag = field.tag
    const textArea = smartFieldWorkspaceRef.current
    const previousScrollTop = textArea?.scrollTop ?? 0
    const previousScrollLeft = textArea?.scrollLeft ?? 0
    const start = textArea?.selectionStart ?? smartFieldWorkspace.length
    const end = textArea?.selectionEnd ?? smartFieldWorkspace.length
    const prefix = smartFieldWorkspace.slice(0, start)
    const suffix = smartFieldWorkspace.slice(end)
    const spacerBefore = prefix && !/\s$/.test(prefix) ? " " : ""
    const spacerAfter = suffix && !/^\s/.test(suffix) ? " " : ""
    const nextValue = `${prefix}${spacerBefore}${tag}${spacerAfter}${suffix}`
    const cursorPosition = prefix.length + spacerBefore.length + tag.length

    setSmartFieldWorkspace(nextValue)
    setCopiedTag(tag)
    setSmartFieldSearch("")

    try {
      await navigator.clipboard.writeText(tag)
    } catch (error) {
      console.error("Failed to copy contract tag:", error)
    }

    window.setTimeout(() => {
      const currentTextArea = smartFieldWorkspaceRef.current
      currentTextArea?.focus()
      currentTextArea?.setSelectionRange(cursorPosition, cursorPosition)
      if (currentTextArea) {
        currentTextArea.scrollTop = previousScrollTop
        currentTextArea.scrollLeft = previousScrollLeft
      }
    }, 0)
  }

  const miscTextTag = `{{text|${miscTextSigner}|*|${miscTextLabel.trim() || "Additional notes"}|${createBoldSignFieldId(miscTextLabel)}}}`

  const handleFileRemoved = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSave = async () => {
    if (contractMode === "default") {
      if (!hasAcceptedDefaultContractLegal) {
        if (!attorneyReviewChecked) {
          setErrors((prev) => ({
            ...prev,
            defaultContractLegal: "Please acknowledge the attorney review notice before using the default contract.",
          }))
          return
        }

        setIsAddingDefaultContract(true)
        const acceptanceResult = await onAcceptDefaultContractLegal?.()

        if (acceptanceResult && !acceptanceResult.ok) {
          setIsAddingDefaultContract(false)
          setErrors((prev) => ({
            ...prev,
            defaultContractLegal: acceptanceResult.error || "Unable to save the legal acknowledgment.",
          }))
          return
        }
      }

      setIsAddingDefaultContract(true)
      const result = await onUseDefaultContract?.()
      setIsAddingDefaultContract(false)

      if (result && !result.ok) {
        setErrors((prev) => ({ ...prev, defaultContract: result.error || "Unable to add the default contract." }))
        return
      }

      resetForm()
      onOpenChange(false)
      return
    }

    if (!validateForm()) return

    if (!uploadedAttorneyReviewChecked) {
      setErrors((prev) => ({
        ...prev,
        uploadedContractLegal: "Please acknowledge responsibility for the uploaded contract before saving it.",
      }))
      return
    }

    setIsSavingUploadedContractAcknowledgment(true)
    const uploadedAcceptanceResult = await onAcceptUploadedContractLegal?.({
      contractName: formData.name,
      fileName: uploadedFiles[0]?.name || formData.name,
    })
    setIsSavingUploadedContractAcknowledgment(false)

    if (uploadedAcceptanceResult && !uploadedAcceptanceResult.ok) {
      setErrors((prev) => ({
        ...prev,
        uploadedContractLegal: uploadedAcceptanceResult.error || "Unable to save the uploaded contract legal acknowledgment.",
      }))
      return
    }

    onContractUploaded({
      ...formData,
      file: uploadedFiles[0]
    })

    resetForm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900 flex items-center">
            <FileSignature className="w-5 h-5 mr-2" />
            Upload New Contract
          </DialogTitle>
          <DialogDescription>
            Upload a contract document from your device and add details for tracking and management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-900">
              You only need to set this up once per contract, not once per couple.
            </p>
            <p className="mt-1 text-sm text-green-800">
              {allowDefaultContract
                ? "The default OrdainedPro wedding contract is available for wedding profiles. Use it as-is, download it to personalize, or upload your own tagged PDF contract."
                : "Upload a tagged PDF contract for this ceremony type. The default wedding contract is only available for wedding profiles."}
            </p>
          </div>

          <div className={`grid grid-cols-1 gap-3 ${allowDefaultContract ? "md:grid-cols-2" : ""}`}>
            {allowDefaultContract && (
              <button
                type="button"
                onClick={() => setContractMode("default")}
                className={`rounded-lg border p-4 text-left transition ${
                  contractMode === "default"
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Use Default Contract
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Work from the preloaded OrdainedPro wedding contract. It is already tagged for Partner 1, Partner 2, and the officiant.
                </p>
              </button>
            )}
            <button
              type="button"
              onClick={() => setContractMode("custom")}
              className={`rounded-lg border p-4 text-left transition ${
                contractMode === "custom"
                  ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Upload className="h-4 w-4 text-blue-600" />
                Upload / Use Your Own Contract
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Upload a personalized PDF and use the helper tags below so BoldSign knows where fields belong.
              </p>
            </button>
          </div>

          {contractMode === "default" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 flex items-center font-semibold text-blue-900">
                <FileText className="mr-2 h-4 w-4" />
                Default Contract Ready
              </h4>
              <p className="text-sm text-blue-800">
                The default contract is automatically added to this couple's contract list. Download it from the contract card if you want to edit it in Word or Google Docs, then export and upload your personalized PDF version later.
              </p>
              {errors.defaultContract && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.defaultContract}
                </p>
              )}
            </div>
          )}

          {contractMode === "default" && !hasAcceptedDefaultContractLegal && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <h4 className="font-semibold text-amber-950">{DEFAULT_CONTRACT_ACKNOWLEDGMENT_TITLE}</h4>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {DEFAULT_CONTRACT_ACKNOWLEDGMENT_TEXT}
              </p>
              <label className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-white p-3 text-sm font-medium text-slate-900">
                <input
                  type="checkbox"
                  checked={attorneyReviewChecked}
                  onChange={(event) => {
                    setAttorneyReviewChecked(event.target.checked)
                    if (event.target.checked && errors.defaultContractLegal) {
                      setErrors((prev) => ({ ...prev, defaultContractLegal: "" }))
                    }
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                />
                <span>{DEFAULT_CONTRACT_ACKNOWLEDGMENT_LABEL}</span>
              </label>
              {errors.defaultContractLegal && (
                <p className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {errors.defaultContractLegal}
                </p>
              )}
            </div>
          )}

          {contractMode === "default" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-semibold text-blue-900 mb-1">Reusable Contract Prefill Values</h4>
              <p className="text-sm text-blue-800 mb-4">
                These values will be prefilled into matching contract fields before the contract is sent. Most officiants can set these once and leave them alone.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-blue-900">Ceremony fee</Label>
                  <Input value={contractPrefillDefaults.ceremonyFee || ""} onChange={(event) => updateContractDefault("ceremonyFee", event.target.value)} placeholder="e.g., 500" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Deposit amount</Label>
                  <Input value={contractPrefillDefaults.depositAmount || ""} onChange={(event) => updateContractDefault("depositAmount", event.target.value)} placeholder="e.g., 150" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Included miles</Label>
                  <Input value={contractPrefillDefaults.includedMiles || ""} onChange={(event) => updateContractDefault("includedMiles", event.target.value)} placeholder="e.g., 30" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Mileage rate</Label>
                  <Input value={contractPrefillDefaults.mileageRate || ""} onChange={(event) => updateContractDefault("mileageRate", event.target.value)} placeholder="e.g., 1.00" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Arrival minutes</Label>
                  <Input value={contractPrefillDefaults.arrivalMinutes || ""} onChange={(event) => updateContractDefault("arrivalMinutes", event.target.value)} placeholder="e.g., 20" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Rehearsal arrival minutes</Label>
                  <Input value={contractPrefillDefaults.rehearsalArrivalMinutes || ""} onChange={(event) => updateContractDefault("rehearsalArrivalMinutes", event.target.value)} placeholder="e.g., 20" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Late grace minutes</Label>
                  <Input value={contractPrefillDefaults.lateGraceMinutes || ""} onChange={(event) => updateContractDefault("lateGraceMinutes", event.target.value)} placeholder="e.g., 30" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Late fee per half hour</Label>
                  <Input value={contractPrefillDefaults.lateFeeHalfHour || ""} onChange={(event) => updateContractDefault("lateFeeHalfHour", event.target.value)} placeholder="e.g., 50" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Full day reservation fee</Label>
                  <Input value={contractPrefillDefaults.fullDayFee || ""} onChange={(event) => updateContractDefault("fullDayFee", event.target.value)} placeholder="e.g., 1000" className="mt-1 bg-white border-blue-200" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Travel origin / officiant address</Label>
                  <Input value={contractPrefillDefaults.officiantAddress || ""} onChange={(event) => updateContractDefault("officiantAddress", event.target.value)} placeholder="City, State or business address" className="mt-1 bg-white border-blue-200" />
                </div>
              </div>
            </div>
          )}

          {contractMode === "custom" && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Contract Document
            </h4>
            <p className="mb-3 text-sm text-blue-800">
              Upload a tagged PDF contract. Create or edit the contract in Word or Google Docs, then export it as a PDF before uploading.
            </p>

            <FileUpload
              mode="full"
              onFilesUploaded={handleFilesUploaded}
              onFileRemoved={handleFileRemoved}
              maxFiles={1}
              maxFileSize={10}
              acceptedFileTypes={[".pdf"]}
              existingFiles={uploadedFiles}
            />

            {errors.file && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.file}
              </p>
            )}
          </div>
          )}

          {contractMode === "custom" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="font-semibold text-blue-950 mb-1">Paste Your Contract Template</h4>
                <p className="text-sm leading-6 text-blue-900">
                  Paste your contract below. Then click anywhere in the contract where you want client, ceremony, payment, venue, officiant, or signature information to appear. Use the Smart Field Tag menu to insert fields automatically.
                </p>
              </div>
              <span className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-800">
                {smartFieldContext === "minor"
                  ? "Parent / guardian context"
                  : smartFieldContext === "memorial"
                    ? "Memorial context"
                    : "Wedding context"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,0.75fr)_minmax(0,1.45fr)]">
              <div className="rounded-lg border border-blue-100 bg-white p-4 xl:order-2">
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Label htmlFor="smartFieldWorkspace" className="text-base font-semibold text-blue-950">
                      Contract editor
                    </Label>
                    <p className="mt-1 text-xs leading-5 text-blue-800">
                      Click inside the contract, then choose a smart field. The tag is inserted at the cursor and your spacing, paragraphs, and line breaks stay intact.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => copyTag(smartFieldWorkspace)}
                      disabled={!smartFieldWorkspace.trim()}
                    >
                      <Clipboard className="mr-1 h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={saveTaggedTemplateToFiles}
                      disabled={!smartFieldWorkspace.trim() || isSavingTemplateToFiles}
                    >
                      {isSavingTemplateToFiles ? "Saving..." : "Save in My Files"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={() => setSmartFieldWorkspace("")}
                      disabled={!smartFieldWorkspace.trim()}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="relative min-h-[520px] overflow-hidden rounded-md border border-blue-200 bg-white">
                  <Textarea
                    ref={smartFieldWorkspaceRef}
                    id="smartFieldWorkspace"
                    value={smartFieldWorkspace}
                    onChange={(event) => setSmartFieldWorkspace(event.target.value)}
                    placeholder="Paste your contract here, then click where a smart field belongs..."
                    rows={22}
                    spellCheck={false}
                    className="relative min-h-[520px] resize-y border-0 bg-white p-3 font-mono text-sm leading-6 text-slate-950 caret-blue-700 shadow-none selection:bg-blue-200 focus-visible:ring-2 focus-visible:ring-blue-300"
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-blue-800">
                  Layout tip: once your template is tagged, paste it back into Word or Google Docs and export the finished contract as a PDF before uploading. The PDF layout is the layout BoldSign uses.
                </p>
                {smartFieldWarnings.length > 0 && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="flex items-start text-sm font-semibold text-amber-900">
                      <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
                      We found one or more missing or unrecognized smart fields in this custom contract. Please review the fields below before sending.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">
                      {smartFieldWarnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-100 bg-white p-4 xl:order-1">
                <div className="mb-3">
                  <h5 className="font-semibold text-blue-950">Smart Field Tags</h5>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Choose a category, then click Insert Tag. Search checks every smart field, even outside the selected category.
                  </p>
                </div>
                <Input
                  id="smartFieldSearch"
                  value={smartFieldSearch}
                  onChange={(event) => setSmartFieldSearch(event.target.value)}
                  placeholder="Search signature, venue, fee, parent..."
                  className="mb-3 border-blue-200 bg-white"
                />

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[150px_minmax(0,1fr)]">
                  <div className="max-h-[470px] space-y-1 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-1">
                    {[...smartFieldCategories, "All Fields"].map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setSmartFieldGroup(group)}
                        className={`w-full rounded px-3 py-2 text-left text-xs font-semibold transition ${
                          smartFieldGroup === group
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 hover:bg-white"
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[470px] space-y-2 overflow-y-auto pr-1">
                    {filteredSmartFields.length > 0 ? (
                      filteredSmartFields.map((field) => (
                        <div
                          key={`${field.group}-${field.tag}`}
                          className="rounded-md border border-slate-100 bg-white p-3 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-slate-950">{field.label}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Inserts the {field.label.toLowerCase()} field.
                          </p>
                          <p className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {field.group}
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700"
                              onClick={() => insertSmartField(field)}
                            >
                              Insert
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => copyTag(field.tag)}
                            >
                              <Clipboard className="mr-1 h-3.5 w-3.5" />
                              {copiedTag === field.tag ? "Copied" : "Copy"}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        No smart fields match that search. Try signature, venue, deposit, parent, honoree, or deceased.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {contractMode === "custom" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <h4 className="font-semibold text-amber-950">{UPLOADED_CONTRACT_ACKNOWLEDGMENT_TITLE}</h4>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {UPLOADED_CONTRACT_ACKNOWLEDGMENT_TEXT}
              </p>
              <label className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-white p-3 text-sm font-medium text-slate-900">
                <input
                  type="checkbox"
                  checked={uploadedAttorneyReviewChecked}
                  onChange={(event) => {
                    setUploadedAttorneyReviewChecked(event.target.checked)
                    if (event.target.checked && errors.uploadedContractLegal) {
                      setErrors((prev) => ({ ...prev, uploadedContractLegal: "" }))
                    }
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                />
                <span>{UPLOADED_CONTRACT_ACKNOWLEDGMENT_LABEL}</span>
              </label>
              {errors.uploadedContractLegal && (
                <p className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {errors.uploadedContractLegal}
                </p>
              )}
            </div>
          )}

          {contractMode === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="contractName" className="text-sm font-medium text-gray-700">
                  Contract Name *
                </Label>
                <Input
                  id="contractName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Wedding Service Agreement"
                  className={`mt-1 ${errors.name ? "border-red-300" : "border-blue-200 focus:border-blue-500"}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contractType" className="text-sm font-medium text-gray-700">
                  Contract Type *
                </Label>
                <Select value={formData.type} onValueChange={(value: string) => handleInputChange("type", value)}>
                  <SelectTrigger className={`mt-1 ${errors.type ? "border-red-300" : "border-blue-200"}`}>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.type}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                  Expiry Date (Optional)
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Initial Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="mt-1 border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Ready to Send</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Add notes about this contract..."
                  rows={4}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          )}

          {contractMode === "custom" && (formData.name || formData.type) && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Contract Preview</h4>
              <div className="space-y-2">
                {formData.name && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{formData.name}</span>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                    </span>
                  </div>
                )}
                {formData.type && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-blue-500" />
                    Type: {formData.type}
                  </p>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    File: {uploadedFiles[0].name}
                  </p>
                )}
                {formData.expiryDate && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-500" />
                    Expires: {new Date(formData.expiryDate).toLocaleDateString()}
                  </p>
                )}
                {formData.description && (
                  <p className="text-sm text-gray-600 flex items-start gap-2">
                    <NotebookPen className="w-4 h-4 text-slate-500 mt-0.5" />
                    <span>{formData.description}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600"
            disabled={
              isAddingDefaultContract ||
              isSavingUploadedContractAcknowledgment ||
              (contractMode === "default" && !hasAcceptedDefaultContractLegal && !attorneyReviewChecked) ||
              (contractMode === "custom" && (!formData.name || !formData.type || uploadedFiles.length === 0 || !uploadedAttorneyReviewChecked))
            }
          >
            <Save className="w-4 h-4 mr-2" />
            {contractMode === "default"
              ? isAddingDefaultContract ? "Adding..." : "Use Default Contract"
              : isSavingUploadedContractAcknowledgment ? "Saving..." : "Upload Contract"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
