"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/supabase/utils/client'

export type SubscriptionTier = 'aspirant' | 'professional' | 'data_retention' | 'none'
export type SubscriptionStatus = 'active' | 'canceled' | 'data_retention' | 'expired' | 'none'

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
  status: SubscriptionStatus
  limits: SubscriptionLimits
  features: SubscriptionFeatures
  billingCycleEnd?: string
  daysRemaining?: number
  priceCents?: number
  canceledAt?: string
  dataDeletionScheduledAt?: string
  daysUntilDataDeletion?: number
  squareSubscriptionId?: string
  squareCustomerId?: string
}

interface SubscriptionContextType {
  subscription: Subscription | null
  isLoading: boolean
  canAccess: (feature: keyof SubscriptionFeatures) => boolean
  hasReachedLimit: (type: 'ceremonies' | 'couples' | 'scripts' | 'documents', currentCount: number) => boolean
  isProfessional: boolean
  isAspirant: boolean
  isDataRetention: boolean
  isCanceled: boolean
  canAccessFeatures: boolean
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Default Aspirant subscription for offline mode
const defaultSubscription: Subscription = {
  tier: 'aspirant',
  status: 'active',
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
    my_ceremonies: true,
    calendar: true,
    documents: true
  }
}

// Professional subscription
const professionalSubscription: Subscription = {
  tier: 'professional',
  status: 'active',
  limits: {
    max_ceremonies: -1,
    max_couples: -1,
    max_scripts: -1,
    max_documents: -1
  },
  features: {
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
  }
}

// Data retention subscription (limited access)
const dataRetentionSubscription: Subscription = {
  tier: 'data_retention',
  status: 'data_retention',
  limits: {
    max_ceremonies: 0,
    max_couples: 0,
    max_scripts: 0,
    max_documents: 0
  },
  features: {
    schedule: false,
    build_scripts: false,
    wedding_couple: false,
    wedding_details: false,
    add_ceremony: false,
    my_profile: true,
    messages: false,
    files: false,
    tasks: false,
    contracts: false,
    invoices: false,
    earnings: false,
    marketplace: false,
    my_ceremonies: true,
    calendar: false,
    documents: false
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubscription = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setSubscription(defaultSubscription)
        setIsLoading(false)
        return
      }

      const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error || !subData) {
        setSubscription({ ...defaultSubscription })
        setIsLoading(false)
        return
      }

      const now = new Date()
      const billingEnd = subData.billing_cycle_end ? new Date(subData.billing_cycle_end) : null
      const daysRemaining = billingEnd
        ? Math.max(0, Math.ceil((billingEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0

      let baseSubscription: Subscription
      switch (subData.plan_type) {
        case 'professional':
          baseSubscription = { ...professionalSubscription }
          break
        case 'data_retention':
          baseSubscription = { ...dataRetentionSubscription }
          break
        default:
          baseSubscription = { ...defaultSubscription }
      }

      baseSubscription.status = subData.status as SubscriptionStatus
      baseSubscription.billingCycleEnd = subData.billing_cycle_end
      baseSubscription.daysRemaining = daysRemaining
      baseSubscription.priceCents = subData.price_cents
      baseSubscription.canceledAt = subData.canceled_at
      baseSubscription.dataDeletionScheduledAt = subData.data_deletion_scheduled_at
      baseSubscription.squareSubscriptionId = subData.square_subscription_id
      baseSubscription.squareCustomerId = subData.square_customer_id

      if (subData.data_deletion_scheduled_at) {
        const deletionDate = new Date(subData.data_deletion_scheduled_at)
        baseSubscription.daysUntilDataDeletion = Math.max(0,
          Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      }

      setSubscription(baseSubscription)
    } catch (error) {
      console.warn('Error loading subscription:', error)
      setSubscription(defaultSubscription)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => fetchSubscription())
    return () => { authSub?.unsubscribe() }
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
  const isDataRetention = subscription?.status === 'data_retention'
  const isCanceled = subscription?.status === 'canceled'
  const canAccessFeatures = subscription?.status === 'active' ||
    subscription?.status === 'data_retention' ||
    (subscription?.status === 'canceled' && (subscription?.daysRemaining || 0) > 0)

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    canAccess,
    hasReachedLimit,
    isProfessional,
    isAspirant,
    isDataRetention,
    isCanceled,
    canAccessFeatures,
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
