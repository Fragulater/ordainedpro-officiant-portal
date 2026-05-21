"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BasicTextEditor, normalizeTextForEditor } from "@/components/BasicTextEditor"
import { BookText, Download, Eye, FileText, Save, Trash2 } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"
import { supabase } from "@/supabase/utils/client"
import { updateContract } from "@/services/couple-data-service"

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

export function PortalContractViewerDialog() {
  const {
    contracts,
    setContracts,
    showContractViewerDialog,
    setShowContractViewerDialog,
    viewingContract,
    setViewingContract,
    handleContractAction,
  } = useCommunicationPortal()

  const [textContent, setTextContent] = useState("")
  const [editedText, setEditedText] = useState("")
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [isSavingText, setIsSavingText] = useState(false)

  const fileUrl = viewingContract?.file?.url || viewingContract?.fileUrl || ""
  const fileType = (viewingContract?.file?.type || viewingContract?.fileType || "").toLowerCase()
  const fileName = viewingContract?.file?.name || viewingContract?.name || "Contract"
  const isPdf = fileType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")
  const isImage = fileType.startsWith("image/")
  const isText = fileType.startsWith("text/") || fileName.toLowerCase().endsWith(".txt")
  const hasDownload = Boolean(fileUrl && fileUrl !== "#")
  const isTextDirty = isText && editedText !== textContent

  useEffect(() => {
    const loadText = async () => {
      if (!showContractViewerDialog || !isText || !fileUrl) {
        setTextContent("")
        setEditedText("")
        return
      }

      setIsLoadingText(true)
      try {
        const response = await fetch(fileUrl)
        const text = response.ok ? await response.text() : ""
        const editorText = normalizeTextForEditor(text)
        setTextContent(editorText)
        setEditedText(editorText)
      } catch (error) {
        console.error("Failed to load contract text:", error)
        setTextContent("")
        setEditedText("")
      } finally {
        setIsLoadingText(false)
      }
    }

    loadText()
  }, [showContractViewerDialog, isText, fileUrl])

  const createdLabel = useMemo(() => {
    if (!viewingContract?.createdDate) return ""
    return viewingContract.createdDate
  }, [viewingContract?.createdDate])

  const handleDownload = async () => {
    if (!hasDownload) return

    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(link)
      }, 100)
    } catch (error) {
      console.error("Failed to download contract:", error)
      window.open(fileUrl, "_blank", "noopener,noreferrer")
    }
  }

  const handleDelete = async () => {
    if (!viewingContract) return
    await handleContractAction(viewingContract.id, "delete")
    setViewingContract(null)
    setShowContractViewerDialog(false)
  }

  const handleSaveText = async () => {
    if (!viewingContract || !isText || !fileUrl) return

    const storagePath = deriveContractStoragePath(fileUrl)
    if (!storagePath) {
      alert("Unable to locate the contract file in storage.")
      return
    }

    setIsSavingText(true)
    try {
      const textBlob = new Blob([editedText], { type: "text/html;charset=utf-8" })
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(storagePath, textBlob, {
          contentType: "text/html;charset=utf-8",
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      const updateResult = await updateContract(viewingContract.id, {
        file_size: textBlob.size,
      })

      if (!updateResult.ok) {
        throw new Error(updateResult.error || "Failed to update contract metadata.")
      }

      const updatedContract = {
        ...viewingContract,
        fileSize: textBlob.size,
        file: viewingContract.file
          ? {
              ...viewingContract.file,
              size: textBlob.size,
              type: "text/html",
            }
          : viewingContract.file,
      }

      setTextContent(editedText)
      setViewingContract(updatedContract)
      setContracts(
        contracts.map((contract: any) =>
          contract.id === viewingContract.id ? updatedContract : contract
        )
      )
    } catch (error) {
      console.error("Failed to save contract text:", error)
      alert(error instanceof Error ? error.message : "Failed to save contract text.")
    } finally {
      setIsSavingText(false)
    }
  }

  const renderPreview = () => {
    if (!viewingContract) return null

    if (isImage) {
      return (
        <div className="flex justify-center">
          <img
            src={fileUrl}
            alt={viewingContract.name}
            className="max-w-full max-h-[65vh] rounded-lg border object-contain"
          />
        </div>
      )
    }

    if (isPdf) {
      return (
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <FileText className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{viewingContract.name}</p>
            <p className="text-sm text-gray-500">PDF contract preview</p>
          </div>
          <Button
            onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Open PDF
          </Button>
        </div>
      )
    }

    if (isText) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
              <BookText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{viewingContract.name}</p>
              <p className="text-sm text-gray-600">Editable text contract</p>
            </div>
          </div>

          {isLoadingText ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-6 text-blue-700">
              Loading contract...
            </div>
          ) : (
            <BasicTextEditor
              value={editedText}
              onChange={setEditedText}
              minHeightClassName="min-h-[360px]"
              maxCharacters={20000}
            />
          )}
        </div>
      )
    }

    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{viewingContract.name}</p>
          <p className="text-sm text-gray-500">Preview is not available for this file type.</p>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={showContractViewerDialog} onOpenChange={setShowContractViewerDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {isText ? "Contract Editor" : "Contract Viewer"}
          </DialogTitle>
          <DialogDescription>
            {viewingContract
              ? isText
                ? `Editing: ${viewingContract.name}`
                : `Viewing: ${viewingContract.name}`
              : "Contract preview"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderPreview()}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="text-sm text-gray-500">
            {viewingContract && (
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  <span className="font-medium">Status:</span>
                  <Badge className={`ml-1 ${
                    viewingContract.status === "signed"
                      ? "bg-green-100 text-green-800"
                      : viewingContract.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {viewingContract.status.charAt(0).toUpperCase() + viewingContract.status.slice(1)}
                  </Badge>
                </span>
                <span>
                  <span className="font-medium">Type:</span> {viewingContract.type}
                </span>
                {createdLabel && (
                  <span>
                    <span className="font-medium">Created:</span> {createdLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowContractViewerDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            {hasDownload && (
              <Button
                onClick={handleDownload}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            {isText && (
              <Button
                onClick={handleSaveText}
                disabled={!isTextDirty || isSavingText || isLoadingText}
                className="bg-green-500 hover:bg-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingText ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
