"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type SubscriptionTier = 'aspirant' | 'professional'

export interface SubscriptionLimits {
  max_ceremonies: number
  max_couples: number
  max_scripts: number
  max_documents: number
}

export interface SubscriptionFeatures {
  schedule: boolean
  build_scripts: boolean
  wedding_couple: boolean
  wedding_details: boolean
  add_ceremony: boolean
  my_profile: boolean
  messages: boolean
  files: boolean
  tasks: boolean
  contracts: boolean
  invoices: boolean
  earnings: boolean
  marketplace: boolean
  my_ceremonies: boolean
  calendar: boolean
  documents: boolean
}

export interface Subscription {
  tier: SubscriptionTier
  limits: SubscriptionLimits
  features: SubscriptionFeatures
}

interface SubscriptionContextType {
  subscription: Subscription | null
  isLoading: boolean
  canAccess: (feature: keyof SubscriptionFeatures) => boolean
  hasReachedLimit: (type: 'ceremonies' | 'couples' | 'scripts' | 'documents', currentCount: number) => boolean
  isProfessional: boolean
  isAspirant: boolean
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Default Aspirant subscription for offline mode
const defaultSubscription: Subscription = {
  tier: 'aspirant',
  limits: {
    max_ceremonies: 3,
    max_couples: 3,
    max_scripts: 10,
    max_documents: 5
  },
  features: {
    schedule: true,
    build_scripts: true,
    wedding_couple: true,
    wedding_details: true,
    add_ceremony: true,
    my_profile: true,
    messages: false,
    files: false,
    tasks: false,
    contracts: false,
    invoices: false,
    earnings: false,
    marketplace: false,
    my_ceremonies: false,
    calendar: false,
    documents: false
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(defaultSubscription)
  const [isLoading, setIsLoading] = useState(false)

  const fetchSubscription = async () => {
    setIsLoading(true)
    try {
      const { getSubscription } = await import('@/services/supabase-api')
      const { isSupabaseConfigured } = await import('@/lib/supabase')

      if (!isSupabaseConfigured()) {
        console.warn('⚠️ Supabase not configured, using default Aspirant subscription')
        setSubscription(defaultSubscription)
        setIsLoading(false)
        return
      }

      // For now, using a mock user ID - replace with actual auth user ID later
      const userId = 'mock-user-id'
      const data = await getSubscription(userId)

      if (!data) {
        console.log('ℹ️ No subscription found, using default Aspirant')
        setSubscription(defaultSubscription)
        setIsLoading(false)
        return
      }

      // Transform Supabase subscription to our format
      const subscription: Subscription = {
        tier: data.tier as SubscriptionTier,
        limits: data.tier === 'professional' ? {
          max_ceremonies: -1,
          max_couples: -1,
          max_scripts: -1,
          max_documents: -1
        } : {
          max_ceremonies: 3,
          max_couples: 3,
          max_scripts: 10,
          max_documents: 5
        },
        features: data.tier === 'professional' ? {
          schedule: true,
          build_scripts: true,
          wedding_couple: true,
          wedding_details: true,
          add_ceremony: true,
          my_profile: true,
          messages: true,
          files: true,
          tasks: true,
          contracts: true,
          invoices: true,
          earnings: true,
          marketplace: true,
          my_ceremonies: true,
          calendar: true,
          documents: true
        } : {
          schedule: true,
          build_scripts: true,
          wedding_couple: true,
          wedding_details: true,
          add_ceremony: true,
          my_profile: true,
          messages: false,
          files: false,
          tasks: false,
          contracts: false,
          invoices: false,
          earnings: false,
          marketplace: false,
          my_ceremonies: false,
          calendar: false,
          documents: false
        }
      }

      setSubscription(subscription)
      console.log('✅ Loaded subscription from Supabase:', subscription.tier)
    } catch (error) {
      console.warn('⚠️ Using default Aspirant subscription (Supabase not available)', error)
      setSubscription(defaultSubscription)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  const canAccess = (feature: keyof SubscriptionFeatures): boolean => {
    if (!subscription) return false
    return subscription.features[feature] === true
  }

  const hasReachedLimit = (
    type: 'ceremonies' | 'couples' | 'scripts' | 'documents',
    currentCount: number
  ): boolean => {
    if (!subscription) return false

    const limitKey = `max_${type}` as keyof SubscriptionLimits
    const max = subscription.limits[limitKey]

    // -1 means unlimited (Professional tier)
    if (max === -1) return false

    return currentCount >= max
  }

  const isProfessional = subscription?.tier === 'professional'
  const isAspirant = subscription?.tier === 'aspirant'

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    canAccess,
    hasReachedLimit,
    isProfessional,
    isAspirant,
    refreshSubscription: fetchSubscription
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
