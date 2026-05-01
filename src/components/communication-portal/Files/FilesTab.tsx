"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, FileText, Download, Edit, Share, Eye, X, Upload, Trash2 } from "lucide-react"
import { FileUpload } from "@/components/FileUpload"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function FilesTab() {
  const {
    generatedScripts,
    files,
    handleEditScript,
    handleViewScript,
    handleDownloadScript,
    handleDeleteScript,
    handleViewFile,
    handleFilesUploaded,
    handleFileRemoved,
    getFileIcon,
  } = useCommunicationPortal()

  return (
<TabsContent value="files">
            <div className="space-y-6">
              {/* AI Generated Scripts Section */}
              <Card className="border-green-100 shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-green-900">Mr. Script Generated Wedding Scripts</CardTitle>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {generatedScripts.length} scripts
                    </Badge>
                  </div>
                  <CardDescription className="text-green-700">
                    Custom ceremony scripts created by Mr. Script for Sarah Johnson & David Chen
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {generatedScripts.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                      <p className="text-green-700 mb-2">No Mr. Script scripts generated yet</p>
                      <p className="text-sm text-green-600">Visit the Build Script tab to create your first ceremony script with Mr. Script</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {generatedScripts.map((script) => (
                        <div key={script.id} className="border border-green-200 rounded-xl p-4 bg-white hover:bg-green-50 transition-colors group">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 mb-1">{script.title}</p>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                      {script.type} Style
                                    </Badge>
                                    <Badge variant="outline" className="text-blue-200 text-blue-700">
                                      Mr. Script
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500">Created: {script.createdDate}</p>
                                  <p className="text-xs text-gray-400 mt-1">{script.content.length} characters</p>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:bg-green-100"
                                    title="View script"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewScript(script)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-600 hover:bg-blue-100"
                                    title="Edit script"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditScript(script)
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-600 hover:bg-gray-100"
                                    title="Download"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDownloadScript(script)
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-100"
                                    title="Delete script"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteScript(script)
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Upload Section */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-900">Upload Documents</CardTitle>
                  <CardDescription>Share ceremony scripts, photos, music lists, and other important documents</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <FileUpload
                    mode="full"
                    onFilesUploaded={handleFilesUploaded}
                    onFileRemoved={handleFileRemoved}
                    maxFiles={10}
                    maxFileSize={25}
                    acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.mov', '.zip', '.ppt', '.pptx', '.xls', '.xlsx']}
                  />
                </CardContent>
              </Card>

              {/* Existing Files */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-900">Uploaded Documents</CardTitle>
                      <CardDescription>All ceremony-related files and documents ({files.length} files)</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        {files.reduce((total, file) => {
                          const sizeStr = file.size || "0 KB"
                          const sizeNum = parseFloat(sizeStr.split(' ')[0])
                          const unit = sizeStr.split(' ')[1]
                          const bytes = unit === 'MB' ? sizeNum * 1024 * 1024 :
                                       unit === 'KB' ? sizeNum * 1024 : sizeNum
                          return total + bytes
                        }, 0) / (1024 * 1024) < 1 ?
                          Math.round(files.reduce((total, file) => {
                            const sizeStr = file.size || "0 KB"
                            const sizeNum = parseFloat(sizeStr.split(' ')[0])
                            const unit = sizeStr.split(' ')[1]
                            const bytes = unit === 'MB' ? sizeNum * 1024 * 1024 :
                                         unit === 'KB' ? sizeNum * 1024 : sizeNum
                            return total + bytes
                          }, 0) / 1024) + ' KB total' :
                          Math.round(files.reduce((total, file) => {
                            const sizeStr = file.size || "0 KB"
                            const sizeNum = parseFloat(sizeStr.split(' ')[0])
                            const unit = sizeStr.split(' ')[1]
                            const bytes = unit === 'MB' ? sizeNum * 1024 * 1024 :
                                         unit === 'KB' ? sizeNum * 1024 : sizeNum
                            return total + bytes
                          }, 0) / (1024 * 1024) * 10) / 10 + ' MB total'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {files.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500">No files uploaded yet</p>
                      <p className="text-sm">Upload your first document using the section above</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center space-x-3 p-4 border border-blue-100 rounded-xl bg-white hover:bg-blue-50 transition-colors group">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                              <span className="text-2xl">{getFileIcon(file.type)}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {file.size} • {file.uploadedBy}
                            </p>
                            <p className="text-xs text-gray-400">{file.date}</p>
                          </div>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:bg-blue-100"
                              onClick={() => handleViewFile(file)}
                              title="View file"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:bg-blue-100"
                              onClick={() => window.open(file.url || '#', '_blank')}
                              title="Download file"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-100"
                              onClick={() => handleFileRemoved(file.id.toString())}
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>
          </TabsContent>
  )
}
