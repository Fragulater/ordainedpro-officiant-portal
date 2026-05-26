"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Send, Plus, Heart, CreditCard, Receipt, Trash2, Save } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalGenerateInvoiceDialog() {
  const {
    showGenerateInvoiceDialog,
    setShowGenerateInvoiceDialog,
    invoiceForm,
    setInvoiceForm,
    editCoupleInfo,
    savedInvoiceServices,
    isSendingInvoice,
    handleSaveInvoiceService,
    handleDeleteInvoiceService,
    handleQuickAddInvoiceService,
    handleGenerateAndSendInvoice,
  } = useCommunicationPortal()

  // Don't render if editCoupleInfo is not available
  if (!editCoupleInfo?.brideName) {
    return null
  }

  return (
    <>
      {/* Generate Invoice Dialog */}
      <Dialog open={showGenerateInvoiceDialog} onOpenChange={setShowGenerateInvoiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-900 flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Generate Ceremony Invoice
            </DialogTitle>
            <DialogDescription>
              Create a professional invoice for ceremony services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Ceremony & Invoice Header Information */}
            <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-4 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-pink-900 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Ceremony Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coupleName" className="text-sm font-medium text-gray-700">
                    Client / Honoree Names
                  </Label>
                  <Input
                    id="coupleName"
                    value={invoiceForm.coupleName}
                    onChange={(e) => setInvoiceForm({...invoiceForm, coupleName: e.target.value})}
                    placeholder="e.g., Sarah & David"
                    className="mt-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
                <div>
                  <Label htmlFor="weddingDate" className="text-sm font-medium text-gray-700">
                    Ceremony Date
                  </Label>
                  <Input
                    id="weddingDate"
                    type="date"
                    value={invoiceForm.weddingDate}
                    onChange={(e) => setInvoiceForm({...invoiceForm, weddingDate: e.target.value})}
                    className="mt-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="venue" className="text-sm font-medium text-gray-700">
                    Ceremony Venue
                  </Label>
                  <Input
                    id="venue"
                    value={invoiceForm.venue}
                    onChange={(e) => setInvoiceForm({...invoiceForm, venue: e.target.value})}
                    placeholder="e.g., Sunset Gardens"
                    className="mt-1 border-pink-200 focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="invoiceNumber" className="text-sm font-medium text-gray-700">
                  Invoice Number *
                </Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({...invoiceForm, invoiceNumber: e.target.value})}
                  placeholder="e.g., WED-2024-001"
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="invoiceDate" className="text-sm font-medium text-gray-700">
                  Invoice Date *
                </Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceForm.invoiceDate}
                  onChange={(e) => setInvoiceForm({...invoiceForm, invoiceDate: e.target.value})}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                  Due Date *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
              </div>
            </div>

            {/* Email Recipients */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Send Invoice To
              </Label>
              <Select
                value={invoiceForm.emailRecipients}
                onValueChange={(value) => setInvoiceForm({...invoiceForm, emailRecipients: value})}
              >
                <SelectTrigger className="border-green-200 focus:border-green-500">
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both Contacts ({editCoupleInfo.brideEmail}, {editCoupleInfo.groomEmail})</SelectItem>
                  <SelectItem value="bride">Primary Contact ({editCoupleInfo.brideEmail})</SelectItem>
                  <SelectItem value="groom">Secondary Contact ({editCoupleInfo.groomEmail})</SelectItem>
                  <SelectItem value="custom">Custom Email Address</SelectItem>
                </SelectContent>
              </Select>
              {invoiceForm.emailRecipients === 'custom' && (
                <Input
                  placeholder="Enter custom email address"
                  className="mt-2 border-green-200 focus:border-green-500"
                  onChange={(e) => setInvoiceForm({...invoiceForm, emailRecipients: e.target.value})}
                />
              )}
            </div>

            {/* Line Items */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Ceremony Services & Items
              </Label>
              <div className="space-y-4">
                {invoiceForm.items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-green-100 rounded-lg bg-green-50">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-3">
                        <Label className="text-xs text-gray-600">Service/Item *</Label>
                        <Input
                          value={item.service}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index ? { ...i, service: e.target.value } : i
                            )
                            setInvoiceForm({...invoiceForm, items: newItems})
                          }}
                          placeholder="e.g., Ceremony Officiant"
                          className="border-green-200"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-600">Category</Label>
                        <Select
                          value={item.category || ''}
                          onValueChange={(value) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index ? { ...i, category: value } : i
                            )
                            setInvoiceForm({...invoiceForm, items: newItems})
                          }}
                        >
                          <SelectTrigger className="border-green-200">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ceremony Services">Ceremony Services</SelectItem>
                            <SelectItem value="Consultation">Consultation</SelectItem>
                            <SelectItem value="Rehearsal">Rehearsal</SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                            <SelectItem value="Documentation">Documentation</SelectItem>
                            <SelectItem value="Additional Services">Additional Services</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-xs text-gray-600">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index ? { ...i, description: e.target.value } : i
                            )
                            setInvoiceForm({...invoiceForm, items: newItems})
                          }}
                          placeholder="Detailed description of service"
                          className="border-green-200"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="text-xs text-gray-600">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index ? { ...i, quantity: parseInt(e.target.value) || 1 } : i
                            )
                            setInvoiceForm({...invoiceForm, items: newItems})
                          }}
                          className="border-green-200"
                          min="1"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Label className="text-xs text-gray-600">Rate ($)</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => {
                            const newItems = invoiceForm.items.map((i, idx) =>
                              idx === index ? { ...i, rate: parseFloat(e.target.value) || 0 } : i
                            )
                            setInvoiceForm({...invoiceForm, items: newItems})
                          }}
                          className="border-green-200"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <div className="flex gap-2 md:flex-col">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveInvoiceService(item)}
                            className="text-green-700 hover:text-green-900"
                            title="Save service for future invoices"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (invoiceForm.items.length > 1) {
                                const newItems = invoiceForm.items.filter((_, idx) => idx !== index)
                                setInvoiceForm({...invoiceForm, items: newItems})
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            disabled={invoiceForm.items.length === 1}
                            title="Remove from this invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Amount: ${(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const newItem = {
                      id: Date.now(),
                      service: '',
                      description: '',
                      category: 'Ceremony Services',
                      quantity: 1,
                      rate: 0,
                      amount: 0
                    }
                    setInvoiceForm({...invoiceForm, items: [...invoiceForm.items, newItem]})
                  }}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service Item
                </Button>

                <Select onValueChange={handleQuickAddInvoiceService}>
                  <SelectTrigger className="w-[200px] border-green-200">
                    <SelectValue placeholder="Saved Services" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedInvoiceServices.length === 0 ? (
                      <SelectItem value="none">No saved services yet</SelectItem>
                    ) : (
                      savedInvoiceServices.map((service: any) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          + {service.service} (${Number(service.rate || 0).toFixed(2)})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {savedInvoiceServices.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {savedInvoiceServices.map((service: any) => (
                    <div key={service.id} className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-1 text-sm">
                      <span>{service.service}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteInvoiceService(service.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete saved service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="paymentMethods" className="text-sm font-medium text-gray-700">
                    Payment Methods Accepted
                  </Label>
                  <Textarea
                    id="paymentMethods"
                    value={invoiceForm.paymentMethods}
                    onChange={(e) => setInvoiceForm({...invoiceForm, paymentMethods: e.target.value})}
                    placeholder="e.g., Check, Cash, Venmo, PayPal, Zelle"
                    rows={3}
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="taxRate" className="text-sm font-medium text-gray-700">
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={invoiceForm.taxRate}
                      onChange={(e) => setInvoiceForm({...invoiceForm, taxRate: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.01"
                      className="mt-1 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="depositPaid" className="text-sm font-medium text-gray-700">
                      Deposit Previously Paid ($)
                    </Label>
                    <Input
                      id="depositPaid"
                      type="number"
                      value={invoiceForm.depositPaid}
                      onChange={(e) => setInvoiceForm({...invoiceForm, depositPaid: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="mt-1 border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="bankDetails" className="text-sm font-medium text-gray-700">
                  Banking/Transfer Information (Optional)
                </Label>
                <Textarea
                  id="bankDetails"
                  value={invoiceForm.bankDetails}
                  onChange={(e) => setInvoiceForm({...invoiceForm, bankDetails: e.target.value})}
                  placeholder="e.g., Bank transfers available upon request, ACH details provided separately"
                  rows={2}
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Terms and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="terms" className="text-sm font-medium text-gray-700">
                  Terms & Conditions
                </Label>
                <Textarea
                  id="terms"
                  value={invoiceForm.terms}
                  onChange={(e) => setInvoiceForm({...invoiceForm, terms: e.target.value})}
                  placeholder="Ceremony payment terms"
                  rows={4}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
                <div className="mt-2 text-xs text-gray-500">
                  <details className="cursor-pointer">
                    <summary className="font-medium">Suggested Terms</summary>
                    <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                      • Final payment must be received at least 7 days before ceremony
                      <br />• Cancellation policy: 50% refund if cancelled 30+ days prior
                      <br />• Weather contingency plans included
                      <br />• Late payments may incur additional fees
                    </div>
                  </details>
                </div>
              </div>
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Personal Message & Notes
                </Label>
                <Textarea
                  id="notes"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                  placeholder="Personal message or special instructions"
                  rows={4}
                  className="mt-1 border-green-200 focus:border-green-500"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Add a personal touch - congratulations, excitement for their day, etc.
                </div>
              </div>
            </div>

            {/* Invoice Preview/Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                <Receipt className="w-4 h-4 mr-2" />
                Invoice Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Details */}
                <div className="space-y-3">
                  {invoiceForm.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{item.service || `Item ${index + 1}`}</span>
                      <span className="font-mono">${(item.quantity * item.rate).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-mono">${invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0).toFixed(2)}</span>
                    </div>
                    {invoiceForm.taxRate > 0 && (
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="font-medium">Tax ({invoiceForm.taxRate}%):</span>
                        <span className="font-mono">${(invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) * (invoiceForm.taxRate / 100)).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Total Invoice:</span>
                      <span className="font-mono font-semibold">${(invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) * (1 + invoiceForm.taxRate / 100)).toFixed(2)}</span>
                    </div>
                    {invoiceForm.depositPaid > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="font-medium">Deposit Paid:</span>
                          <span className="font-mono">-${invoiceForm.depositPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-blue-200">
                          <span>Balance Due:</span>
                          <span className="font-mono">${Math.max(0, (invoiceForm.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) * (1 + invoiceForm.taxRate / 100)) - invoiceForm.depositPaid).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Status Indicator */}
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Status:</span>
                  {invoiceForm.depositPaid > 0 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Partial Payment Received
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      Payment Pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowGenerateInvoiceDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateAndSendInvoice}
              className="bg-green-500 hover:bg-green-600"
              disabled={isSendingInvoice || !invoiceForm.invoiceNumber || !invoiceForm.invoiceDate || !invoiceForm.dueDate}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSendingInvoice ? "Sending..." : "Generate & Send Invoice"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
