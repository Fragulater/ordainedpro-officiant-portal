"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, DollarSign } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalRecordPaymentDialog() {
  const {
    editCoupleInfo,
    handleRecordPayment,
    paymentInfo,
    showRecordPaymentDialog,
    setShowRecordPaymentDialog,
    newPayment,
    setNewPayment,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Record Payment Dialog */}
      <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for {editCoupleInfo.brideName || 'Bride'} & {editCoupleInfo.groomName || 'Groom'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Balance */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-800">Current Balance Due:</span>
                <span className="text-2xl font-bold text-orange-900">${paymentInfo.balance}</span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentKind">Entry Type *</Label>
                <select
                  id="paymentKind"
                  value={newPayment.kind || "payment"}
                  onChange={(e) => setNewPayment({...newPayment, kind: e.target.value})}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="payment">Payment Received</option>
                  <option value="refund">Refund Issued</option>
                </select>
              </div>

              <div>
                <Label htmlFor="paymentAmount">{newPayment.kind === "refund" ? "Refund Amount" : "Payment Amount"} *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={newPayment.kind === "refund" ? undefined : paymentInfo.balance}
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                {newPayment.kind !== "refund" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ${paymentInfo.balance}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <select
                  id="paymentMethod"
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Original payment method">Original payment method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Venmo">Venmo</option>
                  <option value="Zelle">Zelle</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                <Textarea
                  id="paymentNotes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preview */}
            {newPayment.amount && parseFloat(newPayment.amount) > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">{newPayment.kind === "refund" ? "Refund Preview" : "Payment Preview"}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-800">{newPayment.kind === "refund" ? "Refund Amount:" : "Payment Amount:"}</span>
                    <span className="font-bold text-green-900">${parseFloat(newPayment.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-800">New Balance:</span>
                    <span className="font-bold text-green-900">
                      ${newPayment.kind === "refund"
                        ? (paymentInfo.balance + parseFloat(newPayment.amount)).toFixed(2)
                        : (paymentInfo.balance - parseFloat(newPayment.amount)).toFixed(2)}
                    </span>
                  </div>
                  {newPayment.kind !== "refund" && (paymentInfo.balance - parseFloat(newPayment.amount)) === 0 && (
                    <div className="mt-3 p-2 bg-green-100 rounded-lg border border-green-300">
                      <p className="text-center font-bold text-green-800">
                        🎉 This payment will mark the invoice as PAID IN FULL!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowRecordPaymentDialog(false)
                setNewPayment({
                  amount: "",
                  date: new Date().toISOString().split('T')[0],
                  method: "Credit Card",
                  notes: "",
                  kind: "payment"
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={!newPayment.amount || parseFloat(newPayment.amount) <= 0}
              className="bg-green-500 hover:bg-green-600"
            >
              <Check className="w-4 h-4 mr-2" />
              {newPayment.kind === "refund" ? "Record Refund" : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
