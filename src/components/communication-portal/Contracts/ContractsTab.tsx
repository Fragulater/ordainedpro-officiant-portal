"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Send, FileSignature, Eye, Upload, Trash2 } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function ContractsTab() {
  const {
    setShowContractUploadDialog,
    contracts,
    handleContractAction,
  } = useCommunicationPortal()

  const isEditablePendingContract = (status?: string) => {
    const normalizedStatus = String(status || "draft").toLowerCase()
    return ["draft", "pending"].includes(normalizedStatus)
  }

  const isOrdainedProDefaultContract = (contract: any) => {
    const fileUrl = contract?.fileUrl || contract?.file_url || contract?.file?.url || ""
    return (
      contract?.name === "OrdainedPro Default Wedding Contract" ||
      String(fileUrl).includes("/contracts/ordainedpro-default-contract")
    )
  }

  const getContractStatusLabel = (status?: string) => {
    const normalizedStatus = String(status || "draft").toLowerCase()
    if (normalizedStatus === "signed") return "Signed"
    if (normalizedStatus === "sent") return "Sent"
    if (normalizedStatus === "pending") return "Pending"
    return "Draft"
  }

  return (
<TabsContent value="contracts">
            <div>
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-blue-900">Contract Management</CardTitle>
                        <CardDescription>Create, send, and track contracts with your couples</CardDescription>
                      </div>
                      <Button
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() => setShowContractUploadDialog(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Contracts
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {contracts.map((contract) => (
                        <div key={contract.id} className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                contract.status === 'signed' ? 'bg-green-100' :
                                contract.status === 'sent' ? 'bg-yellow-100' : 'bg-gray-100'
                              }`}>
                                <FileSignature className={`w-6 h-6 ${
                                  contract.status === 'signed' ? 'text-green-600' :
                                  contract.status === 'sent' ? 'text-yellow-600' : 'text-gray-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{contract.name}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <Badge variant={
                                    contract.status === 'signed' ? 'default' :
                                    contract.status === 'sent' ? 'secondary' : 'outline'
                                  } className={
                                    contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                                    contract.status === 'sent' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }>
                                    {getContractStatusLabel(contract.status)}
                                  </Badge>
                                  <p className="text-sm text-gray-500">
                                    {contract.status === 'signed' && `Signed by ${contract.signedBy} on ${contract.signedDate}`}
                                    {['pending', 'sent'].includes(contract.status) && `Sent on ${contract.sentDate}`}
                                    {contract.status === 'draft' && `Created on ${contract.createdDate}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                onClick={() => handleContractAction(contract.id, 'view')}
                                title="View contract"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => handleContractAction(contract.id, 'delete')}
                                title="Delete contract"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                              {isEditablePendingContract(contract.status) && !isOrdainedProDefaultContract(contract) ? (
                                <Button
                                  size="sm"
                                  className="bg-purple-500 hover:bg-purple-600"
                                  onClick={() => handleContractAction(contract.id, 'edit')}
                                  title="Edit this draft contract"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => handleContractAction(contract.id, 'send')}
                                  title="Send contract via messaging"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Send
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
            </div>
          </TabsContent>
  )
}
