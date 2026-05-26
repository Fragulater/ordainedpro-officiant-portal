"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Edit, Save } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function PortalEditWeddingDetailsDialog() {
  const {
    showEditWeddingDialog,
    setShowEditWeddingDialog,
    editWeddingDetails,
    setEditWeddingDetails,
    handleEditWeddingDetails,
  } = useCommunicationPortal()

  return (
    <>
      {/* Edit Ceremony Details Dialog */}
      <Dialog open={showEditWeddingDialog} onOpenChange={setShowEditWeddingDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Edit Ceremony Details
            </DialogTitle>
            <DialogDescription>
              Update the ceremony details including date, time, location, and guest count
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Venue Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Venue Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editVenueName" className="text-sm font-medium text-gray-700">
                    Venue Name *
                  </Label>
                  <Input
                    id="editVenueName"
                    value={editWeddingDetails.venueName}
                    onChange={(e) => setEditWeddingDetails({...editWeddingDetails, venueName: e.target.value})}
                    placeholder="e.g., Sunset Gardens"
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="editVenueAddress" className="text-sm font-medium text-gray-700">
                    Venue Address *
                  </Label>
                  <Input
                    id="editVenueAddress"
                    value={editWeddingDetails.venueAddress}
                    onChange={(e) => setEditWeddingDetails({...editWeddingDetails, venueAddress: e.target.value})}
                    placeholder="Full venue address"
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Date & Time
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editWeddingDate" className="text-sm font-medium text-gray-700">
                    Ceremony Date *
                  </Label>
                  <Input
                    id="editWeddingDate"
                    type="date"
                    value={editWeddingDetails.weddingDate}
                    onChange={(e) => setEditWeddingDetails({...editWeddingDetails, weddingDate: e.target.value})}
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="editStartTime" className="text-sm font-medium text-gray-700">
                    Start Time *
                  </Label>
                  <Input
                    id="editStartTime"
                    type="time"
                    value={editWeddingDetails.startTime}
                    onChange={(e) => setEditWeddingDetails({...editWeddingDetails, startTime: e.target.value})}
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="editEndTime" className="text-sm font-medium text-gray-700">
                    End Time *
                  </Label>
                  <Input
                    id="editEndTime"
                    type="time"
                    value={editWeddingDetails.endTime}
                    onChange={(e) => setEditWeddingDetails({...editWeddingDetails, endTime: e.target.value})}
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Guest Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editExpectedGuests" className="text-sm font-medium text-gray-700">
                    Expected Number of Guests *
                  </Label>
                  <Input
                    id="editExpectedGuests"
                    type="number"
                    min="1"
                    max="1000"
                    value={editWeddingDetails.expectedGuests}
                    onChange={(e) => setEditWeddingDetails({...editWeddingDetails, expectedGuests: e.target.value})}
                    placeholder="e.g., 75"
                    className="mt-1 border-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Officiant Notes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Officiant Notes
              </h4>
              <div>
                <Label htmlFor="officiantNotes" className="text-sm font-medium text-gray-700">
                  Private Notes (Only visible to you)
                </Label>
                <Textarea
                  id="officiantNotes"
                  value={editWeddingDetails.officiantNotes || ""}
                  onChange={(e) => setEditWeddingDetails({...editWeddingDetails, officiantNotes: e.target.value})}
                  placeholder="Add any private notes, reminders, or special considerations for this ceremony..."
                  rows={14}
                  className="mt-1 min-h-[320px] resize-y border-blue-200 focus:border-blue-500"
                  spellCheck
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes are for your reference only and won't be shared with the clients
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Preview</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-900">{editWeddingDetails.venueName}</span>
                  <p className="text-gray-600">{editWeddingDetails.venueAddress}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <p className="text-gray-600">
                    {new Date(`2024-01-01 ${editWeddingDetails.startTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(`2024-01-01 ${editWeddingDetails.endTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                <p className="text-gray-600">Expected guests: {editWeddingDetails.expectedGuests} people</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditWeddingDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditWeddingDetails}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
