"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Send, Paperclip, FileEdit, Share } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalShareScriptDialog() {
  const {
    editCoupleInfo,
    generatedScripts,
    showShareScriptDialog,
    setShowShareScriptDialog,
    sharingScript,
    shareScriptForm,
    setShareScriptForm,
    selectedItemsToShare,
    setSelectedItemsToShare,
    files,
    handleSendScript,
    coupleScripts,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Share Script Dialog */}
      <Dialog open={showShareScriptDialog} onOpenChange={setShowShareScriptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-900 flex items-center">
              <Share className="w-5 h-5 mr-2" />
              Share Script with Couple
            </DialogTitle>
            <DialogDescription>
              {sharingScript ? `Send "${sharingScript.title}" to the couple for review` : 'Send script to the couple'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Selection Section */}
            <div className="space-y-4">
              {/* Saved Scripts Section */}
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <h4 className="font-semibold text-pink-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Saved Scripts
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {coupleScripts.length === 0 ? (
                    <p className="text-sm text-pink-600 italic">No saved scripts available</p>
                  ) : (
                    coupleScripts.map((script) => (
                      <label key={script.id} className="flex items-start space-x-3 p-2 hover:bg-pink-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItemsToShare.scripts.includes(script.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: [...selectedItemsToShare.scripts, script.id]
                              })
                            } else {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: selectedItemsToShare.scripts.filter(id => id !== script.id)
                              })
                            }
                          }}
                          className="mt-1 text-pink-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-pink-900 text-sm">{script.title}</p>
                          <p className="text-xs text-pink-700">{script.type} • {script.status}</p>
                          <p className="text-xs text-pink-600">Last modified: {script.lastModified}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Generated Scripts Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <FileEdit className="w-4 h-4 mr-2" />
                  AI Generated Scripts
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {generatedScripts.length === 0 ? (
                    <p className="text-sm text-blue-600 italic">No generated scripts available</p>
                  ) : (
                    generatedScripts.map((script) => (
                      <label key={script.id} className="flex items-start space-x-3 p-2 hover:bg-blue-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItemsToShare.scripts.includes(script.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: [...selectedItemsToShare.scripts, script.id]
                              })
                            } else {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                scripts: selectedItemsToShare.scripts.filter(id => id !== script.id)
                              })
                            }
                          }}
                          className="mt-1 text-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 text-sm">{script.title}</p>
                          <p className="text-xs text-blue-700">{script.type} • {script.status}</p>
                          <p className="text-xs text-blue-600">Created: {script.createdDate}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Files Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Uploaded Files
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.length === 0 ? (
                    <p className="text-sm text-green-600 italic">No files uploaded</p>
                  ) : (
                    files.map((file) => (
                      <label key={file.id} className="flex items-start space-x-3 p-2 hover:bg-green-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItemsToShare.files.includes(file.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                files: [...selectedItemsToShare.files, file.id]
                              })
                            } else {
                              setSelectedItemsToShare({
                                ...selectedItemsToShare,
                                files: selectedItemsToShare.files.filter(id => id !== file.id)
                              })
                            }
                          }}
                          className="mt-1 text-green-600"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-green-900 text-sm">{file.name}</p>
                          <p className="text-xs text-green-700">{file.type.split('/').pop()} • {file.size}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              <div className={`p-3 rounded-lg border ${
                (selectedItemsToShare.scripts.length + selectedItemsToShare.files.length) > 5
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-sm font-medium ${
                  (selectedItemsToShare.scripts.length + selectedItemsToShare.files.length) > 5
                    ? 'text-red-700'
                    : 'text-gray-700'
                }`}>
                  Selected: {selectedItemsToShare.scripts.length} script(s), {selectedItemsToShare.files.length} file(s)
                  <span className="text-gray-500 ml-2">(max 5 items)</span>
                </p>
                {(selectedItemsToShare.scripts.length + selectedItemsToShare.files.length) > 5 && (
                  <p className="text-xs text-red-600 mt-1">
                    Please deselect some items. Maximum 5 items allowed per share.
                  </p>
                )}
              </div>
            </div>

            {/* Share Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="shareScriptTo" className="text-sm font-medium text-gray-700">
                  Send To: *
                </Label>
                <div className="space-y-2 mt-1">
                  {/* Preset email options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="both"
                        checked={shareScriptForm.to === 'both'}
                        onChange={(e) => setShareScriptForm({...shareScriptForm, to: e.target.value, customEmail: ''})}
                        className="text-pink-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Both</span> - {editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="bride"
                        checked={shareScriptForm.to === 'bride'}
                        onChange={(e) => setShareScriptForm({...shareScriptForm, to: e.target.value, customEmail: ''})}
                        className="text-pink-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{editCoupleInfo?.brideName || 'Bride'}</span> - {editCoupleInfo?.brideEmail || 'No email'}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="groom"
                        checked={shareScriptForm.to === 'groom'}
                        onChange={(e) => setShareScriptForm({...shareScriptForm, to: e.target.value, customEmail: ''})}
                        className="text-pink-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{editCoupleInfo?.groomName || 'Groom'}</span> - {editCoupleInfo?.groomEmail || 'No email'}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="custom"
                        checked={shareScriptForm.customEmail !== ''}
                        onChange={(e) => setShareScriptForm({...shareScriptForm, to: '', customEmail: 'custom'})}
                        className="text-pink-600"
                      />
                      <span className="text-sm font-medium">Other email address:</span>
                    </label>
                  </div>
                  {/* Custom email input */}
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={shareScriptForm.customEmail === 'custom' ? '' : shareScriptForm.customEmail}
                    onChange={(e) => setShareScriptForm({...shareScriptForm, to: '', customEmail: e.target.value})}
                    disabled={shareScriptForm.to !== '' && shareScriptForm.customEmail === ''}
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shareScriptSubject" className="text-sm font-medium text-gray-700">
                  Subject: *
                </Label>
                <Input
                  id="shareScriptSubject"
                  value={shareScriptForm.subject}
                  onChange={(e) => setShareScriptForm({...shareScriptForm, subject: e.target.value})}
                  placeholder="Email subject"
                  className="mt-1 border-pink-200 focus:border-pink-500"
                />
              </div>

              <div>
                <Label htmlFor="shareScriptBody" className="text-sm font-medium text-gray-700">
                  Message: *
                </Label>
                <Textarea
                  id="shareScriptBody"
                  value={shareScriptForm.body}
                  onChange={(e) => setShareScriptForm({...shareScriptForm, body: e.target.value})}
                  placeholder="Personal message to accompany the script"
                  rows={6}
                  className="mt-1 border-pink-200 focus:border-pink-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeNotes"
                  checked={shareScriptForm.includeNotes}
                  onChange={(e) => setShareScriptForm({...shareScriptForm, includeNotes: e.target.checked})}
                  className="text-pink-600"
                />
                <Label htmlFor="includeNotes" className="text-sm text-gray-700">
                  Include script notes and instructions
                </Label>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Share Preview</h5>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">To:</span> {
                  shareScriptForm.to === 'both'
                    ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
                    : shareScriptForm.to === 'bride'
                    ? editCoupleInfo.brideEmail
                    : shareScriptForm.to === 'groom'
                    ? editCoupleInfo.groomEmail
                    : shareScriptForm.customEmail || 'No recipient selected'
                }</p>
                <p><span className="font-medium">Subject:</span> {shareScriptForm.subject || 'No subject'}</p>
                <p><span className="font-medium">Items:</span> {selectedItemsToShare.scripts.length + selectedItemsToShare.files.length} selected</p>
                <p><span className="font-medium">Include Notes:</span> {shareScriptForm.includeNotes ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowShareScriptDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendScript}
              className="bg-pink-500 hover:bg-pink-600"
              disabled={
                (!shareScriptForm.to && !shareScriptForm.customEmail) ||
                !shareScriptForm.subject.trim() ||
                !shareScriptForm.body.trim() ||
                (selectedItemsToShare.scripts.length === 0 && selectedItemsToShare.files.length === 0) ||
                (selectedItemsToShare.scripts.length + selectedItemsToShare.files.length) > 5
              }
            >
              <Send className="w-4 h-4 mr-2" />
              Share Items
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
