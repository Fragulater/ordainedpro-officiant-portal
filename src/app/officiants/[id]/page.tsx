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
  Star,
  Youtube,
} from "lucide-react"

import { PublicOfficiantGallery } from "@/components/PublicOfficiantGallery"
import { PublicOfficiantQuoteForm } from "@/components/PublicOfficiantQuoteForm"
import { PublicOfficiantReviews, type PublicReview } from "@/components/PublicOfficiantReviews"
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

type PublicProfileResult = {
  profile: PublicProfile | null;
  scripts: PublicScript[];
  reviews: PublicReview[];
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
  if (!supabase) return { profile: null, scripts: [] as PublicScript[], reviews: [] as PublicReview[] }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle()

  if (error) {
    console.error("Unable to load public officiant profile:", error)
    return { profile: null, scripts: [] as PublicScript[] }
  }

  if (!profile) return { profile: null, scripts: [] as PublicScript[], reviews: [] as PublicReview[] }

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

  const { data: reviews, error: reviewsError } = await supabase
    .from("officiant_reviews")
    .select("id,reviewer_name,rating,review_text,created_at")
    .eq("officiant_user_id", profile.user_id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50)

  if (reviewsError) {
    console.error("Unable to load public officiant reviews:", reviewsError)
  }

  return {
    profile: profile as PublicProfile,
    scripts: (scripts || []) as PublicScript[],
    reviews: (reviews || []) as PublicReview[],
  } satisfies PublicProfileResult
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
  const { profile, scripts, reviews } = await getProfile(id)

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
  const totalReviews = Number(profile.total_reviews || 0)
  const rating = Number(profile.rating || 0)

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg sm:min-h-[calc(100vh-2rem)] lg:h-[calc(100vh-2rem)] lg:min-h-0">
        <header className="border-b bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <Avatar className="h-20 w-20 border-4 border-blue-100 sm:h-24 sm:w-24">
                {profile.headshot_url ? <AvatarImage src={profile.headshot_url} alt={name} /> : null}
                <AvatarFallback className="bg-blue-600 text-2xl text-white">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">OrdainedPro Officiant</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{name}</h1>
                {profile.full_name && profile.business_name ? (
                  <p className="mt-1 text-sm text-gray-600">{profile.full_name}</p>
                ) : null}
                {location ? (
                  <p className="mt-2 flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                    {location}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-xl lg:justify-end">
              <Badge className="px-3 py-2 text-sm font-semibold bg-blue-100 text-blue-800 hover:bg-blue-100">
                <Award className="mr-1.5 h-4 w-4" />
                {Number(profile.years_experience || 0)} years
              </Badge>
              <Badge className="px-3 py-2 text-sm font-semibold bg-green-100 text-green-800 hover:bg-green-100">
                <DollarSign className="mr-1.5 h-4 w-4" />
                {formatPrice(profile)}
              </Badge>
              <Badge className="px-3 py-2 text-sm font-semibold bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                <Star className="mr-1.5 h-4 w-4 fill-yellow-500 text-yellow-500" />
                {totalReviews > 0
                  ? `${rating.toFixed(1)} (${totalReviews} ${totalReviews === 1 ? "review" : "reviews"})`
                  : "No reviews yet"}
              </Badge>
              <Badge className="px-3 py-2 text-sm font-semibold bg-purple-100 text-purple-800 hover:bg-purple-100">{travelDescription}</Badge>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[320px_1fr_360px]">
          <aside className="border-b bg-slate-50 p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="space-y-7">
              <PublicOfficiantReviews
                rating={rating}
                totalReviews={totalReviews}
                reviews={reviews}
              />

              <section>
                <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
                <div className="space-y-5 text-base">
                  {profile.phone ? (
                    <a className="flex items-center rounded-md py-1 text-gray-700 hover:text-blue-700" href={`tel:${profile.phone}`}>
                      <Phone className="mr-3 h-5 w-5 shrink-0" />
                      {profile.phone}
                    </a>
                  ) : null}
                  {profile.email ? (
                    <a className="flex items-center rounded-md py-1 text-gray-700 hover:text-blue-700" href={`mailto:${profile.email}`}>
                      <Mail className="mr-3 h-5 w-5 shrink-0" />
                      <span className="break-all">{profile.email}</span>
                    </a>
                  ) : null}
                  {profile.website ? (
                    <a className="flex items-center rounded-md py-1 text-gray-700 hover:text-blue-700" href={normalizeUrl(profile.website)} target="_blank" rel="noreferrer">
                      <Globe className="mr-3 h-5 w-5 shrink-0" />
                      Website
                    </a>
                  ) : null}
                </div>
                <div className="mt-8">
                  <h2 className="mb-4 text-base font-semibold uppercase tracking-wide text-gray-500">Social Media</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {profile.social_facebook ? <SocialLink href={profile.social_facebook} label="Facebook" icon={<Facebook className="h-5 w-5" />} /> : null}
                    {profile.social_instagram ? <SocialLink href={profile.social_instagram} label="Instagram" icon={<Instagram className="h-5 w-5" />} /> : null}
                    {profile.social_linkedin ? <SocialLink href={profile.social_linkedin} label="LinkedIn" icon={<Linkedin className="h-5 w-5" />} /> : null}
                    {profile.social_youtube ? <SocialLink href={profile.social_youtube} label="YouTube" icon={<Youtube className="h-5 w-5" />} /> : null}
                  </div>
                </div>
              </section>
            </div>
          </aside>

          <section className="space-y-5 overflow-y-auto p-4 sm:p-5">
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <h2 className="mb-2 text-lg font-bold text-gray-950">About</h2>
              <div className="max-h-48 overflow-y-auto pr-2 text-sm leading-6 text-gray-700">
                {profile.bio || "Professional wedding officiant ready to help couples create a meaningful ceremony."}
              </div>
            </div>

            {profile.photo_gallery && profile.photo_gallery.length > 0 ? (
              <div>
                <h2 className="mb-3 text-lg font-bold text-gray-950">Photo Gallery</h2>
                <PublicOfficiantGallery photos={profile.photo_gallery} name={name} />
              </div>
            ) : null}

            {profile.video_url ? (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-700" />
                  <h2 className="text-lg font-bold text-gray-950">Video</h2>
                </div>
                <video className="aspect-video max-h-[320px] w-full rounded-lg border bg-black object-contain shadow-sm" controls preload="metadata" playsInline>
                  <source src={profile.video_url} type="video/mp4" />
                  <source src={profile.video_url} />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : null}

            <div>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Wedding Scripts</h2>
                  <p className="text-sm text-gray-600">Scripts sold directly by this officiant.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={storeUrl} target="_blank" rel="noreferrer">
                    Full Store
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              {scripts.length > 0 ? (
                <div className="grid gap-3 xl:grid-cols-2">
                  {scripts.map((script) => (
                    <Card key={script.id} className="border-blue-100">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 font-semibold text-gray-950">{script.title}</h3>
                          <p className="mt-1 text-sm text-gray-600">{script.category || "Wedding Ceremony Script"}</p>
                          <p className="mt-2 text-lg font-bold text-gray-950">${Number(script.price || 0).toFixed(2)}</p>
                        </div>
                        <Button asChild className="shrink-0 bg-blue-600 hover:bg-blue-700" size="sm">
                          <a href={`${marketplaceBaseUrl}/script/${script.id}`} target="_blank" rel="noreferrer">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            View
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-5 text-sm text-gray-600">This officiant has not published scripts for sale yet.</CardContent>
                </Card>
              )}
            </div>
          </section>

          <aside className="border-t bg-slate-50 p-4 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <PublicOfficiantQuoteForm officiantId={profile.id} officiantName={name} />
          </aside>
        </div>
      </div>
    </main>
  )
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a
      className="flex items-center justify-center rounded-md border border-blue-100 bg-white p-3 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
      href={normalizeUrl(href)}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
    >
      {icon}
    </a>
  )
}
