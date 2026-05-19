"use client"

import { AddTaskDialog } from "@/components/AddTaskDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalAddTaskDialog() {
  const {
    showAddTaskDialog,
    setShowAddTaskDialog,
    handleAddTask,
    officiantProfile,
    currentUser,
  } = useCommunicationPortal()

  return (
    <>
      {/* Add Task Dialog */}
      <AddTaskDialog
        isOpen={showAddTaskDialog}
        onOpenChange={setShowAddTaskDialog}
        onAddTask={handleAddTask}
        reminderRecipient={officiantProfile?.email || currentUser?.email || "Officiant"}
      />
    </>
  )
}
