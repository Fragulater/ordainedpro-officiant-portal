"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, BriefcaseBusiness, Download, Mail, MapPin, Phone, Plus, Save, Search, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  addVendor,
  deleteVendor,
  loadVendors,
  updateVendor,
  type VendorInput,
  type VendorRecord,
} from "@/services/vendor-service"

const DEFAULT_VENDOR_TYPES = [
  "Photographer",
  "Videographer",
  "Florist",
  "Venue",
  "DJ",
  "Caterer",
  "Planner",
  "Hair & Makeup",
  "Bakery",
  "Rental Company",
  "Transportation",
  "Other",
]

const EMPTY_VENDOR_FORM: VendorInput = {
  businessType: "Photographer",
  businessName: "",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
}

type MyVendorsViewProps = {
  userId?: string
}

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")

const parseDelimitedRows = (text: string, delimiter: "," | "\t") => {
  const rows: string[][] = []
  let current = ""
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === "\"" && next === "\"") {
      current += "\""
      index += 1
      continue
    }

    if (char === "\"") {
      inQuotes = !inQuotes
      continue
    }

    if (char === delimiter && !inQuotes) {
      row.push(current.trim())
      current = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1
      row.push(current.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      current = ""
      continue
    }

    current += char
  }

  row.push(current.trim())
  if (row.some(Boolean)) rows.push(row)

  return rows
}

const getCell = (row: string[], headerMap: Map<string, number>, aliases: string[]) => {
  for (const alias of aliases) {
    const index = headerMap.get(alias)
    if (index !== undefined) return row[index] || ""
  }

  return ""
}

const mapRowsToVendors = (rows: string[][]): VendorInput[] => {
  if (rows.length < 2) return []

  const headerMap = new Map<string, number>()
  rows[0].forEach((header, index) => {
    headerMap.set(normalizeHeader(header), index)
  })

  return rows.slice(1)
    .map((row) => ({
      businessType: getCell(row, headerMap, ["businesstype", "type", "category", "vendorcategory"]) || "Other",
      businessName: getCell(row, headerMap, ["businessname", "business", "company", "companyname", "vendor", "vendorname"]),
      contactName: getCell(row, headerMap, ["contactname", "contact", "person", "representative"]),
      phone: getCell(row, headerMap, ["phone", "phonenumber", "mobile", "cell"]),
      email: getCell(row, headerMap, ["email", "emailaddress"]),
      address: getCell(row, headerMap, ["address", "businessaddress", "location"]),
      notes: getCell(row, headerMap, ["notes", "note", "comments", "details"]),
    }))
    .filter((vendor) => vendor.businessName.trim())
}

export function MyVendorsView({ userId }: MyVendorsViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [form, setForm] = useState<VendorInput>(EMPTY_VENDOR_FORM)
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null)
  const [filterType, setFilterType] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const vendorTypes = useMemo(() => {
    const customTypes = vendors.map((vendor) => vendor.business_type).filter(Boolean)
    return Array.from(new Set([...DEFAULT_VENDOR_TYPES, ...customTypes])).sort((a, b) => a.localeCompare(b))
  }, [vendors])

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return vendors.filter((vendor) => {
      const matchesType = filterType === "All" || vendor.business_type === filterType
      const searchable = [
        vendor.business_type,
        vendor.business_name,
        vendor.contact_name,
        vendor.phone,
        vendor.email,
        vendor.address,
        vendor.notes,
      ].filter(Boolean).join(" ").toLowerCase()

      return matchesType && (!query || searchable.includes(query))
    })
  }, [filterType, searchQuery, vendors])

  useEffect(() => {
    const load = async () => {
      if (!userId) return

      setIsLoading(true)
      setErrorMessage("")
      const result = await loadVendors(userId)
      setIsLoading(false)

      if (!result.ok) {
        setErrorMessage("Vendor list is not ready yet. Run supabase-vendors.sql in Supabase, then refresh this page.")
        return
      }

      setVendors(result.data || [])
    }

    load()
  }, [userId])

  const updateForm = (field: keyof VendorInput, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const resetForm = () => {
    setForm(EMPTY_VENDOR_FORM)
    setEditingVendorId(null)
  }

  const showStatus = (message: string) => {
    setStatusMessage(message)
    window.setTimeout(() => setStatusMessage(""), 2600)
  }

  const handleSaveVendor = async () => {
    if (!userId) {
      setErrorMessage("Please sign in before saving vendors.")
      return
    }

    if (!form.businessName.trim()) {
      setErrorMessage("Business name is required.")
      return
    }

    setIsSaving(true)
    setErrorMessage("")
    const result = editingVendorId
      ? await updateVendor(editingVendorId, form)
      : await addVendor(userId, form)
    setIsSaving(false)

    if (!result.ok || !result.data) {
      setErrorMessage(result.error || "Unable to save this vendor.")
      return
    }

    setVendors((previous) => editingVendorId
      ? previous.map((vendor) => vendor.id === editingVendorId ? result.data! : vendor)
      : [result.data!, ...previous]
    )
    resetForm()
    showStatus(editingVendorId ? "Vendor updated." : "Vendor added.")
  }

  const handleEditVendor = (vendor: VendorRecord) => {
    setEditingVendorId(vendor.id)
    setForm({
      businessType: vendor.business_type,
      businessName: vendor.business_name,
      contactName: vendor.contact_name || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      notes: vendor.notes || "",
    })
  }

  const handleDeleteVendor = async (vendor: VendorRecord) => {
    if (!confirm(`Delete ${vendor.business_name} from your vendor list?`)) return

    const result = await deleteVendor(vendor.id)
    if (!result.ok) {
      setErrorMessage(result.error || "Unable to delete this vendor.")
      return
    }

    setVendors((previous) => previous.filter((item) => item.id !== vendor.id))
    if (editingVendorId === vendor.id) resetForm()
    showStatus("Vendor deleted.")
  }

  const handleImportFile = async (file: File) => {
    if (!userId) {
      setErrorMessage("Please sign in before importing vendors.")
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    if (!["csv", "tsv", "txt"].includes(extension || "")) {
      setErrorMessage("Please export Excel or Google Sheets as CSV, then upload the CSV file here.")
      return
    }

    const text = await file.text()
    const rows = parseDelimitedRows(text, extension === "tsv" ? "\t" : ",")
    const importedVendors = mapRowsToVendors(rows)

    if (!importedVendors.length) {
      setErrorMessage("No vendors were found. Include columns like Business Type, Business Name, Contact Name, Phone, Email, Address, and Notes.")
      return
    }

    setIsSaving(true)
    setErrorMessage("")
    const savedVendors: VendorRecord[] = []
    for (const vendor of importedVendors) {
      const result = await addVendor(userId, vendor)
      if (result.ok && result.data) savedVendors.push(result.data)
    }
    setIsSaving(false)

    if (!savedVendors.length) {
      setErrorMessage("The import file was read, but no vendors could be saved.")
      return
    }

    setVendors((previous) => [...savedVendors, ...previous])
    showStatus(`${savedVendors.length} vendor${savedVendors.length === 1 ? "" : "s"} imported.`)
  }

  const exportCsv = () => {
    const headers = ["Business Type", "Business Name", "Contact Name", "Phone", "Email", "Address", "Notes"]
    const rows = vendors.map((vendor) => [
      vendor.business_type,
      vendor.business_name,
      vendor.contact_name || "",
      vendor.phone || "",
      vendor.email || "",
      vendor.address || "",
      vendor.notes || "",
    ])

    const escape = (value: string) => `"${value.replace(/"/g, "\"\"")}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "ordainedpro-vendors.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Vendors</h2>
          <p className="mt-1 text-gray-600">
            Keep a searchable list of venues, photographers, florists, planners, and other businesses you work with.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleImportFile(file)
              event.currentTarget.value = ""
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={!vendors.length}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <BriefcaseBusiness className="mr-2 h-5 w-5" />
              {editingVendorId ? "Edit Vendor" : "Add Vendor"}
            </CardTitle>
            <CardDescription>Save vendors you trust and want to remember.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Type of business</Label>
              <select
                value={form.businessType}
                onChange={(event) => updateForm("businessType", event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
              >
                {vendorTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Business name *</Label>
              <Input value={form.businessName} onChange={(event) => updateForm("businessName", event.target.value)} placeholder="e.g., Desert Rose Florals" className="mt-1" />
            </div>
            <div>
              <Label>Contact name</Label>
              <Input value={form.contactName} onChange={(event) => updateForm("contactName", event.target.value)} placeholder="Primary contact" className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} placeholder="(555) 555-5555" className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="vendor@example.com" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(event) => updateForm("address", event.target.value)} placeholder="Street, city, state" className="mt-1" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Pricing notes, best contact times, relationship details..." rows={4} className="mt-1" />
            </div>
            {errorMessage && (
              <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {errorMessage}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className={`text-sm font-medium text-green-700 transition-opacity duration-500 ${statusMessage ? "opacity-100" : "opacity-0"}`}>
                {statusMessage || "Saved"}
              </p>
              <div className="flex gap-2">
                {editingVendorId && (
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                )}
                <Button onClick={handleSaveVendor} disabled={isSaving || !form.businessName.trim()} className="bg-blue-500 hover:bg-blue-600">
                  {editingVendorId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {isSaving ? "Saving..." : editingVendorId ? "Save Changes" : "Add Vendor"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search vendors by name, contact, email, phone, address, or notes..."
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="All">All business types</option>
              {vendorTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {isLoading && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-gray-500">Loading vendors...</CardContent>
              </Card>
            )}
            {!isLoading && filteredVendors.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <BriefcaseBusiness className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-medium text-gray-900">No vendors found</p>
                  <p className="mt-1 text-sm text-gray-500">Add one manually or import a CSV from Excel or Google Sheets.</p>
                </CardContent>
              </Card>
            )}
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{vendor.business_name}</h3>
                        <Badge variant="secondary">{vendor.business_type}</Badge>
                      </div>
                      {vendor.contact_name && <p className="text-sm font-medium text-gray-700">{vendor.contact_name}</p>}
                      <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                        {vendor.phone && <span className="flex items-center"><Phone className="mr-2 h-4 w-4" />{vendor.phone}</span>}
                        {vendor.email && <span className="flex items-center"><Mail className="mr-2 h-4 w-4" />{vendor.email}</span>}
                        {vendor.address && <span className="flex items-center md:col-span-2"><MapPin className="mr-2 h-4 w-4" />{vendor.address}</span>}
                      </div>
                      {vendor.notes && <p className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">{vendor.notes}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditVendor(vendor)}>Edit</Button>
                      <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDeleteVendor(vendor)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

