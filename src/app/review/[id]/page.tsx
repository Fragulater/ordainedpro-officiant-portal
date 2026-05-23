import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Heart, MapPin, Star } from "lucide-react";

import { OfficiantReviewForm } from "@/components/OfficiantReviewForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ReviewProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  city: string | null;
  state: string | null;
  headshot_url: string | null;
  rating: number | null;
  total_reviews: number | null;
};

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getDisplayName(profile: ReviewProfile) {
  return profile.business_name || profile.full_name || "Your Wedding Officiant";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function getProfile(id: string) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,user_id,full_name,business_name,city,state,headshot_url,rating,total_reviews")
    .or(`id.eq.${id},user_id.eq.${id}`)
    .maybeSingle<ReviewProfile>();

  if (error) {
    console.error("Unable to load review profile:", error);
    return null;
  }

  return data;
}

export default async function OfficiantReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const profile = await getProfile(id);

  if (!profile) {
    notFound();
  }

  const name = getDisplayName(profile);
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const coupleId = typeof query.couple === "string" ? query.couple : undefined;
  const suggestedName = typeof query.names === "string" ? query.names : "";
  const totalReviews = Number(profile.total_reviews || 0);
  const rating = Number(profile.rating || 0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-blue-700">
          <Heart className="h-7 w-7 fill-blue-600 text-blue-600" />
          <span className="text-lg font-bold">OrdainedPro</span>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Avatar className="h-24 w-24">
                {profile.headshot_url ? (
                  <AvatarImage src={profile.headshot_url} alt={name} />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-2xl text-white">
                    {getInitials(name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-2xl">Leave a Review</CardTitle>
            <CardDescription>
              Share your experience with {name}.
            </CardDescription>
            {location && (
              <div className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                {location}
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      totalReviews > 0 && index < Math.round(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {totalReviews > 0
                  ? `${rating.toFixed(1)} from ${totalReviews} ${
                      totalReviews === 1 ? "review" : "reviews"
                    }`
                  : "No reviews yet"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <OfficiantReviewForm
              officiantId={profile.user_id}
              officiantName={name}
              coupleId={coupleId}
              suggestedName={suggestedName}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
