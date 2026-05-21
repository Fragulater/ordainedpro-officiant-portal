import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { Award, DollarSign, MapPin, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

type DirectoryProfile = {
  id: string
  full_name: string | null
  business_name: string | null
  city: string | null
  state: string | null
  bio: string | null
  headshot_url: string | null
  years_experience: number | null
  price_min: number | null
  price_max: number | null
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) return null

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getName(profile: DirectoryProfile) {
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

function formatPrice(profile: DirectoryProfile) {
  const min = Number(profile.price_min || 0)
  const max = Number(profile.price_max || 0)

  if (min > 0 && max > 0 && min !== max) return `$${min} - $${max}`
  if (max > 0) return `Average $${max}`
  if (min > 0) return `Starting at $${min}`
  return "Contact for pricing"
}

async function getProfiles() {
  const supabase = getServiceClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,business_name,city,state,bio,headshot_url,years_experience,price_min,price_max")
    .eq("public_profile_enabled", true)
    .order("updated_at", { ascending: false })
    .limit(60)

  if (error) {
    console.error("Unable to load public officiant directory:", error)
    return []
  }

  return (data || []) as DirectoryProfile[]
}

export const metadata = {
  title: "Find a Wedding Officiant | OrdainedPro",
  description: "Search public OrdainedPro wedding officiant profiles, view contact information, galleries, pricing, experience, and request a quote.",
}

export default async function FindOfficiantPage() {
  const profiles = await getProfiles()

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-950">Find a Wedding Officiant</h1>
              <p className="mt-1 text-gray-600">Browse public OrdainedPro profiles and request a quote directly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {profiles.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => {
              const name = getName(profile)
              const location = [profile.city, profile.state].filter(Boolean).join(", ")

              return (
                <Card key={profile.id} className="border-blue-100 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20 shrink-0 border-4 border-blue-100">
                        {profile.headshot_url ? <AvatarImage src={profile.headshot_url} alt={name} /> : null}
                        <AvatarFallback className="bg-blue-600 text-xl text-white">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-xl font-bold text-gray-950">{name}</h2>
                        {profile.full_name && profile.business_name ? (
                          <p className="mt-1 truncate text-sm text-gray-600">{profile.full_name}</p>
                        ) : null}
                        {location ? (
                          <p className="mt-2 flex items-center text-sm text-gray-600">
                            <MapPin className="mr-1 h-4 w-4 shrink-0 text-blue-600" />
                            <span className="truncate">{location}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="px-2.5 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Award className="mr-1 h-3.5 w-3.5" />
                        {Number(profile.years_experience || 0)} years
                      </Badge>
                      <Badge className="px-2.5 py-1.5 bg-green-100 text-green-800 hover:bg-green-100">
                        <DollarSign className="mr-1 h-3.5 w-3.5" />
                        {formatPrice(profile)}
                      </Badge>
                    </div>

                    <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">
                      {profile.bio || "Professional wedding officiant ready to help couples create a meaningful ceremony."}
                    </p>

                    <Button asChild className="mt-5 w-full bg-blue-600 hover:bg-blue-700">
                      <Link href={`/officiants/${profile.id}`}>View Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-950">No public officiant profiles yet</h2>
              <p className="mt-2 text-gray-600">Profiles will appear here once officiants save their public profile information.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  )
}
