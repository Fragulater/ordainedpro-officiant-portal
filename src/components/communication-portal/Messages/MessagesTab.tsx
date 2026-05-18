"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, FileText, CheckSquare, Calendar as CalendarIcon, Send, Share, X } from "lucide-react"
import { Task } from "@/components/AddTaskDialog"
import { Meeting } from "@/components/ScheduleMeetingDialog"
import { FileUpload } from "@/components/FileUpload"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function MessagesTab() {
  const {
    messages,
    newMessage,
    setNewMessage,
    setShowAddTaskDialog,
    setShowScheduleMeetingDialog,
    messageAttachments,
    editCoupleInfo,
    setShowShareScriptDialog,
    setSharingScript,
    setShareScriptForm,
    setSelectedItemsToShare,
    files,
    meetings,
    getMeetingStatusColor,
    getMeetingStatusIcon,
    getMeetingTypeIcon,
    handleMessageAttachmentsUploaded,
    handleMessageAttachmentRemoved,
    formatFileSize,
    getFileIcon,
    handleSendMessage,
  } = useCommunicationPortal()

  return (
<TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">Conversation</CardTitle>
                    <CardDescription>Stay connected with your couple throughout the planning process</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                      {messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="font-medium">No messages yet</p>
                          <p className="text-sm mt-1">Send a message to start the conversation with {editCoupleInfo?.brideName} & {editCoupleInfo?.groomName}</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className={`flex space-x-3 ${message.role === 'officiant' ? 'justify-end' : ''}`}>
                            {message.role !== 'officiant' && (
                              <Avatar className="ring-2 ring-blue-100">
                                <AvatarImage src={message.avatar} />
                                <AvatarFallback className="bg-blue-500 text-white">{message.sender?.split(' ').map((n: string) => n[0]).join('') || '?'}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`flex-1 max-w-xs lg:max-w-md ${message.role === 'officiant' ? 'order-first' : ''}`}>
                              <div className={`p-4 rounded-xl shadow-sm ${
                                message.role === 'officiant'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                                  : 'bg-white border border-gray-200 text-gray-900'
                              }`}>
                                <p className="text-sm leading-relaxed">{message.message}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-2 flex items-center">
                                <span className="font-medium">{message.sender}</span>
                                <span className="mx-1">•</span>
                                <span>{message.timestamp}</span>
                              </p>
                            </div>
                            {message.role === 'officiant' && (
                              <Avatar className="ring-2 ring-blue-100">
                                <AvatarImage src={message.avatar} />
                                <AvatarFallback className="bg-blue-500 text-white">{message.sender?.split(' ').map((n: string) => n[0]).join('') || 'WO'}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Attachments Display */}
                    {messageAttachments.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          Attachments ({messageAttachments.length})
                        </h4>
                        <div className="space-y-2">
                          {messageAttachments.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded text-sm border border-blue-100">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getFileIcon(file.type)}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{file.name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMessageAttachmentRemoved(file.id)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 border-blue-200 focus:border-blue-500"
                      />
                      <FileUpload
                        mode="compact"
                        onFilesUploaded={handleMessageAttachmentsUploaded}
                        onFileRemoved={handleMessageAttachmentRemoved}
                        maxFiles={3}
                        maxFileSize={5}
                        existingFiles={messageAttachments}
                      />
                      <Button
                        size="icon"
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() && messageAttachments.length === 0}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-blue-900">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        // Reset selections and open dialog
                        setSelectedItemsToShare({ scripts: [], files: [] })
                        setSharingScript(null)
                        const brideFirst = editCoupleInfo?.brideName?.split(' ')[0] || 'Bride'
                        const groomFirst = editCoupleInfo?.groomName?.split(' ')[0] || 'Groom'
                        setShareScriptForm({
                          to: 'both',
                          customEmail: '',
                          subject: 'Wedding Documents for Review',
                          body: `Dear ${brideFirst} and ${groomFirst},\n\nI'm sharing some documents for your review. Please take a look and let me know if you have any questions or feedback.\n\nBest regards,\nPastor Michael Adams`,
                          includeNotes: true
                        })
                        setShowShareScriptDialog(true)
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Share Script Draft
                    </Button>
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setShowScheduleMeetingDialog(true)}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </Button>
                    <Button
                      className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setShowAddTaskDialog(true)}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 text-blue-900">Next Meeting</h4>
                      <div className="space-y-2">
                        {meetings.filter(meeting => new Date(meeting.date) >= new Date()).slice(0, 1).map((meeting) => (
                          <div key={meeting.id} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-sm border border-blue-100">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-blue-900">{meeting.subject}</p>
                              <Badge className={getMeetingStatusColor(meeting.status)}>
                                {getMeetingStatusIcon(meeting.status)}
                              </Badge>
                            </div>
                            <p className="text-blue-700">{new Date(meeting.date).toLocaleDateString()} at {meeting.time}</p>
                            <p className="text-blue-600 text-xs mt-1">{getMeetingTypeIcon(meeting.meetingType)} {meeting.meetingType}</p>
                          </div>
                        ))}
                        {meetings.filter(meeting => new Date(meeting.date) >= new Date()).length === 0 && (
                          <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200 text-center">
                            <p className="text-gray-500">No upcoming meetings</p>
                            <Button
                              size="sm"
                              className="mt-2 bg-blue-500 hover:bg-blue-600"
                              onClick={() => setShowScheduleMeetingDialog(true)}
                            >
                              Schedule One
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
  )
}
