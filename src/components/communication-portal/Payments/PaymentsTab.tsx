"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Send, Plus, Check, Clock, Mail, DollarSign, AlertCircle, CreditCard, Receipt, Download, Printer, RotateCcw } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PaymentsTab() {
  const {
    handleOpenPaymentReminderDialog,
    paymentInfo,
    paymentHistory,
    financialReport,
    financialRows,
    outstandingBalanceRows,
    refundRows,
    exportFinancialCsv,
    printFinancialReport,
    setShowInvoiceDialog,
    setShowRecordPaymentDialog,
    handleOpenInvoiceDialog,
  } = useCommunicationPortal()

  return (
<TabsContent value="payments">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* Payment Overview */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CardTitle className="text-blue-900">Payment Overview</CardTitle>
                          {paymentInfo.balance === 0 && (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md">
                              <Check className="w-3 h-3 mr-1" />
                              Paid in Full
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInvoiceDialog(true)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Invoice
                          </Button>
                          {paymentInfo.balance > 0 && (
                            <Button
                              size="sm"
                              onClick={() => setShowRecordPaymentDialog(true)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>Track ceremony payments and outstanding balances</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Total Amount</p>
                              <p className="text-2xl font-bold text-green-900">${paymentInfo.totalAmount}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">Deposit Paid</p>
                              <p className="text-2xl font-bold text-blue-900">${paymentInfo.depositPaid}</p>
                            </div>
                            <CreditCard className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        <div className={`rounded-xl p-4 border ${
                          paymentInfo.balance > 0
                            ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200'
                            : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${paymentInfo.balance > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                                Balance Due
                              </p>
                              <p className={`text-2xl font-bold ${paymentInfo.balance > 0 ? 'text-orange-900' : 'text-green-900'}`}>
                                ${paymentInfo.balance}
                              </p>
                            </div>
                            {paymentInfo.balance > 0 ? (
                              <AlertCircle className="w-8 h-8 text-orange-600" />
                            ) : (
                              <Check className="w-8 h-8 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div>
                          <p className="font-semibold text-blue-900">Final Payment Due</p>
                          <p className="text-sm text-blue-700">{paymentInfo.finalPaymentDue}</p>
                        </div>
                        {paymentInfo.balance > 0 && (
                          <Button
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={handleOpenPaymentReminderDialog}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Payment Reminder
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Officiant Financial Reports */}
                  <Card className="border-emerald-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-emerald-900">Business Reports</CardTitle>
                          <CardDescription>Income, refunds, outstanding balances, and export-ready records</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={exportFinancialCsv}>
                            <Download className="w-4 h-4 mr-2" />
                            CSV
                          </Button>
                          <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" onClick={printFinancialReport}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                          <p className="text-sm font-medium text-green-800">Gross Income</p>
                          <p className="text-2xl font-bold text-green-950">${financialReport.grossIncome.toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-sm font-medium text-red-800">Refunds</p>
                          <p className="text-2xl font-bold text-red-950">${financialReport.refunds.toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-sm font-medium text-blue-800">Net Income</p>
                          <p className="text-2xl font-bold text-blue-950">${financialReport.netIncome.toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                          <p className="text-sm font-medium text-orange-800">Outstanding</p>
                          <p className="text-2xl font-bold text-orange-950">${financialReport.outstanding.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-blue-100 bg-white p-4">
                          <p className="text-sm text-gray-500">This Month</p>
                          <p className="text-xl font-semibold text-gray-900">${financialReport.monthIncome.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-white p-4">
                          <p className="text-sm text-gray-500">Year to Date</p>
                          <p className="text-xl font-semibold text-gray-900">${financialReport.yearIncome.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-white p-4">
                          <p className="text-sm text-gray-500">Payments / Refunds</p>
                          <p className="text-xl font-semibold text-gray-900">{financialReport.paymentsReceived} / {financialReport.refundsIssued}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Outstanding Balances</h4>
                        {outstandingBalanceRows.length === 0 ? (
                          <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-800">No outstanding balances recorded.</div>
                        ) : (
                          <div className="space-y-2">
                            {outstandingBalanceRows.slice(0, 5).map((row: any) => (
                              <div key={row.id} className="flex items-center justify-between rounded-lg border border-orange-100 bg-white p-3">
                                <div>
                                  <p className="font-medium text-gray-900">{row.coupleName}</p>
                                  <p className="text-xs text-gray-500">Due {row.dueDate || "No due date"} • {row.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-700">${Number(row.amount || 0).toFixed(2)}</p>
                                  <Button size="sm" variant="ghost" className="h-7 text-blue-600 hover:bg-blue-50" onClick={handleOpenPaymentReminderDialog}>
                                    <Mail className="w-3 h-3 mr-1" />
                                    Reminder
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Refunds</h4>
                        {refundRows.length === 0 ? (
                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">No refunds recorded.</div>
                        ) : (
                          <div className="space-y-2">
                            {refundRows.slice(0, 5).map((row: any) => (
                              <div key={row.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-white p-3">
                                <div className="flex items-center gap-2">
                                  <RotateCcw className="w-4 h-4 text-red-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">{row.coupleName}</p>
                                    <p className="text-xs text-gray-500">{row.dueDate || row.createdAt} • {row.description}</p>
                                  </div>
                                </div>
                                <p className="font-bold text-red-700">-${Number(row.amount || 0).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment History */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Payment History</CardTitle>
                      <CardDescription>Track all payments and transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-4 border border-blue-100 rounded-xl bg-white">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                payment.status === 'paid' ? 'bg-green-100' : payment.status === 'refunded' ? 'bg-red-100' : 'bg-orange-100'
                              }`}>
                                {payment.status === 'paid' ? (
                                  <Receipt className="w-6 h-6 text-green-600" />
                                ) : payment.status === 'refunded' ? (
                                  <RotateCcw className="w-6 h-6 text-red-600" />
                                ) : (
                                  <Clock className="w-6 h-6 text-orange-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{payment.type}</p>
                                <p className="text-sm text-gray-500">{payment.date} • {payment.method}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${payment.status === 'refunded' ? 'text-red-700' : 'text-gray-900'}`}>
                                {payment.status === 'refunded' ? '-' : ''}${payment.amount}
                              </p>
                              <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}
                                     className={payment.status === 'paid' ? 'bg-green-100 text-green-800' : payment.status === 'refunded' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                                {payment.status === 'paid' ? 'Completed' : payment.status === 'refunded' ? 'Refunded' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">Payment Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={handleOpenInvoiceDialog}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Generate Invoice
                    </Button>
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={handleOpenPaymentReminderDialog}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Payment Reminder
                    </Button>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-900">Payment Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deposit Status:</span>
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Final Payment:</span>
                          <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
  )
}
