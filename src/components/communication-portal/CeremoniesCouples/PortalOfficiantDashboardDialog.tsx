"use client"

import { useCallback, useEffect, useState } from "react"
import { OfficiantDashboardDialog } from "@/components/OfficiantDashboardDialog"
import { supabase } from "@/supabase/utils/client"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalOfficiantDashboardDialog() {
  const {
    contracts,
    getCoupleColors,
    handleContractAction,
    allCouples,
    setAllCouples,
    setActiveCoupleIndex,
    showDashboardDialog,
    setShowDashboardDialog,
    setEditCoupleInfo,
    setEditWeddingDetails,
    setViewingFile,
    setShowFileViewerDialog,
  } = useCommunicationPortal()
  const [userFiles, setUserFiles] = useState<any[]>([])

  const formatContractSize = (size?: number) => {
    if (!size) return "0 KB"
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${Math.max(1, Math.round(size / 1024))} KB`
  }

  const getDocumentType = (contract: any) => {
    const fileName = (contract.file?.name || contract.name || "").toLowerCase()
    const fileType = (contract.file?.type || contract.fileType || "").toLowerCase()

    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) return "PDF"
    if (fileName.endsWith(".docx")) return "DOCX"
    if (fileType.includes("word") || fileName.endsWith(".doc")) return "DOC"
    if (fileType.startsWith("text/") || fileName.endsWith(".txt")) return "TXT"
    return "FILE"
  }

  const loadUserFiles = useCallback(async () => {
    if (!showDashboardDialog) return

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (!userId) {
      setUserFiles([])
      return
    }

    const { data, error } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load saved documents:", error)
      setUserFiles([])
      return
    }

    setUserFiles(data || [])
  }, [showDashboardDialog])

  useEffect(() => {
    loadUserFiles()
  }, [loadUserFiles])

  const getUserFileType = (file: any) => {
    const fileName = (file.name || "").toLowerCase()
    const fileType = (file.type || "").toLowerCase()

    if (fileType.includes("pdf") || fileName.endsWith(".pdf")) return "PDF"
    if (fileName.endsWith(".docx")) return "DOCX"
    if (fileType.includes("word") || fileName.endsWith(".doc")) return "DOC"
    if (fileType.startsWith("text/") || fileName.endsWith(".txt")) return "TXT"
    if (fileType.includes("html") || fileName.endsWith(".html")) return "HTML"
    return "FILE"
  }

  const documentsData = [
    ...userFiles.map((file: any) => ({
      id: `user-file:${file.id}`,
      name: file.name,
      size: formatContractSize(file.size),
      type: getUserFileType(file),
      updated: file.created_at ? new Date(file.created_at).toLocaleDateString() : "Recently added",
      status: "Saved",
      source: "user_file" as const,
    })),
    ...contracts.map((contract: any) => ({
    id: contract.id.toString(),
    name: contract.name,
    size: formatContractSize(contract.fileSize || contract.file?.size),
    type: getDocumentType(contract),
    updated: contract.createdDate || "Recently added",
    status: contract.status ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1) : "Draft",
      source: "contract" as const,
    })),
  ]

  const getUserFileByDocumentId = (documentId: string) => {
    if (!documentId.startsWith("user-file:")) return null
    const id = documentId.replace("user-file:", "")
    return userFiles.find((file: any) => String(file.id) === id) || null
  }

  const handleSavedFileDownload = (documentId: string) => {
    const userFile = getUserFileByDocumentId(documentId)
    if (!userFile) return false
    window.open(userFile.url || "#", "_blank", "noopener,noreferrer")
    return true
  }

  const handleSavedFileEdit = (documentId: string) => {
    const userFile = getUserFileByDocumentId(documentId)
    if (!userFile) return false

    setViewingFile({
      id: userFile.id,
      name: userFile.name,
      size: formatContractSize(userFile.size),
      uploadedBy: "Officiant",
      date: userFile.created_at ? new Date(userFile.created_at).toLocaleDateString() : "",
      type: userFile.type || "text/plain",
      url: userFile.url || "#",
      category: "Saved Document",
      startInEditMode: true,
    })
    setShowFileViewerDialog(true)
    setShowDashboardDialog(false)
    return true
  }

  const handleSavedFileDelete = async (documentId: string) => {
    const userFile = getUserFileByDocumentId(documentId)
    if (!userFile) return false

    const { error } = await supabase
      .from("user_files")
      .delete()
      .eq("id", userFile.id)

    if (error) {
      console.error("Failed to delete saved document:", error)
      return true
    }

    setUserFiles((prev) => prev.filter((file: any) => file.id !== userFile.id))
    return true
  }

  const handleAssignSavedFileToCouple = async (documentId: string, coupleId: number) => {
    const userFile = getUserFileByDocumentId(documentId)
    if (!userFile) return

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (!userId) return

    const { error } = await supabase
      .from("couple_files")
      .insert({
        user_id: userId,
        couple_id: coupleId,
        file_name: userFile.name,
        file_url: userFile.url,
        file_type: userFile.type || "text/plain",
        file_size: userFile.size || 0,
        category: "Purchased Script",
      })

    if (error) {
      console.error("Failed to add script to couple:", error)
    }
  }

  return (
    <>
      {/* Officiant Dashboard Dialog */}
      <OfficiantDashboardDialog
        open={showDashboardDialog}
        onOpenChange={setShowDashboardDialog}
        couples={allCouples}
        documentsData={documentsData}
        onDocumentView={(documentId) => {
          if (handleSavedFileDownload(documentId)) return
          handleContractAction(Number(documentId), "view")
        }}
        onDocumentDownload={(documentId) => {
          if (handleSavedFileDownload(documentId)) return
          const contract = contracts.find((item: any) => item.id.toString() === documentId)
          if (!contract) return
          window.open(contract.file?.url || contract.fileUrl || "#", "_blank", "noopener,noreferrer")
        }}
        onDocumentEdit={(documentId) => {
          if (handleSavedFileEdit(documentId)) return
          handleContractAction(Number(documentId), "view")
        }}
        onDocumentDelete={async (documentId) => {
          if (await handleSavedFileDelete(documentId)) return
          handleContractAction(Number(documentId), "delete")
        }}
        onDocumentAssignToCouple={handleAssignSavedFileToCouple}
        onSelectCouple={(ceremonyId) => {
          // Find the couple by ID and set as active
          const coupleIndex = allCouples.findIndex((c) => c.id.toString() === ceremonyId)
          if (coupleIndex !== -1) {
            setActiveCoupleIndex(coupleIndex)
            setEditCoupleInfo(allCouples[coupleIndex])
            // Load the wedding details for the selected couple
            setEditWeddingDetails(allCouples[coupleIndex].weddingDetails || {
              venueName: "",
              venueAddress: "",
              weddingDate: "",
              startTime: "",
              endTime: "",
              expectedGuests: ""
            })
          }
        }}
        onAddCeremony={(newCouple) => {
          // Add new couple to the list
          const newId = Math.max(...allCouples.map(c => c.id), 0) + 1
          const coupleWithId = {
            id: newId,
            brideName: newCouple.brideName || "New Partner 1",
            brideEmail: newCouple.brideEmail || "",
            bridePhone: newCouple.bridePhone || "",
            brideAddress: newCouple.brideAddress || "",
            groomName: newCouple.groomName || "New Partner 2",
            groomEmail: newCouple.groomEmail || "",
            groomPhone: newCouple.groomPhone || "",
            groomAddress: newCouple.groomAddress || "",
            address: newCouple.address || "",
            emergencyContact: newCouple.emergencyContact || "",
            specialRequests: newCouple.specialRequests || "",
            isActive: true,
            colors: getCoupleColors(newId), // Assign consistent colors based on ID
            weddingDetails: {
              venueName: newCouple.weddingDetails?.venueName || "",
              venueAddress: newCouple.weddingDetails?.venueAddress || "",
              weddingDate: newCouple.weddingDetails?.weddingDate || new Date().toISOString().split('T')[0],
              startTime: newCouple.weddingDetails?.startTime || "12:00",
              endTime: newCouple.weddingDetails?.endTime || "",
              expectedGuests: newCouple.weddingDetails?.expectedGuests || "0",
              officiantNotes: ""
            },
          }
          const updatedCouples = [...allCouples, coupleWithId]
          setAllCouples(updatedCouples)

          // Set the newly created couple as the active couple
          setActiveCoupleIndex(updatedCouples.length - 1)
          setEditCoupleInfo(coupleWithId)

          // Load the wedding details for the new couple
          setEditWeddingDetails(coupleWithId.weddingDetails)
        }}
      />
    </>
  )
}
