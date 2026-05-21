import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import {
  Award,
  DollarSign,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Play,
  ShoppingCart,
  Youtube,
} from "lucide-react"

import { PublicOfficiantQuoteForm } from "@/components/PublicOfficiantQuoteForm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

type PublicProfile = {
  id: string
  user_id: string
  full_name: string | null
  business_name: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  website: string | null
  bio: string | null
  headshot_url: string | null
  years_experience: number | null
  rating: number | null
  total_reviews: number | null
  price_min: number | null
  price_max: number | null
  social_facebook: string | null
  social_instagram: string | null
  social_linkedin: string | null
  social_youtube: string | null
  photo_gallery: string[] | null
  video_url: string | null
  travel_radius_miles?: number | null
  travel_state?: string | null
}

type PublicScript = {
  id: number
  title: string
  category: string | null
  price: number | null
  marketplace_visibility?: string | null
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getDisplayName(profile: PublicProfile) {
  return profile.business_name || profile.full_name || "Wedding Officiant"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatPrice(profile: PublicProfile) {
  const min = Number(profile.price_min || 0)
  const max = Number(profile.price_max || 0)

  if (min > 0 && max > 0 && min !== max) return `$${min} - $${max}`
  if (max > 0) return `Average $${max}`
  if (min > 0) return `Starting at $${min}`
  return "Contact for pricing"
}

function normalizeUrl(url: string) {
  if (!url) return ""
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

async function getProfile(id: string) {
  const supabase = getServiceClient()
  if (!supabase) return { profile: null, scripts: [] as PublicScript[] }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle()

  if (error) {
    console.error("Unable to load public officiant profile:", error)
    return { profile: null, scripts: [] as PublicScript[] }
  }

  if (!profile) return { profile: null, scripts: [] as PublicScript[] }

  const { data: scripts, error: scriptsError } = await supabase
    .from("scripts")
    .select("id,title,category,price,marketplace_visibility")
    .eq("user_id", profile.user_id)
    .eq("is_published", true)
    .neq("marketplace_visibility", "private")
    .order("updated_at", { ascending: false })
    .limit(24)

  if (scriptsError) {
    console.error("Unable to load public officiant scripts:", scriptsError)
  }

  return {
    profile: profile as PublicProfile,
    scripts: (scripts || []) as PublicScript[],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { profile } = await getProfile(id)

  if (!profile) {
    return {
      title: "Officiant Not Found | OrdainedPro",
    }
  }

  const name = getDisplayName(profile)
  const location = [profile.city, profile.state].filter(Boolean).join(", ")

  return {
    title: `${name} | Wedding Officiant${location ? ` in ${location}` : ""}`,
    description:
      profile.bio ||
      `View ${name}'s wedding officiant profile, pricing, contact information, gallery, videos, and ceremony scripts.`,
    openGraph: {
      title: `${name} | Wedding Officiant`,
      description:
        profile.bio ||
        `Contact ${name}, view wedding ceremony work, request a quote, and browse available ceremony scripts.`,
      images: profile.headshot_url ? [profile.headshot_url] : undefined,
    },
  }
}

export default async function PublicOfficiantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile, scripts } = await getProfile(id)

  if (!profile) {
    notFound()
  }

  const name = getDisplayName(profile)
  const location = [profile.city, profile.state].filter(Boolean).join(", ")
  const travelState = profile.travel_state || profile.state
  const travelDescription =
    profile.travel_radius_miles && travelState
      ? `Travels up to ${profile.travel_radius_miles} miles in ${travelState}`
      : travelState
        ? `Available for weddings in ${travelState}`
        : "Travel details available on request"
  const marketplaceBaseUrl = process.env.NEXT_PUBLIC_MARKETPLACE_URL || "https://scripts.ordainedpro.com"
  const storeUrl = `${marketplaceBaseUrl}/store/${profile.user_id}`

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6 sm:flex-row">
            <Avatar className="h-32 w-32 border-4 border-blue-100">
              {profile.headshot_url ? <AvatarImage src={profile.headshot_url} alt={name} /> : null}
              <AvatarFallback className="bg-blue-600 text-3xl text-white">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-700">OrdainedPro Officiant</p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-950">{name}</h1>
                {profile.full_name && profile.business_name ? (
                  <p className="mt-1 text-lg text-gray-600">{profile.full_name}</p>
                ) : null}
                {location ? (
                  <p className="mt-3 flex items-center text-gray-600">
                    <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                    {location}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  <Award className="mr-1 h-3 w-3" />
                  {Number(profile.years_experience || 0)} years experience
                </Badge>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <DollarSign className="mr-1 h-3 w-3" />
                  {formatPrice(profile)}
                </Badge>
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{travelDescription}</Badge>
              </div>

              <p className="max-w-3xl text-base leading-7 text-gray-700">
                {profile.bio || "Professional wedding officiant ready to help couples create a meaningful ceremony."}
              </p>
            </div>
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Reach out directly or request a quote below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {profile.phone ? (
                <a className="flex items-center text-gray-700 hover:text-blue-700" href={`tel:${profile.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  {profile.phone}
                </a>
              ) : null}
              {profile.email ? (
                <a className="flex items-center text-gray-700 hover:text-blue-700" href={`mailto:${profile.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  {profile.email}
                </a>
              ) : null}
              {profile.website ? (
                <a className="flex items-center text-gray-700 hover:text-blue-700" href={normalizeUrl(profile.website)} target="_blank" rel="noreferrer">
                  <Globe className="mr-2 h-4 w-4" />
                  Website
                </a>
              ) : null}
              <div className="flex gap-3 pt-2">
                {profile.social_facebook ? <SocialLink href={profile.social_facebook} label="Facebook" icon={<Facebook className="h-5 w-5" />} /> : null}
                {profile.social_instagram ? <SocialLink href={profile.social_instagram} label="Instagram" icon={<Instagram className="h-5 w-5" />} /> : null}
                {profile.social_linkedin ? <SocialLink href={profile.social_linkedin} label="LinkedIn" icon={<Linkedin className="h-5 w-5" />} /> : null}
                {profile.social_youtube ? <SocialLink href={profile.social_youtube} label="YouTube" icon={<Youtube className="h-5 w-5" />} /> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {profile.video_url ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-700" />
                <h2 className="text-2xl font-bold text-gray-950">Introduction Video</h2>
              </div>
              <video className="aspect-video w-full rounded-lg border bg-black shadow-sm" src={profile.video_url} controls />
            </section>
          ) : null}

          {profile.photo_gallery && profile.photo_gallery.length > 0 ? (
            <section>
              <h2 className="mb-4 text-2xl font-bold text-gray-950">Photo Gallery</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.photo_gallery.map((photo, index) => (
                  <img
                    key={`${photo}-${index}`}
                    src={photo}
                    alt={`${name} wedding ceremony photo ${index + 1}`}
                    className="aspect-[4/3] w-full rounded-lg border object-cover shadow-sm"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-950">Wedding Scripts</h2>
                <p className="text-gray-600">Browse scripts sold directly by this officiant.</p>
              </div>
              <Button asChild variant="outline">
                <a href={storeUrl} target="_blank" rel="noreferrer">
                  View Full Script Store
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {scripts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {scripts.map((script) => (
                  <Card key={script.id} className="border-blue-100">
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">{script.title}</CardTitle>
                      <CardDescription>{script.category || "Wedding Ceremony Script"}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3">
                      <p className="text-xl font-bold text-gray-950">${Number(script.price || 0).toFixed(2)}</p>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700">
                        <a href={`${marketplaceBaseUrl}/script/${script.id}`} target="_blank" rel="noreferrer">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          View Script
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-gray-600">This officiant has not published scripts for sale yet.</CardContent>
              </Card>
            )}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <PublicOfficiantQuoteForm officiantId={profile.id} officiantName={name} />
        </aside>
      </div>
    </main>
  )
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      className="rounded-md border border-blue-100 p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
      href={normalizeUrl(href)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
    >
      {icon}
    </a>
  )
}
