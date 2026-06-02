"use client"

import { ContractUploadDialog } from "@/components/ContractUploadDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalContractUploadDialog() {
  const {
    showContractUploadDialog,
    setShowContractUploadDialog,
    editingContractForUpload,
    setEditingContractForUpload,
    handleContractUploaded,
    handleContractUpdated,
    addDefaultContractForCurrentCouple,
    contractPrefillDefaults,
    setContractPrefillDefaults,
    hasAcceptedDefaultContractLegal,
    acceptDefaultContractLegalAcknowledgment,
    acceptUploadedContractLegalAcknowledgment,
    isCurrentCeremonyWedding,
    editCoupleInfo,
  } = useCommunicationPortal()

  const handleOpenChange = (open: boolean) => {
    setShowContractUploadDialog(open)
    if (!open) {
      setEditingContractForUpload(null)
    }
  }

  return (
    <>
      {/* Contract Upload Dialog */}
      <ContractUploadDialog
        isOpen={showContractUploadDialog}
        onOpenChange={handleOpenChange}
        onContractUploaded={handleContractUploaded}
        onContractUpdated={handleContractUpdated}
        editingContract={editingContractForUpload}
        onUseDefaultContract={addDefaultContractForCurrentCouple}
        contractPrefillDefaults={contractPrefillDefaults}
        setContractPrefillDefaults={setContractPrefillDefaults}
        hasAcceptedDefaultContractLegal={hasAcceptedDefaultContractLegal}
        onAcceptDefaultContractLegal={acceptDefaultContractLegalAcknowledgment}
        onAcceptUploadedContractLegal={acceptUploadedContractLegalAcknowledgment}
        allowDefaultContract={isCurrentCeremonyWedding}
        ceremonyType={editCoupleInfo?.ceremonyType || editCoupleInfo?.ceremonyTypeLabel || ""}
      />
    </>
  )
}
