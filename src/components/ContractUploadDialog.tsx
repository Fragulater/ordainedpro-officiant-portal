"use client"

import { useState } from "react"
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

const BOLDSIGN_CONTRACT_TAGS = [
  { label: "Agreement date", tag: "{{editdate|3|*|Agreement date|agreement_date}}" },
  { label: "Officiant business", tag: "{{text|3|*|Officiant business|officiant_business_name}}" },
  { label: "Partner 1 name", tag: "{{text|1|*|Partner 1 name|partner_1_name}}" },
  { label: "Partner 2 name", tag: "{{text|2|*|Partner 2 name|partner_2_name}}" },
  { label: "Wedding date", tag: "{{editdate|3|*|Wedding date|wedding_date}}" },
  { label: "Wedding time", tag: "{{text|3|*|Wedding time|wedding_time}}" },
  { label: "Venue name", tag: "{{text|3|*|Venue name|venue_name}}" },
  { label: "Venue address", tag: "{{text|3|*|Venue address|venue_address}}" },
  { label: "Total fee", tag: "{{text|3|*|Total fee|total_fee}}" },
  { label: "Deposit amount", tag: "{{text|3|*|Deposit amount|deposit_amount}}" },
  { label: "Balance due", tag: "{{text|3|*|Balance due|balance_due}}" },
  { label: "Travel origin", tag: "{{text|3|*|Travel origin|travel_origin_or_service_area}}" },
  { label: "Partner 1 phone", tag: "{{text|1|*|Partner 1 phone|bride_phone}}" },
  { label: "Partner 2 phone", tag: "{{text|2|*|Partner 2 phone|groom_phone}}" },
  { label: "Partner 1 email", tag: "{{text|1|*|Partner 1 email|bride_email}}" },
  { label: "Partner 2 email", tag: "{{text|2|*|Partner 2 email|groom_email}}" },
  { label: "Mailing address", tag: "{{text|1|*|Mailing address|mailing_addr}}" },
  { label: "Partner 1 signature", tag: "{{sign|1|*|Partner 1 signature|partner_1_signature}}" },
  { label: "Partner 1 signed date", tag: "{{date|1|*|Partner 1 signed date|partner_1_signature_date}}" },
  { label: "Partner 2 signature", tag: "{{sign|2|*|Partner 2 signature|partner_2_signature}}" },
  { label: "Partner 2 signed date", tag: "{{date|2|*|Partner 2 signed date|partner_2_signature_date}}" },
  { label: "Officiant signature", tag: "{{sign|3|*|Officiant signature|officiant_signature}}" },
  { label: "Officiant signed date", tag: "{{date|3|*|Officiant signed date|officiant_signature_date}}" },
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
  const [attorneyReviewChecked, setAttorneyReviewChecked] = useState(false)
  const [uploadedAttorneyReviewChecked, setUploadedAttorneyReviewChecked] = useState(false)

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
    setContractMode("default")
    setIsAddingDefaultContract(false)
    setIsSavingUploadedContractAcknowledgment(false)
    setAttorneyReviewChecked(false)
    setUploadedAttorneyReviewChecked(false)
  }

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              The default OrdainedPro contract is already preloaded for each new couple. Use it as-is, download it to personalize, or upload your own tagged PDF contract.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                Work from the preloaded OrdainedPro contract. It is already tagged for Partner 1, Partner 2, and the officiant.
              </p>
            </button>
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
              <h4 className="font-semibold text-blue-900 mb-1">Default Contract Prefill Values</h4>
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Contract Setup Helper</h4>
                <p className="text-sm text-amber-800">
                  Copy these tags into the contract where each field should appear, then export the finished file as a PDF before uploading. OrdainedPro will ask BoldSign to read the tags and prefill matching text/date fields from the couple profile, wedding details, and default contract values when possible.
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800">
                PDF required
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {BOLDSIGN_CONTRACT_TAGS.map((field) => (
                <div key={field.tag} className="rounded-lg border border-amber-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{field.label}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 shrink-0 border-amber-200 text-amber-800 hover:bg-amber-50"
                      onClick={() => copyTag(field.tag)}
                    >
                      <Clipboard className="mr-1 h-3.5 w-3.5" />
                      {copiedTag === field.tag ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <code className="block break-all rounded bg-amber-50 px-2 py-1 text-xs text-amber-900">
                    {field.tag}
                  </code>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="mb-3 text-xs text-blue-900">
                Layout tip: place each tag on its own line where the final field should appear. The system will not move fields on custom PDFs, so the PDF layout you upload is the layout BoldSign uses.
              </p>
              <h5 className="mb-2 text-sm font-semibold text-blue-900">Miscellaneous Text Field</h5>
              <p className="mb-3 text-xs text-blue-800">
                Use this for custom items like ceremony style, special instructions, rehearsal location, or any one-off field an officiant wants added.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                <div>
                  <Label htmlFor="miscTextLabel" className="text-xs font-medium text-blue-900">
                    Field label
                  </Label>
                  <Input
                    id="miscTextLabel"
                    value={miscTextLabel}
                    onChange={(event) => setMiscTextLabel(event.target.value)}
                    placeholder="e.g., Ceremony style"
                    className="mt-1 border-blue-200 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-blue-900">Filled by</Label>
                  <Select value={miscTextSigner} onValueChange={setMiscTextSigner}>
                    <SelectTrigger className="mt-1 border-blue-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOLDSIGN_SIGNER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
                  onClick={() => copyTag(miscTextTag)}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  {copiedTag === miscTextTag ? "Copied" : "Copy Tag"}
                </Button>
              </div>
              <code className="mt-3 block break-all rounded border border-blue-100 bg-white px-2 py-1 text-xs text-blue-900">
                {miscTextTag}
              </code>
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
