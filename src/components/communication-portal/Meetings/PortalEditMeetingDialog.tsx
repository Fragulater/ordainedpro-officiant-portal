"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarIcon, Clock, MapPin, Phone, Edit, Save } from "lucide-react"
import { Meeting } from "@/components/ScheduleMeetingDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalEditMeetingDialog() {
  const {
    showEditMeetingDialog,
    setShowEditMeetingDialog,
    editMeetingForm,
    setEditMeetingForm,
    handleUpdateMeeting,
    getMeetingTypeIcon,
  } = useCommunicationPortal()

  return (
    <>
      {/* Edit Meeting Dialog */}
      <Dialog open={showEditMeetingDialog} onOpenChange={setShowEditMeetingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Edit Meeting
            </DialogTitle>
            <DialogDescription>
              Update meeting details, time, and preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="editMeetingSubject" className="text-sm font-medium text-gray-700">
                Meeting Subject *
              </Label>
              <Input
                id="editMeetingSubject"
                value={editMeetingForm.subject}
                onChange={(e) => setEditMeetingForm({...editMeetingForm, subject: e.target.value})}
                placeholder="e.g., Pre-wedding Consultation, Ceremony Planning"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMeetingDate" className="text-sm font-medium text-gray-700">
                  Date *
                </Label>
                <Input
                  id="editMeetingDate"
                  type="date"
                  value={editMeetingForm.date}
                  onChange={(e) => setEditMeetingForm({...editMeetingForm, date: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMeetingTime" className="text-sm font-medium text-gray-700">
                  Time *
                </Label>
                <Input
                  id="editMeetingTime"
                  type="time"
                  value={editMeetingForm.time}
                  onChange={(e) => setEditMeetingForm({...editMeetingForm, time: e.target.value})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMeetingDuration" className="text-sm font-medium text-gray-700">
                  Duration (minutes)
                </Label>
                <Input
                  id="editMeetingDuration"
                  type="number"
                  min="15"
                  max="240"
                  value={editMeetingForm.duration}
                  onChange={(e) => setEditMeetingForm({...editMeetingForm, duration: parseInt(e.target.value)})}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editMeetingResponseDeadline" className="text-sm font-medium text-gray-700">
                Response Due Date
              </Label>
              <Input
                id="editMeetingResponseDeadline"
                type="date"
                value={editMeetingForm.responseDeadline || ''}
                onChange={(e) => setEditMeetingForm({...editMeetingForm, responseDeadline: e.target.value})}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Meeting Type and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMeetingType" className="text-sm font-medium text-gray-700">
                  Meeting Type
                </Label>
                <Select value={editMeetingForm.meetingType} onValueChange={(value) => setEditMeetingForm({...editMeetingForm, meetingType: value})}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-Person</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMeetingLocation" className="text-sm font-medium text-gray-700">
                  Location {editMeetingForm.meetingType === 'in-person' && '*'}
                </Label>
                <Input
                  id="editMeetingLocation"
                  value={editMeetingForm.location}
                  onChange={(e) => setEditMeetingForm({...editMeetingForm, location: e.target.value})}
                  placeholder={
                    editMeetingForm.meetingType === 'in-person'
                      ? "e.g., Pastor Office, Coffee Shop"
                    : editMeetingForm.meetingType === 'video'
                      ? "e.g., Zoom, Google Meet"
                      : "e.g., Phone number"
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Meeting Details */}
            <div className="space-y-2">
              <Label htmlFor="editMeetingBody" className="text-sm font-medium text-gray-700">
                Meeting Details
              </Label>
              <Textarea
                id="editMeetingBody"
                value={editMeetingForm.body}
                onChange={(e) => setEditMeetingForm({...editMeetingForm, body: e.target.value})}
                placeholder="Add agenda items, topics to discuss, or any special instructions..."
                className="min-h-[100px] border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Preview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Meeting Preview</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{editMeetingForm.subject || 'Meeting Subject'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-gray-600">{editMeetingForm.date || 'Date not set'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-gray-600">{editMeetingForm.time || 'Time not set'} ({editMeetingForm.duration} min)</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-lg mr-1">{getMeetingTypeIcon(editMeetingForm.meetingType)}</span>
                    <span className="text-gray-600">{editMeetingForm.meetingType.charAt(0).toUpperCase() + editMeetingForm.meetingType.slice(1).replace('-', ' ')}</span>
                  </div>
                  {editMeetingForm.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-blue-500" />
                      <span className="text-gray-600">{editMeetingForm.location}</span>
                    </div>
                  )}
                </div>
                {editMeetingForm.body && (
                  <div className="mt-2">
                    <p className="text-gray-600 text-xs">{editMeetingForm.body}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditMeetingDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMeeting}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!editMeetingForm.subject || !editMeetingForm.date || !editMeetingForm.time}
            >
              <Save className="w-4 h-4 mr-2" />
              Update Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
