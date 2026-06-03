"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, AlertCircle } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

const sanitizeReminderText = (value: string) =>
  String(value || "")
    .replace(/Quincea(?:ÃƒÆ’Ã‚Â±|ÃƒÂ±|ÃƒÆ’Ã‚Â±|Ã±)era/gi, "Quinceanera")
    .replace(/Ã¢â‚¬Â¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢/g, "-")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢/g, "'")
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â/g, '"')
    .replace(/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“|ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, "-")
    .replace(/Ã‚/g, "")
    .replace(/ÃƒÆ’/g, "")

export function PortalSendPaymentReminderDialog() {
  const {
    showSendPaymentReminderDialog,
    setShowSendPaymentReminderDialog,
    paymentReminderForm,
    setPaymentReminderForm,
    editCoupleInfo,
    handleSendPaymentReminderEmail,
    paymentInfo,
    isSendingMessage,
    currentCeremonyType,
    currentCeremonyConfig,
  } = useCommunicationPortal()
  const recipientGroupLabel =
    currentCeremonyType === "wedding"
      ? "both couple members"
      : "both listed contacts"

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Send Payment Reminder Dialog */}
      <Dialog open={showSendPaymentReminderDialog} onOpenChange={setShowSendPaymentReminderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Send Payment Reminder
            </DialogTitle>
            <DialogDescription>
              {paymentReminderForm.to === 'both'
                ? `Send payment reminder to ${recipientGroupLabel}`
                : `Send ${currentCeremonyConfig?.label?.toLowerCase() || "ceremony"} payment reminder to selected recipient`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Reminder Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentReminderTo" className="text-sm font-medium text-gray-700">
                  To: *
                </Label>
                <div className="space-y-2 mt-1">
                  {/* Preset email options */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value="both"
                        checked={paymentReminderForm.to === 'both'}
                        onChange={(e) => setPaymentReminderForm({...paymentReminderForm, to: e.target.value})}
                        className="text-orange-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Both</span> - {editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipient"
                        value={editCoupleInfo.brideEmail}
                        checked={paymentReminderForm.to === editCoupleInfo.brideEmail}
                        onChange={(e) => setPaymentReminderForm({...paymentReminderForm, to: e.target.value})}
                        className="text-orange-600"
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
                        checked={paymentReminderForm.to === editCoupleInfo.groomEmail}
                        onChange={(e) => setPaymentReminderForm({...paymentReminderForm, to: e.target.value})}
                        className="text-orange-600"
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
                        checked={paymentReminderForm.customEmail !== ''}
                        onChange={(e) => setPaymentReminderForm({...paymentReminderForm, to: '', customEmail: 'custom'})}
                        className="text-orange-600"
                      />
                      <span className="text-sm font-medium">Other email address:</span>
                    </label>
                  </div>
                  {/* Custom email input */}
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={paymentReminderForm.customEmail === 'custom' ? '' : paymentReminderForm.customEmail}
                    onChange={(e) => setPaymentReminderForm({...paymentReminderForm, to: '', customEmail: e.target.value})}
                    disabled={paymentReminderForm.to !== '' && paymentReminderForm.customEmail === ''}
                    className="border-orange-200 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentReminderSubject" className="text-sm font-medium text-gray-700">
                  Subject: *
                </Label>
                <Input
                  id="paymentReminderSubject"
                  value={paymentReminderForm.subject}
                  onChange={(e) => setPaymentReminderForm({...paymentReminderForm, subject: sanitizeReminderText(e.target.value)})}
                  placeholder="Payment reminder subject"
                  className="mt-1 border-orange-200 focus:border-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="paymentReminderBody" className="text-sm font-medium text-gray-700">
                  Message: *
                </Label>
                <Textarea
                  id="paymentReminderBody"
                  value={paymentReminderForm.body}
                  onChange={(e) => setPaymentReminderForm({...paymentReminderForm, body: sanitizeReminderText(e.target.value)})}
                  placeholder="Payment reminder message"
                  rows={6}
                  className="mt-1 border-orange-200 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Payment Reminder Preview */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h5 className="font-medium text-orange-900 mb-2">Payment Reminder Preview</h5>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">To:</span> {
                  paymentReminderForm.to === 'both'
                    ? `${editCoupleInfo.brideEmail}, ${editCoupleInfo.groomEmail}`
                    : paymentReminderForm.to || paymentReminderForm.customEmail || 'No recipient selected'
                }</p>
                <p><span className="font-medium">Subject:</span> {sanitizeReminderText(paymentReminderForm.subject) || 'No subject'}</p>
                <p><span className="font-medium">Payment Details:</span> {paymentInfo.totalAmount} total, {paymentInfo.depositPaid} paid, {paymentInfo.balance} due</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSendPaymentReminderDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPaymentReminderEmail}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={
                isSendingMessage ||
                (!paymentReminderForm.to && !paymentReminderForm.customEmail) ||
                !paymentReminderForm.subject.trim() ||
                !paymentReminderForm.body.trim()
              }
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {isSendingMessage ? "Sending..." : "Send Payment Reminder"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
