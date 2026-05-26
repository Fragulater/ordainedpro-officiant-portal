"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookOpenText,
  Check,
  FileDown,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";

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
  "/auth?plan=professional&source=ordination";

const discountCheckoutUrl =
  process.env.NEXT_PUBLIC_ORDINATION_DISCOUNT_CHECKOUT_URL ||
  "/auth?plan=aspirant&offer=ordination-1995&source=ordination";

function getParam(searchParams: URLSearchParams, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return fallback;
}

function buildCertificateUrl(searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const name = getParam(searchParams, ["name", "fullName", "full_name"]);
  const date = getParam(searchParams, ["date", "ordinationDate", "ordination_date"]);
  const state = getParam(searchParams, ["state"]);
  const id = getParam(searchParams, ["id", "certificateId", "certificate_id"]);

  if (name) params.set("name", name);
  if (date) params.set("date", date);
  if (state) params.set("state", state);
  if (id) params.set("id", id);

  const query = params.toString();
  return query ? `/ordination/certificate?${query}` : "/ordination/certificate";
}

function withReturnToCertificate(url: string, certificateUrl: string) {
  if (url.startsWith("/")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}returnTo=${encodeURIComponent(certificateUrl)}`;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("returnTo", certificateUrl);
    return parsed.toString();
  } catch {
    return url;
  }
}

export default function OrdinationFunnelClient() {
  const searchParams = useSearchParams();
  const [declineStep, setDeclineStep] = useState<"none" | "first" | "discount">("none");

  const certificateUrl = useMemo(
    () => buildCertificateUrl(searchParams),
    [searchParams]
  );
  const standardUrl = useMemo(
    () => withReturnToCertificate(standardCheckoutUrl, certificateUrl),
    [certificateUrl]
  );
  const discountUrl = useMemo(
    () => withReturnToCertificate(discountCheckoutUrl, certificateUrl),
    [certificateUrl]
  );

  const ordainedName = getParam(searchParams, ["name", "fullName", "full_name"]);

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

  return (
    <main className="min-h-screen bg-[#f3f8ff] text-slate-950">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8 lg:py-12">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              <Award className="h-4 w-4" />
              Ministries of Love Ordination
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 md:text-5xl">
              Congratulations, you are ordained.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              {ordainedName ? `${ordainedName}, your` : "Your"} free digital
              certificate from Ministries of Love is ready. Before you download
              it, take a moment to see how OrdainedPro can help you prepare,
              write, and perform ceremonies with confidence.
            </p>
            <p className="mt-4 max-w-2xl rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Your certificate is free either way. This page simply gives you a
              chance to explore officiant tools before continuing.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
                onClick={() => setDeclineStep("first")}
              >
                No Thanks, Continue to My Certificate
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <div className="rounded-md border border-blue-200 bg-white p-6 shadow-sm">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white">
                <FileDown className="h-7 w-7" />
              </div>
              <div className="border-y border-slate-200 py-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-700">
                  Ministries of Love
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Certificate of Ordination
                </h2>
                <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-600">
                  A clean, printable digital certificate will be ready on the
                  next page with your name and ordination date.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-600">
                <span className="rounded-md bg-slate-100 px-2 py-2">View</span>
                <span className="rounded-md bg-slate-100 px-2 py-2">Download</span>
                <span className="rounded-md bg-slate-100 px-2 py-2">Print</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-700">
              <Heart className="h-4 w-4" />
              Built for real ceremonies
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              From short ceremonies to detailed long-form scripts.
            </h2>
            <p className="mt-4 leading-7 text-slate-700">
              Many basic AI tools often produce shorter, more general ceremony
              drafts. OrdainedPro is built specifically for officiants and can
              help generate detailed, personalized ceremonies up to 7,000 words,
              which can support ceremonies up to approximately 45 minutes
              depending on speaking pace and ceremony elements.
            </p>
            <p className="mt-3 leading-7 text-slate-700">
              Many full wedding ceremonies are around 20 to 30 minutes.
              OrdainedPro helps you shape the script around the ceremony length,
              tone, faith level, personalization, and traditions that matter.
            </p>
          </section>

          <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
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
              <Button
                variant="outline"
                className="h-11 border-slate-200"
                onClick={() => setDeclineStep("first")}
              >
                Continue to My Certificate
              </Button>
            </div>
          </section>
        </div>
      </section>

      <Dialog open={declineStep === "first"} onOpenChange={(open) => !open && setDeclineStep("none")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are You Sure?</DialogTitle>
            <DialogDescription className="leading-6">
              Your free digital ordination certificate is ready, but OrdainedPro
              can help you do more than simply become ordained. It can help you
              confidently write and perform beautiful, professional ceremonies.
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
              <Link href={certificateUrl}>No Thanks, Take Me to My Certificate</Link>
            </Button>
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href={discountUrl}>Claim My $19.95 Offer</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
