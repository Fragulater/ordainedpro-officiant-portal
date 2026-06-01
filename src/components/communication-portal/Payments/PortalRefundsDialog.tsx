"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefundsView } from "@/components/officiant-dashboard/RefundsView"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalRefundsDialog() {
  const {
    currentUser,
    showRefundsDialog,
    setShowRefundsDialog,
  } = useCommunicationPortal()

  return (
    <Dialog open={showRefundsDialog} onOpenChange={setShowRefundsDialog}>
      <DialogContent className="max-h-[90vh] max-w-[min(1100px,calc(100vw-2rem))] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Refunds</DialogTitle>
        </DialogHeader>
        <RefundsView userId={currentUser?.id} />
      </DialogContent>
    </Dialog>
  )
}
