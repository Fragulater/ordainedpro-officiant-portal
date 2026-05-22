"use client"

import { ContractUploadDialog } from "@/components/ContractUploadDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalContractUploadDialog() {
  const {
    showContractUploadDialog,
    setShowContractUploadDialog,
    handleContractUploaded,
    addDefaultContractForCurrentCouple,
    contractPrefillDefaults,
    setContractPrefillDefaults,
    hasAcceptedDefaultContractLegal,
    acceptDefaultContractLegalAcknowledgment,
    acceptUploadedContractLegalAcknowledgment,
  } = useCommunicationPortal()

  return (
    <>
      {/* Contract Upload Dialog */}
      <ContractUploadDialog
        isOpen={showContractUploadDialog}
        onOpenChange={setShowContractUploadDialog}
        onContractUploaded={handleContractUploaded}
        onUseDefaultContract={addDefaultContractForCurrentCouple}
        contractPrefillDefaults={contractPrefillDefaults}
        setContractPrefillDefaults={setContractPrefillDefaults}
        hasAcceptedDefaultContractLegal={hasAcceptedDefaultContractLegal}
        onAcceptDefaultContractLegal={acceptDefaultContractLegalAcknowledgment}
        onAcceptUploadedContractLegal={acceptUploadedContractLegalAcknowledgment}
      />
    </>
  )
}
