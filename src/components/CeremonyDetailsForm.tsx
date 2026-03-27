"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, ArrowLeft, FileText, Calendar } from "lucide-react"

// ✅ Import Supabase utils
import { supabase, isSupabaseConfigured, checkConnection } from "@/lib/supabase"
import { createCeremony, updateCeremony } from "@/services/supabase-api"

export function CeremonyDetailsForm({ onBack }: { onBack?: () => void }) {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const handleBack = () => {
    if (onBack) onBack()
    else {
      window.close()
      setTimeout(() => (window.location.href = "/"), 100)
    }
  }

  const [formData, setFormData] = useState({
    location: "",
    address: "",
    ceremonyDate: "",
    ceremonyTime: "",
    attendees: "",
  })

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ceremonyDetails")
      if (saved) {
        const parsed = JSON.parse(saved)
        const { lastUpdated, savedAt, ...data } = parsed
        setFormData((prev) => ({ ...prev, ...data }))
        setLastSaved(savedAt || null)
        console.log("Loaded saved ceremony details from localStorage")
      }
    } catch (err) {
      console.error("Error loading ceremony details:", err)
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ✅ Build ceremony object for Supabase
  const buildCeremonyRecord = (userId: string, coupleId: number) => ({
    couple_id: coupleId,
    user_id: userId,
    venue_name: formData.location || null,
    venue_address: formData.address || null,
    wedding_date: formData.ceremonyDate || null,
    start_time: formData.ceremonyTime || null,
    end_time: null,
    expected_guests: formData.attendees || null,
  })

  // ✅ Save to Supabase
  const saveToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured — skipping remote save.")
      return { ok: false, reason: "supabase-not-configured" }
    }

    // Check DB connection
    const conn = await checkConnection()
    console.log(`The connection with supabae is ${conn}`)
    if (!conn.ok) {
      console.error("Supabase connection failed:", conn)
      return { ok: false, reason: "db-unreachable", error: conn.error }
    }

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        console.error("No user found:", userError)
        return { ok: false, reason: "no-user" }
      }

      const userId = userData.user.id
      console.log(`User ID : ${userId}`)
      // Get couple ID from localStorage
      const savedRaw = localStorage.getItem("ceremonyDetails")
      let savedJson: any = {}
      try {
        savedJson = savedRaw ? JSON.parse(savedRaw) : {}
      } catch {}

      const coupleId = savedJson?.coupleId ?? savedJson?.couple_id ?? null
      if (!coupleId) {
        console.warn("No coupleId found in localStorage.")
        return { ok: false, reason: "no-couple-id" }
      }

      const ceremonyData = buildCeremonyRecord(userId, Number(coupleId))

      // Check if ceremony exists
      const { data: existing, error: fetchErr } = await supabase
        .from("ceremonies")
        .select("id")
        .eq("couple_id", coupleId)
        .maybeSingle()

      if (fetchErr) {
        console.error("Error checking existing ceremony:", fetchErr)
        return { ok: false, reason: "check-existing-failed", error: fetchErr }
      }

      if (existing) {
        const updated = await updateCeremony(Number(coupleId), ceremonyData)
        return { ok: true, action: "updated", data: updated }
      } else {
        const created = await createCeremony(userId, ceremonyData)
        // Save id locally
        try {
          const createdId = (created as any)?.id ?? null
          if (createdId) {
            const existingLocal = JSON.parse(localStorage.getItem("ceremonyDetails") || "{}")
            existingLocal.coupleId = createdId
            localStorage.setItem("ceremonyDetails", JSON.stringify(existingLocal))
          }
        } catch {}
        return { ok: true, action: "created", data: created }
      }
    } catch (err) {
      console.error("Error saving ceremony:", err)
      return { ok: false, reason: "unexpected", error: err }
    }
  }

  // ✅ Handle save button
  const handleSave = async () => {
    try {
      setSaving(true)
      const savedTime = new Date().toLocaleString()
      const dataToSave = { ...formData, lastUpdated: new Date().toISOString(), savedAt: savedTime }
      console.log(`ceremonyDetails ${JSON.stringify(dataToSave)}`)
      localStorage.setItem("ceremonyDetails", JSON.stringify(dataToSave))
      setLastSaved(savedTime)
      console.log("Saved locally:", dataToSave)

      const remote = await saveToSupabase()
      console.log(remote)
      if (remote.ok) {
        if (remote.action === "created") alert("✅ Ceremony created successfully in Supabase.")
        else if (remote.action === "updated") alert("✅ Ceremony updated successfully in Supabase.")
        else alert("✅ Ceremony saved successfully.")
      } else {
        if (remote.reason === "no-user") alert("⚠️ Please sign in to save to Supabase.")
        else if (remote.reason === "supabase-not-configured")
          alert("⚠️ Supabase not configured. Saved locally only.")
        else if (remote.reason === "no-couple-id")
          alert("⚠️ Missing couple ID. Please link a couple before saving.")
        else alert("⚠️ Saved locally, but remote save failed. Check console for details.")
      }
    } catch (err) {
      console.error("Save error:", err)
      alert("⚠️ An error occurred while saving.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ceremony Details</h1>
                <p className="text-blue-600 font-medium">Save your ceremony info</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {lastSaved && (
                <p className="text-xs text-green-600 font-medium">✓ Last saved: {lastSaved}</p>
              )}
              <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Details"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Venue Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Venue Name</Label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Enter venue name"
              />
            </div>
            <div>
              <Label>Venue Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter venue address"
              />
            </div>
            <div>
              <Label>Ceremony Date</Label>
              <Input
                type="date"
                value={formData.ceremonyDate}
                onChange={(e) => handleInputChange("ceremonyDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.ceremonyTime}
                onChange={(e) => handleInputChange("ceremonyTime", e.target.value)}
              />
            </div>
            <div>
              <Label>Expected Guests</Label>
              <Input
                type="number"
                value={formData.attendees}
                onChange={(e) => handleInputChange("attendees", e.target.value)}
                placeholder="Enter number of guests"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 px-8 py-3 text-lg" disabled={saving}>
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save Ceremony Details"}
          </Button>
        </div>
      </main>
    </div>
  )
}
