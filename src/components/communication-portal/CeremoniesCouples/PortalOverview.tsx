"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Users, Clock, MapPin, Phone, Mail, User, Star, Edit, Save } from "lucide-react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

// Helper to safely get initials from a name
const getInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '??'
  return name.split(' ').map(n => n?.[0] || '').join('') || '??'
}

export function PortalOverview() {
  const {
    showEditCoupleDialog,
    setShowEditCoupleDialog,
    setShowSwitchCeremonyDialog,
    allCouples,
    activeCoupleIndex,
    editCoupleInfo,
    setEditCoupleInfo,
    editWeddingDetails,
    handleEditCoupleInfo,
    handleOpenEditWeddingDialog,
  } = useCommunicationPortal()

  // Guard against null/undefined editCoupleInfo
  if (!editCoupleInfo || !editCoupleInfo.brideName) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
        <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>
      </div>
    )
  }

  // Safely get current couple colors
  const currentCouple = allCouples?.[activeCoupleIndex]
  const colors = currentCouple?.colors || {}

  return (
    <>

        {/* Enhanced Info Cards with Edit Button */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Wedding Couple
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Switch Ceremony Button */}
                  <Button
                    size="sm"
                    onClick={() => setShowSwitchCeremonyDialog(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1 h-8"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Switch
                  </Button>
                  {/* Edit Couple Info Button */}
                  <Dialog open={showEditCoupleDialog} onOpenChange={setShowEditCoupleDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-3 py-1 h-8">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Couple Information</DialogTitle>
                      <DialogDescription>
                        Update the couple's contact information and preferences.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                      {/* Bride Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-pink-900">Bride Information</h3>
                        <div>
                          <Label htmlFor="editBrideName">Full Name</Label>
                          <Input
                            id="editBrideName"
                            value={editCoupleInfo?.brideName || ''}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, brideName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editBrideEmail">Email</Label>
                          <Input
                            id="editBrideEmail"
                            type="email"
                            value={editCoupleInfo?.brideEmail || ''}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, brideEmail: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editBridePhone">Phone</Label>
                          <Input
                            id="editBridePhone"
                            type="tel"
                            value={editCoupleInfo?.bridePhone || ''}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, bridePhone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editBrideAddress">Primary Address</Label>
                          <Input
                            id="editBrideAddress"
                            value={editCoupleInfo?.brideAddress || ""}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, brideAddress: e.target.value})}
                            placeholder="Bride's primary address"
                          />
                        </div>
                      </div>

                      {/* Groom Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-900">Groom Information</h3>
                        <div>
                          <Label htmlFor="editGroomName">Full Name</Label>
                          <Input
                            id="editGroomName"
                            value={editCoupleInfo?.groomName || ''}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, groomName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editGroomEmail">Email</Label>
                          <Input
                            id="editGroomEmail"
                            type="email"
                            value={editCoupleInfo?.groomEmail || ''}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, groomEmail: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editGroomPhone">Phone</Label>
                          <Input
                            id="editGroomPhone"
                            type="tel"
                            value={editCoupleInfo?.groomPhone || ''}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, groomPhone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editGroomAddress">Primary Address</Label>
                          <Input
                            id="editGroomAddress"
                            value={editCoupleInfo?.groomAddress || ""}
                            onChange={(e) => setEditCoupleInfo({...editCoupleInfo, groomAddress: e.target.value})}
                            placeholder="Groom's primary address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editEmergencyContact">Emergency Contact</Label>
                        <Input
                          id="editEmergencyContact"
                          value={editCoupleInfo?.emergencyContact || ''}
                          onChange={(e) => setEditCoupleInfo({...editCoupleInfo, emergencyContact: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editSpecialRequests">Special Requests & Preferences</Label>
                        <Textarea
                          id="editSpecialRequests"
                          value={editCoupleInfo?.specialRequests || ''}
                          onChange={(e) => setEditCoupleInfo({...editCoupleInfo, specialRequests: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowEditCoupleDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEditCoupleInfo} className="bg-blue-500 hover:bg-blue-600">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className={`ring-2 ${colors.brideRing || 'ring-pink-100'}`}>
                    <AvatarImage src="/api/placeholder/40/40" />
                    <AvatarFallback className={`${colors.bride || 'bg-pink-500'} text-white`}>
                      {getInitials(editCoupleInfo?.brideName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{editCoupleInfo?.brideName || 'Bride'}</p>
                    <p className={`text-sm ${colors.brideText || 'text-pink-600'} font-medium`}>Bride</p>
                  </div>
                </div>
                {editCoupleInfo?.brideAddress && (
                  <div className="pl-12 text-sm text-gray-600 flex items-start">
                    <MapPin className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${colors.brideIcon || 'text-pink-500'}`} />
                    <span>{editCoupleInfo.brideAddress}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Avatar className={`ring-2 ${colors.groomRing || 'ring-blue-100'}`}>
                    <AvatarImage src="/api/placeholder/40/40" />
                    <AvatarFallback className={`${colors.groom || 'bg-blue-500'} text-white`}>
                      {getInitials(editCoupleInfo?.groomName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{editCoupleInfo?.groomName || 'Groom'}</p>
                    <p className={`text-sm ${colors.groomText || 'text-blue-600'} font-medium`}>Groom</p>
                  </div>
                </div>
                {editCoupleInfo?.groomAddress && (
                  <div className="pl-12 text-sm text-gray-600 flex items-start">
                    <MapPin className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${colors.groomIcon || 'text-blue-500'}`} />
                    <span>{editCoupleInfo.groomAddress}</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4 mr-2" />
                    {editCoupleInfo?.bridePhone || 'No phone'}
                  </div>
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="w-4 h-4 mr-2" />
                    {editCoupleInfo?.brideEmail || 'No email'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg flex items-center text-blue-900">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Officiant
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 ring-2 ring-blue-100">
                    <AvatarImage src="/api/placeholder/48/48" />
                    <AvatarFallback className="bg-blue-500 text-white">PM</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">Pastor Michael Adams</p>
                    <p className="text-sm text-blue-600 font-medium">Licensed Officiant</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <Badge variant="secondary" className="text-xs ml-1 bg-yellow-50 text-yellow-700">
                        5 Years Experience
                      </Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4 mr-2" />
                    (555) 987-6543
                  </div>
                  <div className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="w-4 h-4 mr-2" />
                    pastor.michael@ordainedpro.com
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Wedding Details
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Ceremony Details Form Button */}
                  <Button
                    size="sm"
                    onClick={() => window.open('/ceremony-details', '_blank')}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-8"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Form
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenEditWeddingDialog}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-3 py-1 h-8"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{editWeddingDetails?.venueName || 'Venue TBD'}</p>
                  <p className="text-gray-600">{editWeddingDetails?.venueAddress || 'Address TBD'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {editWeddingDetails?.weddingDate
                      ? new Date(editWeddingDetails.weddingDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Date TBD'}
                  </p>
                  <p className="text-gray-600">
                    {editWeddingDetails?.startTime
                      ? new Date(`2024-01-01 ${editWeddingDetails.startTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'Start TBD'}
                    {' - '}
                    {editWeddingDetails?.endTime
                      ? new Date(`2024-01-01 ${editWeddingDetails.endTime}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'End TBD'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Expected Guests</p>
                  <p className="text-gray-600">{editWeddingDetails?.expectedGuests || '0'} people</p>
                </div>
                {editWeddingDetails?.officiantNotes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="font-semibold text-gray-900 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Officiant Notes
                    </p>
                    <p className="text-gray-600 whitespace-pre-wrap text-xs bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      {editWeddingDetails.officiantNotes}
                    </p>
                  </div>
                )}
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 w-fit shadow-md">
                  <Clock className="w-3 h-3 mr-1" />
                  {editWeddingDetails?.weddingDate
                    ? Math.ceil((new Date(editWeddingDetails.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 0} days until wedding
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs Navigation with all sections */}
    </>
  )
}
