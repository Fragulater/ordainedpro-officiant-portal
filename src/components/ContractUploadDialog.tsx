"use client"

import { useState,useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload, UploadedFile } from "@/components/FileUpload"
import {
  Save,
  FileSignature,
  Upload,
  AlertCircle
} from "lucide-react"
import { supabase } from "@/supabase/utils/client";
export interface Contract {
  id: number
  name: string
  description: string
  type: string
  status: 'draft' | 'sent' | 'signed' | 'expired'
  createdDate: string
  sentDate?: string
  signedDate?: string
  signedBy?: string
  expiryDate?: string
  file?: UploadedFile
}

interface ContractUploadDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onContractUploaded: (contract: Omit<Contract, 'id' | 'createdDate'>) => void
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
    status: "draft" as 'draft' | 'sent' | 'signed' | 'expired'
  })

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
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
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      else setUser(user);
      console.log("Fetched user:", user);
    };
    fetchUser();
  }, []);
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(files)

    // Auto-fill contract name if not already filled
    if (!formData.name && files.length > 0) {
      const fileName = files[0].name.replace(/\.[^/.]+$/, "") // Remove extension
      handleInputChange('name', fileName)
    }

    // Clear file error
    if (errors.file) {
      setErrors(prev => ({
        ...prev,
        file: ""
      }))
    }
  }

  const handleFileRemoved = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // const handleSave = () => {
  //   if (!validateForm()) {
  //     return
  //   }

  //   const contractData = {
  //     ...formData,
  //     file: uploadedFiles[0] // Take the first uploaded file
  //   }

  //   onContractUploaded(contractData)

  //   // Reset form
  //   setFormData({
  //     name: "",
  //     description: "",
  //     type: "",
  //     expiryDate: "",
  //     status: "draft"
  //   })
  //   setUploadedFiles([])
  //   setErrors({})
  //   onOpenChange(false)
  // }


const handleSave = async () => {
  try {
    if (!validateForm()) return
    if (!user?.id) {
      alert("⚠️ Please sign in before saving the contract.")
      return
    }

    if (uploadedFiles.length === 0) {
      alert("⚠️ Please upload a contract file.")
      return
    }

    const uploadedFile = uploadedFiles[0]
    const actualFile = uploadedFile.file // Get the actual File object
    const fileExt = uploadedFile.name.split(".").pop()
    const fileName = `${Date.now()}_${user.id}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const coupleId = 1

    // ✅ Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, actualFile, {
        contentType: actualFile.type || 'application/octet-stream',
        upsert: true
      })

    if (uploadError) throw uploadError

    // ✅ Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(filePath)

    const fileUrl = publicUrlData.publicUrl

    // ✅ Prepare metadata
    const contractData = {
      user_id: user.id,
      couple_id: coupleId || null,
      name: formData.name,
      description: formData.description || null,
      type: formData.type || "General",
      expiry_date: formData.expiryDate || null,
      status: formData.status || "draft",
      file_url: fileUrl,
      file_type: uploadedFile.type || actualFile.type,
      file_size: uploadedFile.size || actualFile.size,
    }

    // ✅ Save to Supabase table
    const { data, error } = await supabase
      .from("contracts")
      .insert([contractData])
      .select()
      .single()

    if (error) throw error

    console.log("✅ Contract saved successfully:", data)
    alert("✅ Contract saved successfully!")

    // ✅ Trigger callback with saved data
    onContractUploaded(data)

    // ✅ Reset form
    setFormData({
      name: "",
      description: "",
      type: "",
      expiryDate: "",
      status: "draft",
    })
    setUploadedFiles([])
    setErrors({})
    onOpenChange(false)
  } catch (err: any) {
    console.error("❌ Error saving contract:", err)
    alert(`❌ Failed to save contract: ${err.message}`)
  }
}
  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      expiryDate: "",
      status: "draft"
    })
    setUploadedFiles([])
    setErrors({})
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
          {/* File Upload Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Contract Document
            </h4>

            <FileUpload
              mode="full"
              onFilesUploaded={handleFilesUploaded}
              onFileRemoved={handleFileRemoved}
              maxFiles={1}
              maxFileSize={10}
              acceptedFileTypes={['.pdf', '.doc', '.docx']}
              existingFiles={uploadedFiles}
            />

            {errors.file && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="contractName" className="text-sm font-medium text-gray-700">
                  Contract Name *
                </Label>
                <Input
                  id="contractName"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Wedding Service Agreement"
                  className={`mt-1 ${errors.name ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
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
                <Select value={formData.type} onValueChange={(value: string) => handleInputChange('type', value)}>
                  <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-300' : 'border-blue-200'}`}>
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
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Initial Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Add notes about this contract..."
                  rows={4}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contract Preview */}
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
                  <p className="text-sm text-gray-600">📋 Type: {formData.type}</p>
                )}
                {uploadedFiles.length > 0 && (
                  <p className="text-sm text-gray-600">📎 File: {uploadedFiles[0].name}</p>
                )}
                {formData.expiryDate && (
                  <p className="text-sm text-gray-600">
                    📅 Expires: {new Date(formData.expiryDate).toLocaleDateString()}
                  </p>
                )}
                {formData.description && (
                  <p className="text-sm text-gray-600">📝 {formData.description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
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
