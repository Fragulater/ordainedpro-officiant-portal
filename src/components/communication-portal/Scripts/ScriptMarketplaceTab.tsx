"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Plus, Star, DollarSign, ShoppingCart, Edit, Eye, TrendingUp, Upload, Download, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import { useCommunicationPortal } from "../CommunicationPortalContext"

const MARKETPLACE_LANGUAGES = ["English", "Spanish", "Punjabi", "Hindi", "French", "Chinese", "Other"]
const MARKETPLACE_CATEGORIES = ["Christian", "Catholic", "Jewish", "Muslim", "Hindu", "Other"]
const MARKETPLACE_CEREMONY_TYPES = [
  "Weddings",
  "LGBTQ Weddings",
  "Quinceanera",
  "Celebration of Life",
  "Vow Renewals",
  "Baptisms",
  "Memorial Services",
  "Other",
]

type MarketplaceDialogMode = "upload" | "publish"

function normalizeSelections(selected: string[], otherValue: string) {
  const withoutOther = selected.filter((value) => value !== "Other")
  const custom = otherValue.trim()
  return custom ? [...withoutOther, custom] : withoutOther
}

export function ScriptMarketplaceTab() {
  const {
    setShowArchivedCeremoniesDialog,
    handleEditScript,
    handleViewScript,
    handleDownloadScript,
    handleDeleteScript,
    handleUploadMarketplaceScript,
    handlePublishScriptToMarketplace,
    handleUnpublishScriptFromMarketplace,
    handleViewMarketplaceScript,
    showMarketplaceAnalytics,
    setShowMarketplaceAnalytics,
    showPayoutHistory,
    setShowPayoutHistory,
    marketplaceTotalEarnings,
    marketplaceMonthEarnings,
    marketplaceSalesCount,
    marketplaceAverageSale,
    marketplaceTopScript,
    mainMarketplaceScriptCount,
    accountCreatedAt,
    scriptSales,
    editCoupleInfo,
    currentCeremonyType,
    currentCeremonyConfig,
    myScripts,
    popularScripts,
  } = useCommunicationPortal()
  const marketplaceUploadInputRef = useRef<HTMLInputElement>(null)
  const [marketplaceDetailsOpen, setMarketplaceDetailsOpen] = useState(false)
  const [marketplaceDialogMode, setMarketplaceDialogMode] = useState<MarketplaceDialogMode>("upload")
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  const [pendingPublishScript, setPendingPublishScript] = useState<any | null>(null)
  const [marketplacePrice, setMarketplacePrice] = useState("25")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCeremonyTypes, setSelectedCeremonyTypes] = useState<string[]>(["Weddings"])
  const [marketplaceVisibility, setMarketplaceVisibility] = useState<"main_marketplace" | "store_only">("main_marketplace")
  const [sellerLegalAccepted, setSellerLegalAccepted] = useState(false)
  const [otherLanguage, setOtherLanguage] = useState("")
  const [otherCategory, setOtherCategory] = useState("")
  const [otherCeremonyType, setOtherCeremonyType] = useState("")

  const serviceTerms = [
    currentCeremonyType,
    currentCeremonyConfig?.label,
    currentCeremonyConfig?.value,
    ...(currentCeremonyType === "wedding" ? ["wedding", "weddings"] : []),
    ...(currentCeremonyType === "celebration_of_life" ? ["celebration of life", "wake", "funeral", "memorial", "memorial services"] : []),
    ...(currentCeremonyType === "quinceanera" ? ["quinceanera", "quinceañera", "coming of age", "sweet 16", "sweet sixteen"] : []),
    ...(currentCeremonyType === "vow_renewal" ? ["vow renewal", "vow renewals"] : []),
    ...(currentCeremonyType === "baby_blessing" ? ["baby blessing", "naming"] : []),
    ...(currentCeremonyType === "other" ? ["other"] : []),
  ]
    .filter(Boolean)
    .map((term: string) => term.toLowerCase())

  const scriptMatchesServiceType = (script: any) => {
    const searchableValues = [
      script.type,
      script.title,
      script.description,
      ...(Array.isArray(script.marketplaceCeremonyTypes) ? script.marketplaceCeremonyTypes : []),
      ...(Array.isArray(script.categories) ? script.categories : []),
    ]
      .filter(Boolean)
      .map((value: string) => value.toLowerCase())

    return serviceTerms.some((term: string) =>
      searchableValues.some((value: string) => value.includes(term) || term.includes(value))
    )
  }

  const profileScopedScripts = myScripts.filter((script: any) =>
    editCoupleInfo?.id && String(script.coupleId || "") === String(editCoupleInfo.id) && scriptMatchesServiceType(script)
  )
  const matchingMarketplaceScripts = popularScripts.filter(scriptMatchesServiceType)

  const resetMarketplaceDetails = () => {
    setMarketplacePrice("25")
    setSelectedLanguages(["English"])
    setSelectedCategories([])
    setSelectedCeremonyTypes(["Weddings"])
    setMarketplaceVisibility("main_marketplace")
    setSellerLegalAccepted(false)
    setOtherLanguage("")
    setOtherCategory("")
    setOtherCeremonyType("")
    setPendingUploadFile(null)
    setPendingPublishScript(null)
  }

  const openUploadDetails = (file: File) => {
    resetMarketplaceDetails()
    setPendingUploadFile(file)
    setMarketplaceDialogMode("upload")
    setMarketplaceDetailsOpen(true)
  }

  const openPublishDetails = (script: any) => {
    resetMarketplaceDetails()
    setPendingPublishScript(script)
    setMarketplaceDialogMode("publish")
    setMarketplacePrice(String(script.price || 25))
    setSelectedLanguages(script.marketplaceLanguages?.length ? script.marketplaceLanguages : ["English"])
    setSelectedCategories(script.marketplaceCategories?.length ? script.marketplaceCategories : [])
    setSelectedCeremonyTypes(script.marketplaceCeremonyTypes?.length ? script.marketplaceCeremonyTypes : [script.type || "Weddings"])
    setMarketplaceVisibility(script.marketplaceVisibility === "store_only" ? "store_only" : "main_marketplace")
    setMarketplaceDetailsOpen(true)
  }

  const toggleSelection = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])
  }

  const handleSubmitMarketplaceDetails = async () => {
    const languages = normalizeSelections(selectedLanguages, otherLanguage)
    const categories = normalizeSelections(selectedCategories, otherCategory)
    const ceremonyTypes = normalizeSelections(selectedCeremonyTypes, otherCeremonyType)

    if (languages.length === 0 || categories.length === 0 || ceremonyTypes.length === 0) {
      alert("Please choose at least one language, category, and ceremony type. If selecting Other, enter a custom option.")
      return
    }

    if (!sellerLegalAccepted) {
      alert("Please confirm the seller rights, buyer license, AI content, and marketplace listing terms before publishing.")
      return
    }

    const details = {
      price: Math.max(0, Number(marketplacePrice || 0)),
      languages,
      categories,
      ceremonyTypes,
      visibility: marketplaceVisibility,
    }

    if (marketplaceDialogMode === "upload" && pendingUploadFile) {
      await handleUploadMarketplaceScript(pendingUploadFile, details)
      if (marketplaceUploadInputRef.current) marketplaceUploadInputRef.current.value = ""
    }

    if (marketplaceDialogMode === "publish" && pendingPublishScript) {
      await handlePublishScriptToMarketplace(pendingPublishScript, details)
    }

    setMarketplaceDetailsOpen(false)
    resetMarketplaceDetails()
  }

  const renderCheckboxGroup = (
    options: string[],
    selected: string[],
    setSelected: (next: string[]) => void,
    otherValue: string,
    setOtherValue: (value: string) => void
  ) => (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 rounded-md border border-blue-100 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggleSelection(option, selected, setSelected)}
            className="h-4 w-4 accent-blue-600"
          />
          {option}
        </label>
      ))}
      {selected.includes("Other") && (
        <Input
          className="col-span-2"
          value={otherValue}
          onChange={(event) => setOtherValue(event.target.value)}
          placeholder="Enter custom option for Other"
        />
      )}
    </div>
  )

  return (
<TabsContent value="marketplace">
            <Dialog open={marketplaceDetailsOpen} onOpenChange={(open) => {
              setMarketplaceDetailsOpen(open)
              if (!open) {
                if (marketplaceUploadInputRef.current) marketplaceUploadInputRef.current.value = ""
                resetMarketplaceDetails()
              }
            }}>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Marketplace Script Details</DialogTitle>
                  <DialogDescription>
                    Choose how this script should appear in the public script marketplace filters.
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-price">Price</Label>
                    <Input
                      id="marketplace-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={marketplacePrice}
                      onChange={(event) => setMarketplacePrice(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Where should this script sell?</Label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          marketplaceVisibility === "main_marketplace"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => setMarketplaceVisibility("main_marketplace")}
                      >
                        <p className="font-semibold text-gray-900">Main Marketplace</p>
                        <p className="mt-1 text-sm text-gray-600">Appears in public marketplace browsing. Limit: 10 active scripts.</p>
                        <p className="mt-2 text-xs font-medium text-blue-700">
                          {mainMarketplaceScriptCount || 0}/10 currently displayed
                        </p>
                      </button>
                      <button
                        type="button"
                        className={`rounded-lg border p-4 text-left transition-colors ${
                          marketplaceVisibility === "store_only"
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => setMarketplaceVisibility("store_only")}
                      >
                        <p className="font-semibold text-gray-900">My Store Only</p>
                        <p className="mt-1 text-sm text-gray-600">Sell from your personal store page without using a main marketplace slot.</p>
                        <p className="mt-2 text-xs font-medium text-purple-700">No store catalog cap</p>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Script Languages</Label>
                    {renderCheckboxGroup(MARKETPLACE_LANGUAGES, selectedLanguages, setSelectedLanguages, otherLanguage, setOtherLanguage)}
                  </div>
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    {renderCheckboxGroup(MARKETPLACE_CATEGORIES, selectedCategories, setSelectedCategories, otherCategory, setOtherCategory)}
                  </div>
                  <div className="space-y-2">
                    <Label>Ceremony Types</Label>
                    {renderCheckboxGroup(MARKETPLACE_CEREMONY_TYPES, selectedCeremonyTypes, setSelectedCeremonyTypes, otherCeremonyType, setOtherCeremonyType)}
                  </div>
                  <label className="flex items-start gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={sellerLegalAccepted}
                      onChange={(event) => setSellerLegalAccepted(event.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      I confirm that I own this script or have the legal right to sell it. I grant OrdainedPro permission to host, display, market, sell, distribute, and deliver it. I understand buyers may edit, customize, print, and perform the script, and may not resell or redistribute it as a standalone product. I also confirm any AI-assisted content has been reviewed and approved by me, and I agree to the{" "}
                      <a href="/legal/seller-agreement" target="_blank" rel="noreferrer" className="text-blue-700 underline">Seller Agreement</a>
                      ,{" "}
                      <a href="/legal/buyer-license-agreement" target="_blank" rel="noreferrer" className="text-blue-700 underline">Buyer License Agreement</a>
                      , and{" "}
                      <a href="/legal/ai-generated-content-policy" target="_blank" rel="noreferrer" className="text-blue-700 underline">AI-Generated Content Policy</a>
                      .
                    </span>
                  </label>
                </div>
                <DialogFooter className="border-t pt-4">
                  <Button variant="outline" onClick={() => setMarketplaceDetailsOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleSubmitMarketplaceDetails}>
                    {marketplaceDialogMode === "upload" ? "Upload and Publish" : "Publish Script"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* My Scripts */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-blue-900">My Script Library</CardTitle>
                          <CardDescription>Manage and sell your ceremony scripts to other officiants</CardDescription>
                        </div>
                        <Button className="bg-blue-500 hover:bg-blue-600" onClick={() => marketplaceUploadInputRef.current?.click()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Upload Script
                        </Button>
                        <input
                          ref={marketplaceUploadInputRef}
                          type="file"
                          accept=".txt,.docx"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) openUploadDetails(file)
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {profileScopedScripts.length === 0 && (
                          <div className="rounded-lg border border-dashed border-blue-200 p-6 text-center text-sm text-gray-600">
                            No matching scripts are available for this ceremony profile yet.
                          </div>
                        )}
                        {profileScopedScripts.map((script: any) => (
                          <div key={script.id} className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{script.title}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <Badge variant={script.status === 'active' ? 'default' : 'outline'}
                                           className={script.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                      {script.status === 'active' ? 'Active' : 'Draft'}
                                    </Badge>
                                    {script.isPublished && (
                                      <Badge
                                        variant="outline"
                                        className={script.marketplaceVisibility === "store_only" ? "border-purple-200 text-purple-700" : "border-blue-200 text-blue-700"}
                                      >
                                        {script.marketplaceVisibility === "store_only" ? "Store Only" : "Main Marketplace"}
                                      </Badge>
                                    )}
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span>{script.rating}</span>
                                      <span>•</span>
                                      <span>{script.sales} sales</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">${script.price}</p>
                                <p className="text-sm text-green-600">Earned: ${script.earnings}</p>
                                <div className="flex space-x-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleEditScript(script)}
                                    title="Edit script"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleViewMarketplaceScript(script)}
                                    title="View public marketplace listing"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleDownloadScript(script)}
                                    title="Download script"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteScript(script)}
                                    title="Delete script"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={script.isPublished ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50" : "border-green-200 text-green-700 hover:bg-green-50"}
                                    onClick={() => script.isPublished ? handleUnpublishScriptFromMarketplace(script) : openPublishDetails(script)}
                                    title={script.isPublished ? "Remove from public marketplace" : "Publish to public marketplace"}
                                  >
                                    {script.isPublished ? "Unpublish" : "Publish"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Browse Scripts */}
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Browse Script Marketplace</CardTitle>
                      <CardDescription>Discover and purchase scripts from other experienced officiants</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {matchingMarketplaceScripts.length === 0 && (
                          <div className="rounded-lg border border-dashed border-blue-200 p-6 text-center text-sm text-gray-600">
                            No matching marketplace scripts are available for this service type yet.
                          </div>
                        )}
                        {matchingMarketplaceScripts.map((script: any) => (
                          <div key={script.id} className="border border-blue-100 rounded-xl p-4 bg-white hover:bg-blue-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{script.title}</p>
                                  <p className="text-sm text-gray-600">by {script.author}</p>
                                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    <span>{script.rating}</span>
                                    <span>•</span>
                                    <span>{script.sales} purchases</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">${script.price}</p>
                                <div className="flex space-x-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => window.open(`https://scripts.ordainedpro.com/search?q=${encodeURIComponent(script.title)}`, "_blank", "noopener,noreferrer")}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Preview
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600"
                                    onClick={() => window.open(`https://scripts.ordainedpro.com/search?q=${encodeURIComponent(script.title)}`, "_blank", "noopener,noreferrer")}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                    Buy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <div className="space-y-6">
                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Earnings Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Total Earnings</p>
                              <p className="text-2xl font-bold text-green-900">${marketplaceTotalEarnings.toFixed(2)}</p>
                              <p className="text-xs text-green-700">Since {new Date(accountCreatedAt).toLocaleDateString()}</p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">This Month</p>
                              <p className="text-2xl font-bold text-blue-900">${marketplaceMonthEarnings.toFixed(2)}</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg border border-blue-100 bg-white p-3">
                            <p className="text-gray-500">Sales</p>
                            <p className="font-semibold text-gray-900">{marketplaceSalesCount}</p>
                          </div>
                          <div className="rounded-lg border border-blue-100 bg-white p-3">
                            <p className="text-gray-500">Avg. Sale</p>
                            <p className="font-semibold text-gray-900">${marketplaceAverageSale.toFixed(2)}</p>
                          </div>
                          <div className="col-span-2 rounded-lg border border-blue-100 bg-white p-3">
                            <p className="text-gray-500">Top Script</p>
                            <p className="font-semibold text-gray-900">{marketplaceTopScript?.title || "No sales yet"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardTitle className="text-blue-900">Script Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-6">
                      <Button
                        className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => setShowArchivedCeremoniesDialog(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Archived Ceremonies
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => marketplaceUploadInputRef.current?.click()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Upload New Script
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setShowMarketplaceAnalytics(!showMarketplaceAnalytics)}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button className="w-full justify-start bg-white border border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setShowPayoutHistory(!showPayoutHistory)}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payout History
                      </Button>
                      {showMarketplaceAnalytics && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                          <p>Published scripts: {myScripts.filter((script: any) => script.isPublished).length}</p>
                          <p>Draft listings: {myScripts.filter((script: any) => !script.isPublished).length}</p>
                          <p>Total marketplace sales: {marketplaceSalesCount}</p>
                        </div>
                      )}
                      {showPayoutHistory && (
                        <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-900">
                          {scriptSales.length === 0 ? (
                            <p>No payouts yet. Stripe payout details will appear here after marketplace purchases are connected.</p>
                          ) : (
                            scriptSales.slice(0, 5).map((sale: any) => (
                              <div key={sale.id} className="flex justify-between border-b border-green-100 py-1 last:border-0">
                                <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                                <span>${Number(sale.net_amount || sale.amount || 0).toFixed(2)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      <Separator className="hidden" />
                      <div className="hidden">
                        <h4 className="font-semibold mb-3 text-blue-900">Popular Categories</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">• Traditional Religious</p>
                          <p className="text-gray-600">• Modern Non-Religious</p>
                          <p className="text-gray-600">• Interfaith Ceremonies</p>
                          <p className="text-gray-600">• Outdoor/Destination</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
  )
}
