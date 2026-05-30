"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Download } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

const money = (amount: any) => `$${Number(amount || 0).toFixed(2).replace(/\.00$/, "")}`

const formatDate = (value?: string) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const isInvoiceRecord = (payment: any) => {
  const type = String(payment.paymentType || payment.type || payment.method || "").toLowerCase()
  return type.includes("invoice") || /^wed-|^inv-|^invoice/i.test(String(payment.invoiceNumber || payment.type || ""))
}

const getInvoiceDisplayName = (invoice: any) => {
  const invoiceNumber = String(invoice.invoiceNumber || "").trim()
  const invoiceType = String(invoice.type || "").trim()

  if (invoiceNumber && invoiceNumber.toLowerCase() !== "invoice") {
    return /^\d+$/.test(invoiceNumber) ? `Invoice #${invoiceNumber}` : invoiceNumber
  }
  if (invoiceType && invoiceType.toLowerCase() !== "invoice" && !/^\d+$/.test(invoiceType)) return invoiceType
  return `Invoice #${invoice.id}`
}

export function PortalViewInvoiceDialog() {
  const {
    editCoupleInfo,
    editWeddingDetails,
    paymentInfo,
    paymentHistory,
    showInvoiceDialog,
    setShowInvoiceDialog,
  } = useCommunicationPortal()

  const invoiceRecords = useMemo(() => (
    paymentHistory
      .filter((payment: any) => String(payment.status || "").toLowerCase() !== "refunded")
      .filter(isInvoiceRecord)
      .slice()
      .sort((a: any, b: any) => (
        new Date(b.createdAt || b.dueDate || b.date || 0).getTime() -
        new Date(a.createdAt || a.dueDate || a.date || 0).getTime()
      ))
  ), [paymentHistory])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")

  useEffect(() => {
    if (!showInvoiceDialog) return

    if (invoiceRecords.length === 0) {
      setSelectedInvoiceId("")
      return
    }

    setSelectedInvoiceId((current) => {
      if (current && invoiceRecords.some((invoice: any) => String(invoice.id) === current)) {
        return current
      }
      return String(invoiceRecords[0].id)
    })
  }, [invoiceRecords, showInvoiceDialog])

  if (!editCoupleInfo?.brideName) {
    return null
  }

  const selectedInvoice = invoiceRecords.find((invoice: any) => String(invoice.id) === selectedInvoiceId)
  const invoiceAmount = Number(selectedInvoice?.amount ?? paymentInfo.totalAmount ?? 0)
  const paidToDate = Number(paymentInfo.depositPaid || 0)
  const invoiceBalance = selectedInvoice
    ? selectedInvoice.status === "paid" ? 0 : Math.max(0, invoiceAmount - paidToDate)
    : Number(paymentInfo.balance || 0)
  const invoiceDate = selectedInvoice?.createdAt || selectedInvoice?.date
  const dueDate = selectedInvoice?.dueDate || paymentInfo.finalPaymentDue
  const invoiceNumber = selectedInvoice ? getInvoiceDisplayName(selectedInvoice) : "Current invoice"
  const selectedInvoiceLabel = selectedInvoice
    ? `${getInvoiceDisplayName(selectedInvoice)} - ${money(selectedInvoice.amount)} - ${formatDate(selectedInvoice.createdAt || selectedInvoice.date || selectedInvoice.dueDate)}`
    : "Choose an invoice"
  const paidPayments = paymentHistory.filter((payment: any) => (
    payment.status === "completed" || payment.status === "paid"
  ))

  return (
    <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ceremony Invoice</DialogTitle>
          <DialogDescription>
            Invoice for {editCoupleInfo.brideName || "Primary Contact"} & {editCoupleInfo.groomName || "Participant"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {invoiceRecords.length > 1 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-950">Additional Invoices</p>
              <p className="mb-3 text-xs text-blue-700">
                This profile has {invoiceRecords.length} invoices. Choose which one to view.
              </p>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="bg-white border-blue-200">
                  <span className="truncate">{selectedInvoiceLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  {invoiceRecords.map((invoice: any) => (
                    <SelectItem key={invoice.id} value={String(invoice.id)}>
                      {getInvoiceDisplayName(invoice)} - {money(invoice.amount)} - {formatDate(invoice.createdAt || invoice.date || invoice.dueDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {invoiceRecords.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              No saved invoice records were found for this profile yet. Showing the current payment summary.
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-blue-900">OrdainedPro Services</h3>
                <p className="text-sm text-blue-700">{invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(invoiceDate) || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Bill To:</p>
                <p className="font-semibold text-gray-900">{editCoupleInfo.brideName || "Primary Contact"} & {editCoupleInfo.groomName || "Participant"}</p>
                <p className="text-sm text-gray-600">{editCoupleInfo.brideEmail || ""}</p>
                <p className="text-sm text-gray-600">{editCoupleInfo.bridePhone || ""}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Ceremony Date:</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(editWeddingDetails.weddingDate) || "Date TBD"}
                </p>
                <p className="text-sm text-gray-600">{editWeddingDetails.venueName}</p>
              </div>
            </div>
          </div>

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
                    {money(invoiceAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-900">{money(invoiceAmount)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-gray-900 text-lg">{money(invoiceAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Paid to Date:</span>
                <span className="font-semibold text-green-700">{money(paidToDate)}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-3">
                <span className={`font-bold ${invoiceBalance === 0 ? "text-green-600" : "text-orange-600"}`}>
                  {invoiceBalance === 0 ? "PAID IN FULL" : "Balance Due:"}
                </span>
                <span className={`font-bold text-xl ${invoiceBalance === 0 ? "text-green-700" : "text-orange-700"}`}>
                  {money(invoiceBalance)}
                </span>
              </div>
              {invoiceBalance > 0 && (
                <div className="flex justify-between text-sm bg-orange-50 p-3 rounded-lg border border-orange-200 mt-3">
                  <span className="text-orange-800">Payment Due Date:</span>
                  <span className="font-semibold text-orange-900">{formatDate(dueDate) || dueDate}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Payment History</h4>
            <div className="space-y-2">
              {paidPayments.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.type}</p>
                    <p className="text-xs text-gray-600">{payment.date} - {payment.method}</p>
                  </div>
                  <p className="font-bold text-green-700">{money(payment.amount)}</p>
                </div>
              ))}
              {paidPayments.length === 0 && (
                <p className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-500">
                  No payments recorded for this profile yet.
                </p>
              )}
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
  )
}
