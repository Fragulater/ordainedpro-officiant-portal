"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Users, Plus, Check, Clock, MapPin, Phone, Mail, Heart, Save, LayoutDashboard, LogOut } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"
import { supabase } from "@/supabase/utils/client"

// Helper to safely get initials from a name
const getInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '??'
  return name.split(' ').map(n => n?.[0] || '').join('') || '??'
}

export function PortalHeader() {
  const {
    showAddCeremonyDialog,
    setShowAddCeremonyDialog,
    allCouples,
    activeCoupleIndex,
    showSwitchCeremonyDialog,
    setShowSwitchCeremonyDialog,
    showArchivedCeremoniesDialog,
    setShowArchivedCeremoniesDialog,
    setShowDashboardDialog,
    newCeremony,
    setNewCeremony,
    handleAddCeremony,
    handleSwitchCouple,
    toggleCeremonyStatus,
    handleUnarchiveCouple,
    editCoupleInfo,
  } = useCommunicationPortal()

  // State for officiant menu popover
  const [officiantMenuOpen, setOfficiantMenuOpen] = useState(false)

  // Safety check - if no couples loaded, show minimal header
  const hasValidCouple = editCoupleInfo?.brideName && allCouples.length > 0

  // Logout handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OrdainedPro</h1>
              <p className="text-blue-600 font-medium">Communication Portal</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Add New Ceremony Button */}
            <Dialog open={showAddCeremonyDialog} onOpenChange={setShowAddCeremonyDialog}>
              <DialogTrigger asChild>
                <Button size="default" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Ceremony
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Wedding Ceremony</DialogTitle>
                  <DialogDescription>
                    Fill in the details for the new wedding ceremony you'll be officiating.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  {/* Ceremony Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-900">Ceremony Details</h3>

                    <div>
                      <Label htmlFor="ceremonyName">Ceremony Name</Label>
                      <Input
                        id="ceremonyName"
                        value={newCeremony.ceremonyName}
                        onChange={(e) => setNewCeremony({ ...newCeremony, ceremonyName: e.target.value })}
                        placeholder="e.g., Sarah & David's Wedding"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="ceremonyDate">Date</Label>
                        <Input
                          id="ceremonyDate"
                          type="date"
                          value={newCeremony.ceremonyDate}
                          onChange={(e) => setNewCeremony({ ...newCeremony, ceremonyDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceremonyTime">Time</Label>
                        <Input
                          id="ceremonyTime"
                          type="time"
                          value={newCeremony.ceremonyTime}
                          onChange={(e) => setNewCeremony({ ...newCeremony, ceremonyTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="venueName">Venue Name</Label>
                      <Input
                        id="venueName"
                        value={newCeremony.venueName}
                        onChange={(e) => setNewCeremony({ ...newCeremony, venueName: e.target.value })}
                        placeholder="e.g., Sunset Gardens"
                      />
                    </div>

                    <div>
                      <Label htmlFor="venueAddress">Venue Address</Label>
                      <Textarea
                        id="venueAddress"
                        value={newCeremony.venueAddress}
                        onChange={(e) => setNewCeremony({ ...newCeremony, venueAddress: e.target.value })}
                        placeholder="Full venue address"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="expectedGuests">Expected Guests</Label>
                      <Input
                        id="expectedGuests"
                        type="number"
                        value={newCeremony.expectedGuests}
                        onChange={(e) => setNewCeremony({ ...newCeremony, expectedGuests: e.target.value })}
                        placeholder="Number of guests"
                      />
                    </div>
                  </div>

                  {/* Couple Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-blue-900">Couple Information</h3>

                    {/* Bride Information */}
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <h4 className="font-medium text-pink-900 mb-3">Bride Information</h4>
                      <div className="space-y-3">
                        <Input
                          value={newCeremony.brideName}
                          onChange={(e) => setNewCeremony({ ...newCeremony, brideName: e.target.value })}
                          placeholder="Bride's full name"
                        />
                        <Input
                          type="email"
                          value={newCeremony.brideEmail}
                          onChange={(e) => setNewCeremony({ ...newCeremony, brideEmail: e.target.value })}
                          placeholder="Bride's email"
                        />
                        <Input
                          type="tel"
                          value={newCeremony.bridePhone}
                          onChange={(e) => setNewCeremony({ ...newCeremony, bridePhone: e.target.value })}
                          placeholder="Bride's phone"
                        />
                        <Input
                          value={newCeremony.brideAddress}
                          onChange={(e) => setNewCeremony({ ...newCeremony, brideAddress: e.target.value })}
                          placeholder="Bride's primary address"
                        />
                      </div>
                    </div>

                    {/* Groom Information */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Groom Information</h4>
                      <div className="space-y-3">
                        <Input
                          value={newCeremony.groomName}
                          onChange={(e) => setNewCeremony({ ...newCeremony, groomName: e.target.value })}
                          placeholder="Groom's full name"
                        />
                        <Input
                          type="email"
                          value={newCeremony.groomEmail}
                          onChange={(e) => setNewCeremony({ ...newCeremony, groomEmail: e.target.value })}
                          placeholder="Groom's email"
                        />
                        <Input
                          type="tel"
                          value={newCeremony.groomPhone}
                          onChange={(e) => setNewCeremony({ ...newCeremony, groomPhone: e.target.value })}
                          placeholder="Groom's phone"
                        />
                        <Input
                          value={newCeremony.groomAddress}
                          onChange={(e) => setNewCeremony({ ...newCeremony, groomAddress: e.target.value })}
                          placeholder="Groom's primary address"
                        />
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-3">Payment Information</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={newCeremony.totalAmount}
                            onChange={(e) => setNewCeremony({ ...newCeremony, totalAmount: e.target.value })}
                            placeholder="Total amount ($)"
                          />
                          <Input
                            type="number"
                            value={newCeremony.depositAmount}
                            onChange={(e) => setNewCeremony({ ...newCeremony, depositAmount: e.target.value })}
                            placeholder="Deposit amount ($)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="finalPaymentDate">Final Payment Due Date</Label>
                          <Input
                            id="finalPaymentDate"
                            type="date"
                            value={newCeremony.finalPaymentDate}
                            onChange={(e) => setNewCeremony({ ...newCeremony, finalPaymentDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={newCeremony.notes}
                        onChange={(e) => setNewCeremony({ ...newCeremony, notes: e.target.value })}
                        placeholder="Special requests, preferences, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddCeremonyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCeremony} className="bg-blue-500 hover:bg-blue-600">
                    <Save className="w-4 h-4 mr-2" />
                    Create Ceremony
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Switch Ceremony Dialog */}
            <Dialog open={showSwitchCeremonyDialog} onOpenChange={setShowSwitchCeremonyDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Switch Between Ceremonies</DialogTitle>
                  <DialogDescription>
                    Select a couple to view and manage their ceremony details. Only active ceremonies are shown.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  {allCouples.filter(couple => couple.isActive).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No active ceremonies found.</p>
                      <p className="text-sm mt-2">Click "Add New Ceremony" to create one, or check the Archived section.</p>
                    </div>
                  ) : (
                    allCouples
                      .filter(couple => couple.isActive)
                      .map((couple, index) => {
                        const actualIndex = allCouples.findIndex(c => c.id === couple.id)
                        return (
                          <Card
                            key={couple.id}
                            className={`cursor-pointer transition-all hover:shadow-lg ${
                              actualIndex === activeCoupleIndex
                                ? 'border-blue-500 border-2 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => handleSwitchCouple(actualIndex)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {/* Couple Names */}
                                  <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                      {couple?.brideName || 'Partner 1'} & {couple?.groomName || 'Partner 2'}
                                    </h3>
                                    {actualIndex === activeCoupleIndex && (
                                      <Badge className="bg-blue-500 text-white">
                                        Currently Active
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Couple Information Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Bride Info */}
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Avatar className={`ring-2 ${couple.colors?.brideRing || 'ring-pink-100'}`}>
                                          <AvatarFallback className={`${couple.colors?.bride || 'bg-pink-500'} text-white`}>
                                            {getInitials(couple?.brideName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-gray-900">{couple?.brideName || 'Bride'}</p>
                                          <p className={`text-xs ${couple.colors?.brideText || 'text-pink-600'}`}>Bride</p>
                                        </div>
                                      </div>
                                      <div className="ml-12 text-sm space-y-1">
                                        <div className="flex items-center text-gray-600">
                                          <Mail className="w-3 h-3 mr-2" />
                                          {couple?.brideEmail || 'No email'}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                          <Phone className="w-3 h-3 mr-2" />
                                          {couple?.bridePhone || 'No phone'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Groom Info */}
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Avatar className={`ring-2 ${couple.colors?.groomRing || 'ring-blue-100'}`}>
                                          <AvatarFallback className={`${couple.colors?.groom || 'bg-blue-500'} text-white`}>
                                            {getInitials(couple?.groomName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-gray-900">{couple?.groomName || 'Groom'}</p>
                                          <p className={`text-xs ${couple.colors?.groomText || 'text-blue-600'}`}>Groom</p>
                                        </div>
                                      </div>
                                      <div className="ml-12 text-sm space-y-1">
                                        <div className="flex items-center text-gray-600">
                                          <Mail className="w-3 h-3 mr-2" />
                                          {couple?.groomEmail || 'No email'}
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                          <Phone className="w-3 h-3 mr-2" />
                                          {couple?.groomPhone || 'No phone'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Wedding Details */}
                                  {couple.weddingDetails && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="font-medium text-gray-700 flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            Venue
                                          </p>
                                          <p className="text-gray-600 ml-6">{couple.weddingDetails.venueName}</p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-700 flex items-center">
                                            <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                                            Date
                                          </p>
                                          <p className="text-gray-600 ml-6">
                                            {couple.weddingDetails.weddingDate
                                              ? new Date(couple.weddingDetails.weddingDate).toLocaleDateString('en-US', {
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric'
                                                })
                                              : 'Not set'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-700 flex items-center">
                                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                            Time
                                          </p>
                                          <p className="text-gray-600 ml-6">
                                            {couple.weddingDetails.startTime || 'Not set'}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-700 flex items-center">
                                            <Users className="w-4 h-4 mr-2 text-blue-500" />
                                            Expected Guests
                                          </p>
                                          <p className="text-gray-600 ml-6">
                                            {couple.weddingDetails.expectedGuests || 'Not set'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSwitchCeremonyDialog(false)
                      setShowArchivedCeremoniesDialog(true)
                    }}
                    className="text-gray-600"
                  >
                    View Archived Ceremonies
                  </Button>
                  <Button variant="outline" onClick={() => setShowSwitchCeremonyDialog(false)}>
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Archived Ceremonies Dialog */}
            <Dialog open={showArchivedCeremoniesDialog} onOpenChange={setShowArchivedCeremoniesDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Archived Ceremonies</DialogTitle>
                  <DialogDescription>
                    View and restore deactivated ceremonies. These ceremonies are hidden from the active list.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  {allCouples.filter(couple => !couple.isActive).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No archived ceremonies found.</p>
                      <p className="text-sm mt-2">Deactivated ceremonies will appear here.</p>
                    </div>
                  ) : (
                    allCouples
                      .filter(couple => !couple.isActive)
                      .map((couple) => (
                        <Card
                          key={couple.id}
                          className="border-gray-300 bg-gray-50"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Couple Names */}
                                <div className="mb-4">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {couple?.brideName || 'Partner 1'} & {couple?.groomName || 'Partner 2'}
                                  </h3>
                                  <Badge className="bg-gray-500 text-white">
                                    Archived
                                  </Badge>
                                </div>

                                {/* Couple Information Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Bride Info */}
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Avatar className={`ring-2 ${couple.colors?.brideRing || 'ring-pink-100'}`}>
                                        <AvatarFallback className={`${couple.colors?.bride || 'bg-pink-500'} text-white`}>
                                          {getInitials(couple?.brideName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-900">{couple?.brideName || 'Bride'}</p>
                                        <p className={`text-xs ${couple.colors?.brideText || 'text-pink-600'}`}>Bride</p>
                                      </div>
                                    </div>
                                    <div className="ml-12 text-sm space-y-1">
                                      <div className="flex items-center text-gray-600">
                                        <Mail className="w-3 h-3 mr-2" />
                                        {couple?.brideEmail || 'No email'}
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Phone className="w-3 h-3 mr-2" />
                                        {couple?.bridePhone || 'No phone'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Groom Info */}
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <Avatar className={`ring-2 ${couple.colors?.groomRing || 'ring-blue-100'}`}>
                                        <AvatarFallback className={`${couple.colors?.groom || 'bg-blue-500'} text-white`}>
                                          {getInitials(couple?.groomName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-900">{couple?.groomName || 'Groom'}</p>
                                        <p className={`text-xs ${couple.colors?.groomText || 'text-blue-600'}`}>Groom</p>
                                      </div>
                                    </div>
                                    <div className="ml-12 text-sm space-y-1">
                                      <div className="flex items-center text-gray-600">
                                        <Mail className="w-3 h-3 mr-2" />
                                        {couple?.groomEmail || 'No email'}
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Phone className="w-3 h-3 mr-2" />
                                        {couple?.groomPhone || 'No phone'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Wedding Details */}
                                {couple.weddingDetails && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="font-medium text-gray-700 flex items-center">
                                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                                          Venue
                                        </p>
                                        <p className="text-gray-600 ml-6">{couple.weddingDetails.venueName}</p>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-700 flex items-center">
                                          <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                                          Date
                                        </p>
                                        <p className="text-gray-600 ml-6">
                                          {couple.weddingDetails.weddingDate
                                            ? new Date(couple.weddingDetails.weddingDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                              })
                                            : 'Not set'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Restore Button */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <Button
                                    onClick={() => handleUnarchiveCouple(couple.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Restore Ceremony
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowArchivedCeremoniesDialog(false)}>
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Active Ceremony Status Button */}
            <Button
              size="default"
              onClick={toggleCeremonyStatus}
              className={`px-4 py-2 h-10 text-white transition-all ${
                allCouples[activeCoupleIndex]?.isActive
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                allCouples[activeCoupleIndex]?.isActive ? 'bg-white' : 'bg-white'
              }`}></div>
              {allCouples[activeCoupleIndex]?.isActive ? 'Active Ceremony' : 'Archived Ceremony'}
            </Button>

            {/* Officiant Avatar with Dropdown Menu */}
            <Popover open={officiantMenuOpen} onOpenChange={setOfficiantMenuOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <Avatar className="ring-2 ring-blue-100">
                    <AvatarImage src="/api/placeholder/32/32" />
                    <AvatarFallback className="bg-blue-500 text-white">PM</AvatarFallback>
                  </Avatar>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Pastor Michael</p>
                    <p className="text-xs text-gray-500">Licensed Officiant</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => {
                      setOfficiantMenuOpen(false)
                      setShowDashboardDialog(true)
                    }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setOfficiantMenuOpen(false)
                      handleLogout()
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  )
}
