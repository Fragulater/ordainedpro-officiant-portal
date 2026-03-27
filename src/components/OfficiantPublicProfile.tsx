"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  DollarSign,
  Award,
  Heart,
  Search,
  Filter,
  Play,
  X,
  Calendar,
} from "lucide-react"

interface OfficiantProfile {
  id: string
  fullName: string
  headshot: string
  city: string
  state: string
  yearsExperience: number
  rating: number
  totalReviews: number
  phone: string
  email: string
  website: string
  socialMedia: {
    facebook: string
    instagram: string
    linkedin: string
    youtube: string
  }
  priceRange: {
    min: number
    max: number
  }
  bio: string
  photoGallery: string[]
  videoUrl: string
}

export function OfficiantPublicProfile() {
  const [searchQuery, setSearchQuery] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [experienceFilter, setExperienceFilter] = useState<string>("all")
  const [officiants, setOfficiants] = useState<OfficiantProfile[]>([])
  const [selectedOfficiant, setSelectedOfficiant] = useState<OfficiantProfile | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Load officiants (in a real app, this would fetch from an API)
  useEffect(() => {
    // For demo, load from localStorage and create sample data
    const storedProfile = localStorage.getItem("officiantProfile")
    const mockOfficiants: OfficiantProfile[] = [
      // Sample officiants for demonstration
      {
        id: "1",
        fullName: "Pastor Michael Adams",
        headshot: "",
        city: "Garden City",
        state: "CA",
        yearsExperience: 5,
        rating: 4.9,
        totalReviews: 127,
        phone: "(555) 987-6543",
        email: "pastor.michael@ordainedpro.com",
        website: "https://pastoradams.com",
        socialMedia: {
          facebook: "https://facebook.com/pastoradams",
          instagram: "@pastoradams",
          linkedin: "",
          youtube: "",
        },
        priceRange: {
          min: 300,
          max: 800,
        },
        bio: "With over 5 years of experience officiating weddings, I specialize in creating personalized, heartfelt ceremonies that truly reflect each couple's unique love story. Whether you envision a traditional religious ceremony or a modern secular celebration, I work closely with you to craft a meaningful experience that you and your guests will cherish forever.",
        photoGallery: [],
        videoUrl: "",
      },
      {
        id: "2",
        fullName: "Reverend Sarah Martinez",
        headshot: "",
        city: "Los Angeles",
        state: "CA",
        yearsExperience: 8,
        rating: 5.0,
        totalReviews: 203,
        phone: "(555) 234-5678",
        email: "rev.sarah@weddingsoflove.com",
        website: "https://weddingsoflove.com",
        socialMedia: {
          facebook: "",
          instagram: "@revsarahweddings",
          linkedin: "",
          youtube: "",
        },
        priceRange: {
          min: 400,
          max: 1200,
        },
        bio: "I believe every love story deserves to be celebrated in a way that's authentic and meaningful. As a licensed officiant with 8 years of experience, I've had the honor of uniting couples from all walks of life. I offer bilingual services (English/Spanish) and specialize in interfaith and LGBTQ+ ceremonies.",
        photoGallery: [],
        videoUrl: "",
      },
      {
        id: "3",
        fullName: "Minister James Wilson",
        headshot: "",
        city: "San Francisco",
        state: "CA",
        yearsExperience: 12,
        rating: 4.8,
        totalReviews: 315,
        phone: "(555) 345-6789",
        email: "james@wilsonweddings.com",
        website: "https://wilsonweddings.com",
        socialMedia: {
          facebook: "",
          instagram: "@ministerjames",
          linkedin: "",
          youtube: "https://youtube.com/ministerjames",
        },
        priceRange: {
          min: 500,
          max: 1500,
        },
        bio: "For over a decade, I've dedicated myself to making wedding ceremonies unforgettable. My approach combines warmth, professionalism, and a touch of humor to create ceremonies that feel both significant and joyful. I'm experienced in all ceremony styles from intimate elopements to grand celebrations.",
        photoGallery: [],
        videoUrl: "",
      },
    ]

    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile)
        // Add the stored profile as the first officiant if it has required fields
        if (profile.fullName && profile.city && profile.state) {
          mockOfficiants.unshift({
            id: "current",
            ...profile,
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    setOfficiants(mockOfficiants)
  }, [])

  // Filter officiants based on search criteria
  const filteredOfficiants = officiants.filter((officiant) => {
    const matchesSearch =
      searchQuery === "" ||
      officiant.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officiant.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officiant.state.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLocation =
      locationFilter === "" ||
      officiant.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
      officiant.state.toLowerCase().includes(locationFilter.toLowerCase())

    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "budget" && officiant.priceRange.max <= 500) ||
      (priceFilter === "moderate" && officiant.priceRange.min >= 400 && officiant.priceRange.max <= 1000) ||
      (priceFilter === "premium" && officiant.priceRange.min >= 1000)

    const matchesExperience =
      experienceFilter === "all" ||
      (experienceFilter === "new" && officiant.yearsExperience < 3) ||
      (experienceFilter === "experienced" && officiant.yearsExperience >= 3 && officiant.yearsExperience < 10) ||
      (experienceFilter === "veteran" && officiant.yearsExperience >= 10)

    return matchesSearch && matchesLocation && matchesPrice && matchesExperience
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Officiant</h1>
            </div>
            <p className="text-lg text-gray-600">Browse experienced wedding officiants in your area</p>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="budget">Budget (Under $500)</SelectItem>
                <SelectItem value="moderate">Moderate ($400-$1000)</SelectItem>
                <SelectItem value="premium">Premium ($1000+)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Experience</SelectItem>
                <SelectItem value="new">New (0-2 years)</SelectItem>
                <SelectItem value="experienced">Experienced (3-9 years)</SelectItem>
                <SelectItem value="veteran">Veteran (10+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Officiants Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredOfficiants.length}</span> officiant{filteredOfficiants.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOfficiants.map((officiant) => (
            <Card
              key={officiant.id}
              className="hover:shadow-xl transition-all cursor-pointer border-purple-100"
              onClick={() => setSelectedOfficiant(officiant)}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-24 h-24 mb-3">
                    {officiant.headshot ? (
                      <AvatarImage src={officiant.headshot} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                        {officiant.fullName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <h3 className="font-bold text-lg text-gray-900 text-center">{officiant.fullName}</h3>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {officiant.city}, {officiant.state}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(officiant.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">{officiant.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({officiant.totalReviews})</span>
                </div>

                {/* Experience Badge */}
                <div className="flex justify-center mb-3">
                  <Badge className="bg-purple-100 text-purple-800">
                    <Award className="w-3 h-3 mr-1" />
                    {officiant.yearsExperience} {officiant.yearsExperience === 1 ? "Year" : "Years"}
                  </Badge>
                </div>

                {/* Price Range */}
                <div className="text-center py-2 bg-green-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Price Range</p>
                  <p className="font-bold text-green-700">
                    ${officiant.priceRange.min} - ${officiant.priceRange.max}
                  </p>
                </div>

                {/* Bio Preview */}
                <p className="text-sm text-gray-600 text-center line-clamp-3 mb-4">
                  {officiant.bio || "Professional wedding officiant ready to make your ceremony special."}
                </p>

                {/* View Profile Button */}
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  View Full Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOfficiants.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No officiants found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Detailed Profile Dialog */}
      {selectedOfficiant && (
        <Dialog open={!!selectedOfficiant} onOpenChange={() => setSelectedOfficiant(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedOfficiant.fullName}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedOfficiant.city}, {selectedOfficiant.state}
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="w-32 h-32">
                    {selectedOfficiant.headshot ? (
                      <AvatarImage src={selectedOfficiant.headshot} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl">
                        {selectedOfficiant.fullName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Rating */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(selectedOfficiant.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-lg">{selectedOfficiant.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({selectedOfficiant.totalReviews} reviews)</span>
                  </div>

                  {/* Experience & Price */}
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      <Award className="w-3 h-3 mr-1" />
                      {selectedOfficiant.yearsExperience} Years Experience
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ${selectedOfficiant.priceRange.min} - ${selectedOfficiant.priceRange.max}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="font-semibold text-lg mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{selectedOfficiant.bio}</p>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedOfficiant.phone && (
                    <a href={`tel:${selectedOfficiant.phone}`} className="flex items-center text-gray-700 hover:text-purple-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedOfficiant.phone}
                    </a>
                  )}
                  {selectedOfficiant.email && (
                    <a href={`mailto:${selectedOfficiant.email}`} className="flex items-center text-gray-700 hover:text-purple-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedOfficiant.email}
                    </a>
                  )}
                  {selectedOfficiant.website && (
                    <a href={selectedOfficiant.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-700 hover:text-purple-600">
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                </div>

                {/* Social Media */}
                {(selectedOfficiant.socialMedia.facebook || selectedOfficiant.socialMedia.instagram || selectedOfficiant.socialMedia.linkedin || selectedOfficiant.socialMedia.youtube) && (
                  <div className="flex gap-3 mt-4">
                    {selectedOfficiant.socialMedia.facebook && (
                      <a href={selectedOfficiant.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {selectedOfficiant.socialMedia.instagram && (
                      <a href={selectedOfficiant.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600">
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {selectedOfficiant.socialMedia.linkedin && (
                      <a href={selectedOfficiant.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-700">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {selectedOfficiant.socialMedia.youtube && (
                      <a href={selectedOfficiant.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-600">
                        <Youtube className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Video */}
              {selectedOfficiant.videoUrl && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Introduction Video</h3>
                  <video
                    src={selectedOfficiant.videoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Photo Gallery */}
              {selectedOfficiant.photoGallery.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Photo Gallery</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedOfficiant.photoGallery.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Gallery photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => setSelectedImage(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Consultation
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Viewer Dialog */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <img src={selectedImage} alt="Gallery photo" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
