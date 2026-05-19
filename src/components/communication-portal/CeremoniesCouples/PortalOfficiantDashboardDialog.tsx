"use client"

import { OfficiantDashboardDialog } from "@/components/OfficiantDashboardDialog"
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
  } = useCommunicationPortal()

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

  const documentsData = contracts.map((contract: any) => ({
    id: contract.id.toString(),
    name: contract.name,
    size: formatContractSize(contract.fileSize || contract.file?.size),
    type: getDocumentType(contract),
    updated: contract.createdDate || "Recently added",
    status: contract.status ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1) : "Draft",
  }))

  return (
    <>
      {/* Officiant Dashboard Dialog */}
      <OfficiantDashboardDialog
        open={showDashboardDialog}
        onOpenChange={setShowDashboardDialog}
        couples={allCouples}
        documentsData={documentsData}
        onDocumentView={(documentId) => handleContractAction(Number(documentId), "view")}
        onDocumentDownload={(documentId) => {
          const contract = contracts.find((item: any) => item.id.toString() === documentId)
          if (!contract) return
          window.open(contract.file?.url || contract.fileUrl || "#", "_blank", "noopener,noreferrer")
        }}
        onDocumentDelete={(documentId) => handleContractAction(Number(documentId), "delete")}
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
