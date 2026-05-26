"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalViewInvoiceDialog() {
  const {
    editCoupleInfo,
    editWeddingDetails,
    paymentInfo,
    paymentHistory,
    showInvoiceDialog,
    setShowInvoiceDialog,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* View Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ceremony Invoice</DialogTitle>
            <DialogDescription>
              Invoice for {editCoupleInfo.brideName || 'Primary Contact'} & {editCoupleInfo.groomName || 'Participant'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">OrdainedPro Services</h3>
                  <p className="text-sm text-blue-700">Ceremony Officiant Services</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Bill To:</p>
                  <p className="font-semibold text-gray-900">{editCoupleInfo.brideName || 'Primary Contact'} & {editCoupleInfo.groomName || 'Participant'}</p>
                  <p className="text-sm text-gray-600">{editCoupleInfo.brideEmail || ''}</p>
                  <p className="text-sm text-gray-600">{editCoupleInfo.bridePhone || ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ceremony Date:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600">{editWeddingDetails.venueName}</p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">Ceremony Officiant Services</p>
                      <p className="text-sm text-gray-500">Professional officiant services for ceremony</p>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ${paymentInfo.totalAmount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">${paymentInfo.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-3">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-gray-900 text-lg">${paymentInfo.totalAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Paid to Date:</span>
                  <span className="font-semibold text-green-700">${paymentInfo.depositPaid}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-3">
                  <span className={`font-bold ${paymentInfo.balance === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {paymentInfo.balance === 0 ? 'PAID IN FULL' : 'Balance Due:'}
                  </span>
                  <span className={`font-bold text-xl ${paymentInfo.balance === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                    ${paymentInfo.balance}
                  </span>
                </div>
                {paymentInfo.balance > 0 && (
                  <div className="flex justify-between text-sm bg-orange-50 p-3 rounded-lg border border-orange-200 mt-3">
                    <span className="text-orange-800">Payment Due Date:</span>
                    <span className="font-semibold text-orange-900">{paymentInfo.finalPaymentDue}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
              <div className="space-y-2">
                {paymentHistory.filter(p => p.status === 'completed').map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{payment.type}</p>
                      <p className="text-xs text-gray-600">{payment.date} • {payment.method}</p>
                    </div>
                    <p className="font-bold text-green-700">${payment.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.print()
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
