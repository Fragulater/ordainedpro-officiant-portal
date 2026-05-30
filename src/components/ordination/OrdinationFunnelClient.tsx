"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpenText,
  Check,
  Crown,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const standardCheckoutUrl =
  process.env.NEXT_PUBLIC_ORDINATION_STANDARD_CHECKOUT_URL ||
  "/subscription/checkout?plan=professional&source=ordination";

const discountCheckoutUrl =
  process.env.NEXT_PUBLIC_ORDINATION_DISCOUNT_CHECKOUT_URL ||
  "/subscription/checkout?plan=aspirant&offer=ordination-1995&source=ordination";

function getParam(searchParams: URLSearchParams, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return fallback;
}

function buildQuery(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const name = getParam(searchParams, ["name", "fullName", "full_name"]);
  const date = getParam(searchParams, ["date", "ordinationDate", "ordination_date"]);
  const state = getParam(searchParams, ["state"]);
  const id = getParam(searchParams, ["id", "certificateId", "certificate_id"]);
  const email = getParam(searchParams, ["email"]);

  if (name) params.set("name", name);
  if (date) params.set("date", date);
  if (state) params.set("state", state);
  if (id) params.set("id", id);
  if (email) params.set("email", email);

  return params.toString();
}

function buildFunnelUrl(path: string, searchParams: URLSearchParams) {
  const query = buildQuery(searchParams);
  return query ? `${path}?${query}` : path;
}

function buildCertificateDownloadUrl(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const name = getParam(searchParams, ["name", "fullName", "full_name"]);
  const date = getParam(searchParams, ["date", "ordinationDate", "ordination_date"]);
  const state = getParam(searchParams, ["state"], "Arizona");
  const id = getParam(searchParams, ["id", "certificateId", "certificate_id"]);

  params.set("name", name || "Ordained Officiant");
  params.set("date", date || new Date().toISOString().slice(0, 10));
  params.set("state", state);
  if (id) params.set("id", id);

  return `/api/ordination/certificate?${params.toString()}`;
}

function withReturnTo(url: string, returnTo: string) {
  if (url.startsWith("/")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}returnTo=${encodeURIComponent(returnTo)}`;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("returnTo", returnTo);
    return parsed.toString();
  } catch {
    return url;
  }
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toTitleCaseName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) =>
      part
        .split("-")
        .map((segment) =>
          segment ? `${segment.charAt(0).toUpperCase()}${segment.slice(1)}` : segment
        )
        .join("-")
    )
    .join(" ");
}

function getFirstName(name: string) {
  return toTitleCaseName(name).split(/\s+/)[0] || "";
}

function getCopyVariant(seed: string, override?: string | null) {
  if (override === "prepared" || override === "story") return override;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash % 2 === 0 ? "prepared" : "story";
}

function useWordReveal(text: string, intervalMs = 95) {
  const words = useMemo(() => text.split(" "), [text]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisibleCount(words.length);
      return;
    }

    const timer = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= words.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, words]);

  return {
    isComplete: visibleCount >= words.length,
    text: words.slice(0, visibleCount).join(" "),
    visibleCount,
  };
}

function useFunnelLinks() {
  const searchParams = useSearchParams();
  const finalPageUrl = useMemo(
    () => buildFunnelUrl("/ordination/next-step", searchParams),
    [searchParams]
  );
  const certificateDownloadUrl = useMemo(
    () => buildCertificateDownloadUrl(searchParams),
    [searchParams]
  );
  const standardUrl = useMemo(
    () => withReturnTo(standardCheckoutUrl, finalPageUrl),
    [finalPageUrl]
  );
  const discountUrl = useMemo(
    () => withReturnTo(discountCheckoutUrl, finalPageUrl),
    [finalPageUrl]
  );

  return {
    certificateDownloadUrl,
    discountUrl,
    finalPageUrl,
    searchParams,
    standardUrl,
  };
}

function useCertificatePreviewData(searchParams: URLSearchParams) {
  const rawOrdainedName = getParam(searchParams, ["name", "fullName", "full_name"]);
  const ordainedName = rawOrdainedName ? toTitleCaseName(rawOrdainedName) : "";
  const ordinationDate = getParam(searchParams, ["date", "ordinationDate", "ordination_date"]);
  const ordinationState = getParam(searchParams, ["state"], "Arizona");
  const certificateId =
    getParam(searchParams, ["id", "certificateId", "certificate_id"]) ||
    (ordainedName && ordinationDate
      ? `MOL-${ordainedName.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase()}-${ordinationDate.replace(/[^0-9]/g, "")}`
      : "Certificate ID");

  return { certificateId, ordainedName, ordinationDate, ordinationState };
}

const benefits = [
  {
    icon: BookOpenText,
    title: "Write ceremony scripts with confidence",
    copy: "Create personalized scripts for weddings, vow renewals, celebrations of life, quinceaneras, baby blessings, and other officiant services.",
  },
  {
    icon: Users,
    title: "Keep ceremony details organized",
    copy: "Track clients, dates, notes, ceremony details, payments, contracts, and documents in one place.",
  },
  {
    icon: Sparkles,
    title: "Match the tone of the moment",
    copy: "Build scripts around length, tone, faith level, love story depth, readings, vows, unity moments, and traditions.",
  },
];

const reviews = [
  {
    initials: "JF",
    name: "Jeremy F.",
    avatarClass: "from-blue-700 to-blue-400",
    quote:
      "Utilizing Ordained Pro's Script Builder has revolutionized my approach to officiating weddings! Their tools are phenomenal.",
  },
  {
    initials: "JV",
    name: "Pastor Jim V.",
    avatarClass: "from-purple-700 to-fuchsia-400",
    quote:
      "Utilizing Ordained Pro's Script Builder has truly been a blessing in my ministry. This tool allows me to prayerfully craft each wedding ceremony with care, clarity, and heartfelt meaning, ensuring that every couple's special day reflects the love, commitment, and faith that brought them together. It has enriched my ability to serve and shepherd couples as they begin their journey in marriage.",
  },
  {
    initials: "AS",
    name: "Antwan S.",
    avatarClass: "from-pink-600 to-purple-500",
    quote:
      "This platform is a lifesaver! I can track all my couples, dates, and locations in one place, and even share scripts with the couples directly. It's helped me stay on top of everything while focusing on creating memorable ceremonies. I'm more organized than ever!",
  },
];

function CertificatePreview({ className = "" }: { className?: string }) {
  const { searchParams } = useFunnelLinks();
  const { certificateId, ordainedName, ordinationDate, ordinationState } =
    useCertificatePreviewData(searchParams);

  return (
    <div className={`rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm ${className}`}>
      <div className="relative overflow-hidden rounded-md border border-blue-200 bg-white p-6 text-center shadow-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 z-10 flex rotate-[-24deg] items-center justify-center text-6xl font-black tracking-[0.16em] text-blue-600/15">
          PREVIEW
        </div>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-md bg-[#b9c9c1]">
          <img
            src="/ministries-of-love-logo.svg"
            alt="Ministries of Love"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="border-y border-slate-200 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
            Ministries of Love
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Certificate of Ordination
          </h2>
          <p className="mx-auto mt-5 max-w-sm border-b border-slate-300 pb-3 text-2xl font-black text-slate-950">
            {ordainedName || "Your Name"}
          </p>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-600">
            Licensed minister credentials issued on{" "}
            <span className="font-bold text-slate-950">
              {ordinationDate ? formatDate(ordinationDate) : "your ordination date"}
            </span>{" "}
            in <span className="font-bold text-slate-950">{ordinationState}</span>.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 text-center text-xs text-slate-600">
          <div className="border-t border-slate-300 pt-2">
            <img
              src="/daniel_salerno_signature_vector.svg"
              alt="Daniel Salerno signature"
              className="mx-auto h-8 w-40 object-contain"
            />
            <p>Arbiter of Matrimony</p>
          </div>
          <div className="border-t border-slate-300 pt-4">
            <p className="font-bold text-slate-950">{certificateId}</p>
            <p className="mt-2">Certificate ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsSection() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {reviews.map((review) => (
        <article
          key={review.name}
          className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${review.avatarClass} text-sm font-black text-white shadow-sm`}
            >
              {review.initials}
            </div>
            <div>
              <p className="font-black text-slate-900">{review.name}</p>
              <p className="text-amber-400" aria-label="5 star review">
                *****
              </p>
            </div>
          </div>
          <p className="px-4 py-4 text-base font-semibold leading-6 text-slate-400">
            {review.quote}
          </p>
        </article>
      ))}
    </div>
  );
}

function ScriptComparisonBanner() {
  const { searchParams } = useFunnelLinks();
  const { certificateId, ordainedName } = useCertificatePreviewData(searchParams);
  const firstName = getFirstName(ordainedName);
  const copyVariant = getCopyVariant(
    `${ordainedName}-${certificateId}`,
    searchParams.get("copyVariant")
  );
  const displayName = firstName || "You";
  const guidedCopy =
    copyVariant === "prepared"
      ? `${displayName}, becoming ordained is an exciting first step, but most new officiants quickly realize the same thing: "I'm official... but what do I actually say?" OrdainedPro was built to help you go from newly ordained to fully prepared. Whether you are officiating one wedding for a close friend or building a professional officiant business, OrdainedPro gives you the tools to create meaningful ceremonies, stay organized, and show up with confidence.\n\nWith OrdainedPro, you can create and save ceremony scripts, collect couple details, manage tasks, organize meetings, track payments, use contracts, and keep everything in one clean dashboard. No more scattered notes. No more blank-page panic. No more wondering if you are forgetting something important.\n\nYour ordination gives you the authority to perform the ceremony. OrdainedPro helps you deliver it beautifully. Start with the tools you need today, and grow into the officiant you want to become.`
      : `${displayName}, you do not need to be a professional speaker to create a beautiful ceremony. You simply need the right guidance, the right structure, and a little help bringing the couple's story to life. A meaningful ceremony is not about sounding perfect; it is about speaking with care, honoring the moment, and helping everyone feel the love that brought this day together.\n\nThe couple chose you because you mean something to them. They trusted you with this moment because your presence matters, your voice matters, and your connection to them is part of what makes their ceremony so special. OrdainedPro helps you turn that trust into a ceremony that feels personal, prepared, and unforgettable.\n\nInstead of wondering what to say or worrying about how everything should flow, you can walk in knowing you have a ceremony built with care. From the opening words to the vows, ring exchange, love story, and final pronouncement, OrdainedPro gives you the tools to create a ceremony that feels organized, heartfelt, and worthy of the moment.`;
  const revealedCopy = useWordReveal(guidedCopy);
  const revealedParagraphs = revealedCopy.text.split("\n\n");

  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <article
        className="rounded-lg border border-blue-100 bg-white p-8 shadow-sm lg:col-span-2"
        data-copy-variant={copyVariant}
      >
        <div className="space-y-5 text-[1.2rem] leading-9 text-slate-700">
          <p aria-live="polite">
            {firstName && revealedCopy.visibleCount > 0 ? (
              <>
                <span className="text-[1.45rem] font-semibold text-slate-950">
                  {firstName}
                </span>
                {revealedParagraphs[0]?.slice(firstName.length)}
              </>
            ) : (
              revealedParagraphs[0] || ""
            )}
            {!revealedCopy.isComplete ? (
              <span className="ml-1 inline-block h-6 w-0.5 translate-y-1 bg-blue-500" />
            ) : null}
          </p>
          {revealedParagraphs[1] ? <p>{revealedParagraphs[1]}</p> : null}
          {revealedParagraphs[2] ? <p>{revealedParagraphs[2]}</p> : null}
        </div>
      </article>

      <article className="flex min-h-[360px] flex-col rounded-lg border border-blue-300 bg-blue-100 p-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-700">
          <Award className="h-4 w-4" />
          Ceremony Starter
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-950">
          Perfect for one special ceremony.
        </h2>
        <div className="mt-5 space-y-5 text-[1.2rem] leading-9 text-slate-700">
          <p>
            Perfect for newly ordained officiants preparing for one special
            ceremony.
          </p>
          <p>
            You may only officiate once, but the couple will remember it
            forever. Ceremony Starter gives you three months of access to the
            tools you need to feel prepared, organized, and confident.
          </p>
          <p>
            Create a meaningful ceremony script, gather the couple's details,
            explore vow and ring exchange wording, and build a ceremony that
            sounds like it came from the heart, not from a last-minute internet
            search.
          </p>
          <p>
            For just $29, you can stop wondering what to say and start building
            a ceremony the couple will never forget.
          </p>
        </div>
      </article>

      <article className="flex min-h-[360px] flex-col rounded-lg border border-blue-300 bg-blue-100 p-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-700">
          <Heart className="h-4 w-4" />
          Built for real ceremonies
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-950">
          From short ceremonies to detailed long-form scripts.
        </h2>
        <div className="mt-5 space-y-5 text-[1.2rem] leading-9 text-slate-700">
          <p>
            Many basic AI tools create shorter, more general ceremony drafts
            only lasting about 5 minutes.
          </p>
          <p>
            Many full wedding ceremonies are around 20 to 30 minutes.
          </p>
          <p>
            OrdainedPro is built specifically for officiants and can help
            generate detailed, personalized ceremonies up to approximately 7,000
            words.
          </p>
          <p>
            This can support ceremonies up to approximately 45 minutes depending
            on speaking pace and ceremony elements.
          </p>
        </div>
      </article>
    </section>
  );
}

function BenefitTiles() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {benefits.map((benefit) => (
        <article
          key={benefit.title}
          className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm"
        >
          <benefit.icon className="h-7 w-7 text-blue-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-950">
            {benefit.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {benefit.copy}
          </p>
        </article>
      ))}
    </div>
  );
}

function PlansSection() {
  const { discountUrl, standardUrl } = useFunnelLinks();

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
      <article className="rounded-lg border-2 border-blue-500 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Aspirant</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Built for newly ordained officiants getting started.
            </p>
          </div>
          <Badge className="bg-blue-500 text-white">Starter</Badge>
        </div>
        <div className="mt-4">
          <span className="text-4xl font-black text-slate-950">$29.95</span>
          <span className="text-slate-600">/3 months</span>
        </div>
        <div className="mt-5 space-y-3 text-sm text-slate-700">
          {[
            "Up to 3 ceremonies",
            "Award-winning script builder",
            "Basic scheduling",
            "Profile management",
            "English and Spanish scripts only",
            "Buy scripts from the marketplace",
            "Share scripts with clients",
            "Public officiant profile",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" />
              <span>{item}</span>
            </div>
          ))}
          {[
            "Review requests and star ratings",
            "Invoices & payments",
            "Sell scripts in the marketplace",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-slate-400">
              <span className="mt-0.5 text-lg leading-none">x</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Button asChild className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-700">
          <Link href={discountUrl}>Start Aspirant</Link>
        </Button>
      </article>

      <article className="relative overflow-hidden rounded-lg border-2 border-purple-500 bg-white p-6 shadow-sm">
        <div className="absolute right-0 top-0 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-bold text-white">
          POPULAR
        </div>
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-black text-slate-950">Professional</h2>
        </div>
        <div className="mt-4">
          <span className="text-4xl font-black text-slate-950">$29</span>
          <span className="text-slate-600">/month</span>
        </div>
        <div className="mt-5 space-y-3 text-sm text-slate-700">
          {[
            "Unlimited ceremonies",
            "Advanced script builder",
            "Any supported language",
            "Full messaging system",
            "Contract management",
            "Invoice & payment tracking",
            "Anniversary tracking",
            "Earnings dashboard",
            "Public officiant page, ratings, and reviews",
            "Social media, photos, and video uploads",
            "Vendor tracking",
            "Buy and sell scripts",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-green-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <Button asChild className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
          <Link href={standardUrl}>
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Professional
          </Link>
        </Button>
      </article>
    </div>
  );
}

function DeclineDialogs({
  declineStep,
  setDeclineStep,
}: {
  declineStep: "none" | "first" | "discount";
  setDeclineStep: (step: "none" | "first" | "discount") => void;
}) {
  const { discountUrl, finalPageUrl, searchParams, standardUrl } = useFunnelLinks();
  const { ordainedName } = useCertificatePreviewData(searchParams);
  const firstName = getFirstName(ordainedName);

  return (
    <>
      <Dialog open={declineStep === "first"} onOpenChange={(open) => !open && setDeclineStep("none")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{firstName ? `${firstName}, are you sure?` : "Are You Sure?"}</DialogTitle>
            <DialogDescription className="leading-6">
              Your certificate is free either way. Before you continue, take one
              more moment to review how OrdainedPro can help you prepare the
              ceremony, write with confidence, organize the details, and show up
              ready for the couple who trusted you with this moment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineStep("discount")}>
              No Thanks, Continue
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href={standardUrl}>Yes, I Want to Try OrdainedPro</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={declineStep === "discount"} onOpenChange={(open) => !open && setDeclineStep("none")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Special Newly Ordained Officiant Offer</DialogTitle>
            <DialogDescription className="leading-6">
              Before you download your certificate, here is a special newly
              ordained officiant offer: try OrdainedPro for only $19.95 for your
              first 3 months.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild variant="outline">
              <Link href={finalPageUrl}>No Thanks, Take Me to My Certificate</Link>
            </Button>
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href={discountUrl}>Claim My $19.95 Offer</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function OrdinationOfferClient() {
  const { finalPageUrl, standardUrl } = useFunnelLinks();
  const { searchParams } = useFunnelLinks();
  const { ordainedName } = useCertificatePreviewData(searchParams);
  const firstName = getFirstName(ordainedName);
  const [declineStep, setDeclineStep] = useState<"none" | "first" | "discount">("none");
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);

  return (
    <main className="min-h-screen bg-[#f3f8ff] text-slate-950">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-8 md:px-8 lg:pb-10 lg:pt-12">
          <div>
            <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-blue-200 bg-blue-50 px-7 py-3 text-xl font-semibold text-blue-700">
              <Award className="h-7 w-7" />
              Ministries of Love Ordination
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 md:text-5xl">
              {firstName
                ? `Congratulations, ${firstName}, you are ordained.`
                : "Congratulations, you are ordained."}
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <ScriptComparisonBanner />

        <div className="mx-auto mt-10 max-w-5xl">
          <CertificatePreview />
        </div>

        <section className="mt-10 rounded-lg border border-blue-100 bg-white p-8 shadow-sm">
          <p className="max-w-5xl text-[1.2rem] leading-9 text-slate-700">
            {firstName ? `${firstName}, your` : "Your"} free digital
            certificate from Ministries of Love is ready. Before you download
            it, take a moment to review how OrdainedPro can help you prepare,
            write, and perform ceremonies with confidence.
          </p>
          <p className="mt-6 max-w-5xl rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-base leading-7 text-amber-900">
            Your certificate is free either way. This page simply gives you a
            chance to explore officiant tools before continuing.
          </p>
        </section>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 bg-blue-600 px-6 hover:bg-blue-700">
            <Link href={standardUrl}>
              Start Writing Professional Scripts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 border-blue-200 bg-white px-6 text-blue-700 hover:bg-blue-50"
            disabled={!reviewAcknowledged}
            onClick={() => setDeclineStep("first")}
          >
            No Thanks, Continue to My Certificate
          </Button>
        </div>

        <label className="mx-auto mt-4 flex max-w-3xl items-start justify-center gap-3 rounded-lg border border-blue-100 bg-white px-5 py-4 text-left text-sm font-semibold leading-6 text-slate-700 shadow-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600"
            checked={reviewAcknowledged}
            onChange={(event) => setReviewAcknowledged(event.target.checked)}
          />
          <span>
            I understand my certificate is free, and I have reviewed how
            OrdainedPro can help me prepare, write, and perform a meaningful
            ceremony.
          </span>
        </label>

        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-slate-600">
          The certificate remains free. Once you confirm the review above, the
          next step will still give you access to view and download your
          certificate.
        </p>
      </section>

      <DeclineDialogs declineStep={declineStep} setDeclineStep={setDeclineStep} />
    </main>
  );
}

export default function OrdinationFunnelClient() {
  const { certificateDownloadUrl, standardUrl } = useFunnelLinks();

  return (
    <main className="min-h-screen bg-[#f3f8ff] text-slate-950">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="mb-8">
          <ReviewsSection />
        </div>

        <PlansSection />

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 bg-blue-600 px-6 hover:bg-blue-700">
            <Link href={standardUrl}>
              Start Writing Professional Scripts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 border-blue-200 bg-white px-6 text-blue-700 hover:bg-blue-50">
            <a href={certificateDownloadUrl}>No Thanks, Continue to My Certificate</a>
          </Button>
        </div>

        <div className="mt-6">
          <BenefitTiles />
        </div>

        <section className="mt-8 rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Becoming ordained is the first step.
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            Being prepared is what helps you create a ceremony people remember.
            OrdainedPro gives new officiants a practical workspace for scripts,
            client details, notes, ceremony timelines, documents, and the work
            that happens before the ceremony begins.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Professional script builder",
              "Couple and client organization",
              "Ceremony length and tone controls",
              "Vows, readings, and unity options",
              "Documents and contracts",
              "Payments and reminders",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 bg-blue-600 hover:bg-blue-700">
              <Link href={standardUrl}>Try OrdainedPro Today</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 border-slate-200">
              <a href={certificateDownloadUrl}>View or Download My Certificate</a>
            </Button>
          </div>
        </section>
      </section>
    </main>
  );
}
