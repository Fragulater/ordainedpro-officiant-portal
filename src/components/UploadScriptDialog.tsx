"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, File, X } from "lucide-react"
import { supabase } from "@/supabase/utils/client"

interface UploadScriptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

export function UploadScriptDialog({ open, onOpenChange, onUploadSuccess }: UploadScriptDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      else setUser(user);
      console.log("Fetched user:", user);
    };
    fetchUser();
  }, []);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    const fileInput = document.getElementById('script-file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadProgress(0)

    try {
      // ✅ Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to upload scripts")

      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}_${selectedFile.name}`
      const filePath = `scripts/${user.id}/${fileName}`

      // ✅ 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("scripts") // <-- make sure this bucket exists
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      // ✅ 2. Get public file URL
      const { data: publicUrlData } = supabase.storage
        .from("scripts")
        .getPublicUrl(filePath)
      const fileUrl = publicUrlData?.publicUrl

      // ✅ 3. Insert file record into "scripts" table
      const { error: insertError } = await supabase.from("scripts").insert([
        {
          user_id: user.id,
          title: selectedFile.name,
          content: "",
          category: "Custom",
          is_published: false,
          price: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (insertError) throw insertError

      setUploadProgress(100)
      alert("✅ Script uploaded successfully!")
      setSelectedFile(null)
      if (onUploadSuccess) onUploadSuccess()
      onOpenChange(false)

    } catch (err: any) {
      console.error("❌ Upload failed:", err.message)
      alert("Upload failed: " + err.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Upload Script to Library
          </DialogTitle>
          <DialogDescription>
            Upload your ceremony script files. Supported formats: .txt, .doc, .docx, .pdf, .rtf, .odt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="script-file-input">Select File</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="script-file-input"
                type="file"
                accept=".txt,.doc,.docx,.pdf,.rtf,.odt"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <label
                htmlFor="script-file-input"
                className="flex-1 cursor-pointer"
              >
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Max file size: 10MB
                  </p>
                </div>
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <File className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {uploading && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Script'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
