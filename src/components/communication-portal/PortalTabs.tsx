"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, FileText, CheckSquare, Calendar as CalendarIcon, FileSignature, DollarSign, ShoppingCart, Edit } from "lucide-react"
import { useCommunicationPortal } from "./CommunicationPortalContext"
import { MessagesTab } from "./Messages/MessagesTab"
import { TasksTab } from "./Tasks/TasksTab"
import { FilesTab } from "./Files/FilesTab"
import { MeetingsTab } from "./Meetings/MeetingsTab"
import { ContractsTab } from "./Contracts/ContractsTab"
import { PaymentsTab } from "./Payments/PaymentsTab"
import { BuildScriptTab } from "./Scripts/BuildScriptTab"
import { ScriptMarketplaceTab } from "./Scripts/ScriptMarketplaceTab"

export function PortalTabs() {
  const { editCoupleInfo, setShowAddCeremonyDialog } = useCommunicationPortal()

  // Show tabs with an initial empty state when no couple is selected
  const hasCouple = !!editCoupleInfo?.brideName

  return (
    <Tabs defaultValue="messages" className="space-y-6">
      <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:grid-cols-8 bg-white shadow-sm border border-blue-100">
        <TabsTrigger value="messages" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <MessageCircle className="w-4 h-4" />
          <span>Messages</span>
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <FileText className="w-4 h-4" />
          <span>Files</span>
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </TabsTrigger>
        <TabsTrigger value="calendar" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <CalendarIcon className="w-4 h-4" />
          <span>Schedule</span>
        </TabsTrigger>
        <TabsTrigger value="contracts" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <FileSignature className="w-4 h-4" />
          <span>Contracts</span>
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <DollarSign className="w-4 h-4" />
          <span>Payments</span>
        </TabsTrigger>
        <TabsTrigger value="buildscript" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <Edit className="w-4 h-4" />
          <span>Build Script</span>
        </TabsTrigger>
        <TabsTrigger value="marketplace" className="flex items-center space-x-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
          <ShoppingCart className="w-4 h-4" />
          <span>Scripts</span>
        </TabsTrigger>
      </TabsList>

      {/* Messages Tab */}
      {hasCouple ? (
        <MessagesTab />
      ) : (
        <div className="bg-white border border-blue-100 rounded-lg p-10 text-center text-gray-600">
          <p className="mb-2">No couple selected yet.</p>
          <button
            className="text-blue-600 underline"
            onClick={() => setShowAddCeremonyDialog?.(true)}
          >
            Add your first ceremony
          </button>
        </div>
      )}

      {/* Tasks Tab */}
      {hasCouple ? <TasksTab /> : null}

      {/* Files Tab */}
      {hasCouple ? <FilesTab /> : null}

      {/* Calendar Tab */}
      {hasCouple ? <MeetingsTab /> : null}

      {/* Contracts Tab */}
      {hasCouple ? <ContractsTab /> : null}

      {/* Payments Tab */}
      {hasCouple ? <PaymentsTab /> : null}

      {/* Build Wedding Script Tab */}
      <BuildScriptTab />

      {/* Script Marketplace Tab */}
      <ScriptMarketplaceTab />
    </Tabs>
  )
}
