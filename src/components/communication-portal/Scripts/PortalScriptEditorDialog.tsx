"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BasicTextEditor, SCRIPT_EDITOR_MAX_CHARACTERS, stripEditorHtml } from "@/components/BasicTextEditor"
import { Edit, Save } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalScriptEditorDialog() {
  const {
    showScriptEditorDialog,
    setShowScriptEditorDialog,
    editingScript,
    scriptContent,
    setScriptContent,
    autoSave,
    handleSaveScript,
  } = useCommunicationPortal()

  const plainText = typeof document === "undefined"
    ? scriptContent.replace(/<[^>]*>/g, "")
    : stripEditorHtml(scriptContent)
  const charCount = plainText.length
  const isTooShort = charCount < 50
  const isTooLong = charCount > SCRIPT_EDITOR_MAX_CHARACTERS

  return (
    <Dialog open={showScriptEditorDialog} onOpenChange={setShowScriptEditorDialog}>
      <DialogContent className="max-h-[95vh] max-w-6xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-pink-900">
            <Edit className="mr-2 h-5 w-5" />
            Script Editor - {editingScript?.title}
          </DialogTitle>
          <DialogDescription>
            Edit and customize the ceremony script.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto">
          <BasicTextEditor
            value={scriptContent}
            onChange={setScriptContent}
            minHeightClassName="min-h-[560px]"
            maxCharacters={SCRIPT_EDITOR_MAX_CHARACTERS}
          />
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            <div>
              <span className="font-medium">Last saved:</span>{" "}
              {editingScript?.lastModified || "Never"}
            </div>
            <div
              className={`mt-1 text-xs ${
                isTooShort || isTooLong ? "text-red-600" : "text-gray-400"
              }`}
            >
              {isTooShort
                ? `Need ${50 - charCount} more characters to save`
                : isTooLong
                ? `${charCount - SCRIPT_EDITOR_MAX_CHARACTERS} characters over limit`
                : `Requirements: 50-${SCRIPT_EDITOR_MAX_CHARACTERS.toLocaleString()} characters`}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={autoSave}
              className="border-pink-200 text-pink-700 hover:bg-pink-50"
            >
              Auto-save
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowScriptEditorDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveScript}
              className="bg-pink-500 hover:bg-pink-600"
              disabled={isTooShort || isTooLong}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Script
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
