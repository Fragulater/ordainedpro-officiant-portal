"use client"

import { supabase } from "@/supabase/utils/client"

export type VendorRecord = {
  id: number
  user_id: string
  business_type: string
  business_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

export type VendorInput = {
  businessType: string
  businessName: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

const toVendorRow = (userId: string, vendor: VendorInput) => ({
  user_id: userId,
  business_type: vendor.businessType.trim(),
  business_name: vendor.businessName.trim(),
  contact_name: vendor.contactName?.trim() || null,
  phone: vendor.phone?.trim() || null,
  email: vendor.email?.trim() || null,
  address: vendor.address?.trim() || null,
  notes: vendor.notes?.trim() || null,
})

export async function loadVendors(userId: string): Promise<{ ok: boolean; data?: VendorRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("officiant_vendors")
      .select("*")
      .eq("user_id", userId)
      .order("business_type", { ascending: true })
      .order("business_name", { ascending: true })

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data: data || [] }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}

export async function addVendor(userId: string, vendor: VendorInput): Promise<{ ok: boolean; data?: VendorRecord; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("officiant_vendors")
      .insert(toVendorRow(userId, vendor))
      .select()
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}

export async function updateVendor(vendorId: number, vendor: VendorInput): Promise<{ ok: boolean; data?: VendorRecord; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("officiant_vendors")
      .update({
        business_type: vendor.businessType.trim(),
        business_name: vendor.businessName.trim(),
        contact_name: vendor.contactName?.trim() || null,
        phone: vendor.phone?.trim() || null,
        email: vendor.email?.trim() || null,
        address: vendor.address?.trim() || null,
        notes: vendor.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId)
      .select()
      .single()

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}

export async function deleteVendor(vendorId: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("officiant_vendors")
      .delete()
      .eq("id", vendorId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}

