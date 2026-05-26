"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar as CalendarIcon, Plus, Clock, MapPin, Edit, Bell, Trash2, Ban } from "lucide-react"
import { Meeting } from "@/components/ScheduleMeetingDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function MeetingsTab() {
  const {
    setShowScheduleMeetingDialog,
    setShowAddEventDialog,
    meetings,
    upcomingEvents,
    formatEventDate,
    handleDeleteWeddingEvent,
    handleDeleteMeeting,
    handleCancelMeeting,
    handleEditMeeting,
    getMeetingStatusColor,
    getMeetingStatusIcon,
    getMeetingTypeIcon,
  } = useCommunicationPortal()

  const sortedMeetings = [...meetings].sort((a, b) => {
    const aTime = new Date(`${a.date}T${a.time || "00:00"}`).getTime()
    const bTime = new Date(`${b.date}T${b.time || "00:00"}`).getTime()
    return aTime - bTime
  })

  const formatResponseDeadline = (deadline?: string) => {
    if (!deadline) return null
    const date = new Date(`${deadline}T00:00:00`)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString()
  }

  return (
<TabsContent value="calendar">
            <div className="space-y-6">
              {/* Top Section: Meetings, Tasks, and Events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50">
                    <CardTitle className="text-blue-900">Scheduled Meetings</CardTitle>
                    <CardDescription>Meetings with calendar invite status tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {sortedMeetings.map((meeting) => {
                        const meetingStart = new Date(`${meeting.date}T${meeting.time || "00:00"}`)
                        const displayStatus = ["canceled", "declined", "completed"].includes(meeting.status)
                          ? meeting.status
                          : meetingStart.getTime() < Date.now()
                            ? "completed"
                            : meeting.status

                        return (
                        <div key={meeting.id} className={`border rounded-xl p-4 bg-gradient-to-r ${
                          displayStatus === "canceled" || displayStatus === "declined"
                            ? "from-red-50 to-rose-50 border-red-100"
                            : displayStatus === "completed"
                              ? "from-gray-50 to-slate-50 border-gray-200"
                              : "from-sky-50 to-blue-50 border-blue-100"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{meeting.subject}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge className={getMeetingStatusColor(displayStatus)}>
                                {getMeetingStatusIcon(displayStatus)}
                              </Badge>
                              <Badge variant="outline" className="border-blue-200 text-blue-700">
                                {new Date(meeting.date).toLocaleDateString()}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMeeting(meeting)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1"
                                title="Edit meeting"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {!["canceled", "completed"].includes(displayStatus) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelMeeting(meeting.id)}
                                  className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1"
                                  title="Cancel meeting"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMeeting(meeting.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                                title="Delete meeting"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-blue-500" />
                              {meeting.time} ({meeting.duration} minutes)
                            </div>
                            <div className="flex items-center">
                              <span className="text-lg mr-1">{getMeetingTypeIcon(meeting.meetingType)}</span>
                              {meeting.meetingType === 'in-person' ? meeting.location : meeting.meetingType.charAt(0).toUpperCase() + meeting.meetingType.slice(1)}
                            </div>
                            {meeting.status === 'pending' && formatResponseDeadline(meeting.responseDeadline) && (
                              <div className="flex items-center text-orange-600">
                                <Bell className="w-4 h-4 mr-2" />
                                Response due: {formatResponseDeadline(meeting.responseDeadline)}
                              </div>
                            )}
                          </div>
                          {meeting.body && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{meeting.body}</p>
                          )}
                        </div>
                      )})}
                      {meetings.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No meetings scheduled yet</p>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full mt-6 bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowScheduleMeetingDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule New Meeting
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-100 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="text-purple-900">Events Schedule</CardTitle>
                    <CardDescription>Rehearsal, ceremony, and service schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="border border-purple-100 rounded-xl p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="border-purple-200 text-purple-700">
                                {formatEventDate(event.date)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteWeddingEvent(event.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                                title="Delete event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-purple-500" />
                              {event.time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                              {event.location}
                            </div>
                          </div>
                          {event.details && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <div className="text-sm">
                                <p className="font-medium text-purple-900 mb-2 flex items-center">
                                  <FileText className="w-4 h-4 mr-1" />
                                  Additional Details:
                                </p>
                                <p className="text-gray-700 bg-white/50 p-3 rounded border border-purple-100 leading-relaxed">
                                  {event.details}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-6 bg-purple-500 hover:bg-purple-600"
                      onClick={() => setShowAddEventDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </CardContent>
                </Card>
              </div>





            </div>
          </TabsContent>
  )
}
