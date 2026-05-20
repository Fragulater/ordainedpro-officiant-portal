"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Send } from "lucide-react"
import { Contract } from "@/components/ContractUploadDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalSendContractEmailDialog() {
  const {
    showSendContractDialog,
    setShowSendContractDialog,
    sendingContract,
    isSendingContractEmail,
    emailForm,
    setEmailForm,
    editCoupleInfo,
    handleSendContractEmail,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Send Contract Email Dialog */}
      <Dialog open={showSendContractDialog} onOpenChange={setShowSendContractDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-900 flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Send Contract via Email
            </DialogTitle>
            <DialogDescription>
              {sendingContract ? `Send "${sendingContract.name}" to recipients` : 'Send contract to recipients'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Contract Information */}
            {sendingContract && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Contract Attachment
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{sendingContract.name}</p>
                    <p className="text-sm text-green-700">Type: {sendingContract.type.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="emailTo" className="text-sm font-medium text-gray-700">
                  To: *
                </Label>
                <div className="space-y-2 mt-1">
                  {/* Preset email options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.brideEmail}
                        checked={emailForm.to === editCoupleInfo.brideEmail}
                        onChange={(e) => setEmailForm({...emailForm, to: e.target.value, customEmail: ''})}
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{editCoupleInfo?.brideName || 'Bride'}</span> - {editCoupleInfo?.brideEmail || 'No email'}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.groomEmail}
                        checked={emailForm.to === editCoupleInfo.groomEmail}
                        onChange={(e) => setEmailForm({...emailForm, to: e.target.value, customEmail: ''})}
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{editCoupleInfo?.groomName || 'Groom'}</span> - {editCoupleInfo?.groomEmail || 'No email'}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="both"
                        checked={emailForm.to === "both"}
                        onChange={(e) => setEmailForm({...emailForm, to: e.target.value, customEmail: ''})}
                        className="text-green-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Both</span> - {editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="custom"
                        checked={emailForm.customEmail !== ''}
                        onChange={(e) => setEmailForm({...emailForm, to: '', customEmail: 'custom'})}
                        className="text-green-600"
                      />
                      <span className="text-sm font-medium">Other email address:</span>
                    </label>
                  </div>
                  {/* Custom email input */}
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailForm.customEmail === 'custom' ? '' : emailForm.customEmail}
                    onChange={(e) => setEmailForm({...emailForm, to: '', customEmail: e.target.value})}
                    disabled={emailForm.to !== '' && emailForm.customEmail === ''}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="emailSubject" className="text-sm font-medium text-gray-700">
                  Subject: *
                </Label>
                <Input
                  id="emailSubject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                  placeholder="Email subject"
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>

              <div>
                <Label htmlFor="emailBody" className="text-sm font-medium text-gray-700">
                  Message: *
                </Label>
                <Textarea
                  id="emailBody"
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
                  placeholder="Email message body"
                  rows={6}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Email Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2">Email Preview</h5>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">To:</span> {
                  emailForm.to === 'both'
                    ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
                    : emailForm.to || emailForm.customEmail || 'No recipient selected'
                }</p>
                <p><span className="font-medium">Subject:</span> {emailForm.subject || 'No subject'}</p>
                <p><span className="font-medium">Document link:</span> {sendingContract?.name || 'No contract'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSendContractDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendContractEmail}
              className="bg-green-500 hover:bg-green-600"
              disabled={
                isSendingContractEmail ||
                (!emailForm.to && !emailForm.customEmail) ||
                emailForm.customEmail === 'custom' ||
                !emailForm.subject.trim() ||
                !emailForm.body.trim()
              }
            >
              <Send className="w-4 h-4 mr-2" />
              {isSendingContractEmail ? "Sending..." : "Send Contract"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
