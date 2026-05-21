"use client"

import { ScheduleMeetingDialog } from "@/components/ScheduleMeetingDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalScheduleMeetingDialog() {
  const {
    showScheduleMeetingDialog,
    setShowScheduleMeetingDialog,
    editCoupleInfo,
    handleScheduleMeeting,
    officiantProfile,
    currentUser,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  const officiantName =
    [
      officiantProfile?.full_name,
      officiantProfile?.name,
      currentUser?.user_metadata?.full_name,
      currentUser?.user_metadata?.name
    ]
      .map((name) => name?.trim())
      .find((name) => name && !name.includes("@")) || "Officiant"
  const coupleEmails = [editCoupleInfo.brideEmail || "", editCoupleInfo.groomEmail || ""]
  const dialogKey = [
    editCoupleInfo.id,
    editCoupleInfo.brideName,
    editCoupleInfo.groomName,
    ...coupleEmails,
  ].join("|")

  return (
    <>
      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog
        key={dialogKey}
        isOpen={showScheduleMeetingDialog}
        onOpenChange={setShowScheduleMeetingDialog}
        onScheduleMeeting={handleScheduleMeeting}
        coupleEmails={coupleEmails}
        coupleName={`${editCoupleInfo.brideName?.split(' ')[0] || 'Bride'} & ${editCoupleInfo.groomName?.split(' ')[0] || 'Groom'}`}
        officiantName={officiantName}
        officiantEmail={officiantProfile?.email || currentUser?.email || ""}
        officiantPhone={officiantProfile?.phone || ""}
      />
    </>
  )
}
