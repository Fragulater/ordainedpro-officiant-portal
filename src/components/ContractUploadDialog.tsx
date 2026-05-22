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
  CheckCircle2,
  FileBadge,
  FileSignature,
  FileText,
  NotebookPen,
  Save,
  Upload,
} from "lucide-react"
import {
  DEFAULT_CONTRACT_TEMPLATE_FIELDS,
  DEFAULT_OFFICIANT_CONTRACT_TEMPLATE,
} from "@/lib/default-contract-template"

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
}

export function ContractUploadDialog({
  isOpen,
  onOpenChange,
  onContractUploaded
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

  const handleUseStarterTemplate = () => {
    const file = new File(
      [DEFAULT_OFFICIANT_CONTRACT_TEMPLATE],
      "OrdainedPro Wedding Service Agreement Template.txt",
      { type: "text/plain" }
    )

    const starterTemplate: UploadedFile = {
      id: `starter_contract_${Date.now()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 100,
      status: "completed",
      textContent: DEFAULT_OFFICIANT_CONTRACT_TEMPLATE,
    }

    setUploadedFiles([starterTemplate])
    setFormData((prev) => ({
      ...prev,
      name: prev.name || "Wedding Service Agreement Template",
      description:
        prev.description ||
        "Reusable officiant contract template with blank merge fields for each couple's ceremony details, fees, deposit, travel, and signature information.",
      type: prev.type || "Wedding Service Agreement",
      status: prev.status || "draft",
    }))
    setErrors((prev) => ({ ...prev, file: "", name: "", type: "" }))
  }

  const handleFileRemoved = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSave = () => {
    if (!validateForm()) return

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
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Contract Document
                </h4>
                <p className="text-sm text-blue-800">
                  Upload your own file, or start with the OrdainedPro template and edit the placeholder fields for each couple.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="border-blue-300 bg-white text-blue-700 hover:bg-blue-50"
                onClick={handleUseStarterTemplate}
              >
                <FileText className="w-4 h-4 mr-2" />
                Contracts
              </Button>
            </div>

            {uploadedFiles.some((file) => file.id.startsWith("starter_contract_")) && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="flex items-center text-sm font-medium text-green-800">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Starter template selected
                </p>
                <p className="mt-1 text-xs text-green-700">
                  Couple-specific fields are blank placeholders and can be filled from the couple profile later.
                </p>
              </div>
            )}

            <FileUpload
              mode="full"
              onFilesUploaded={handleFilesUploaded}
              onFileRemoved={handleFileRemoved}
              maxFiles={1}
              maxFileSize={10}
              acceptedFileTypes={[".docx", ".pdf", ".odt", ".txt"]}
              existingFiles={uploadedFiles}
            />

            {errors.file && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.file}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="font-semibold text-amber-900 mb-2">Reusable Template Fields</h4>
            <p className="text-sm text-amber-800 mb-3">
              Auto-fill uses these exact placeholders. Uploaded contracts need matching placeholders for the portal to safely place couple, wedding, fee, deposit, and travel details.
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CONTRACT_TEMPLATE_FIELDS.map((field) => (
                <span key={field} className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-800">
                  {`{{${field}}}`}
                </span>
              ))}
            </div>
          </div>

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

          {(formData.name || formData.type) && (
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
            disabled={!formData.name || !formData.type || uploadedFiles.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Upload Contract
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
