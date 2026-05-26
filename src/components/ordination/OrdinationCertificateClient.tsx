"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

function readParam(searchParams: URLSearchParams, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return fallback;
}

function formatDate(value: string) {
  if (!value || value === "Ordination date needed") return value;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function OrdinationCertificateClient() {
  const searchParams = useSearchParams();
  const name = readParam(searchParams, ["name", "fullName", "full_name"], "Full legal name needed");
  const date = readParam(
    searchParams,
    ["date", "ordinationDate", "ordination_date"],
    "Ordination date needed"
  );
  const state = readParam(searchParams, ["state"], "");
  const certificateId = readParam(searchParams, ["id", "certificateId", "certificate_id"], "");
  const formattedDate = formatDate(date);

  const downloadUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("name", name);
    params.set("date", date);
    if (state) params.set("state", state);
    if (certificateId) params.set("id", certificateId);
    return `/api/ordination/certificate?${params.toString()}`;
  }, [certificateId, date, name, state]);

  return (
    <main className="min-h-screen bg-[#f3f8ff] px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Ministries of Love
            </p>
            <h1 className="text-3xl font-black">Your Ordination Certificate</h1>
            <p className="mt-1 text-slate-600">
              View, print, or download your free digital certificate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href={downloadUrl}>
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
          </div>
        </div>

        <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <div className="certificate-print rounded-md border-4 border-double border-blue-200 bg-white px-6 py-10 text-center md:px-14 md:py-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl font-black text-white">
              O
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">
              Ministries of Love
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-normal text-slate-950 md:text-5xl">
              Certificate of Ordination
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-700">
              This certifies that
            </p>
            <p className="mx-auto mt-3 max-w-3xl border-b border-slate-300 pb-3 text-3xl font-black text-slate-950">
              {name}
            </p>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-700">
              has received licensed minister credentials through Ministries of
              Love on{" "}
              <span className="font-bold text-slate-950">{formattedDate}</span>
              {state ? (
                <>
                  {" "}
                  and is recognized as an Arbiter of Matrimony in{" "}
                  <span className="font-bold text-slate-950">{state}</span>.
                </>
              ) : (
                "."
              )}
            </p>
            <div className="mx-auto mt-12 grid max-w-3xl gap-8 md:grid-cols-2">
              <div className="border-t border-slate-300 pt-3">
                <p className="font-bold">Ministries of Love</p>
                <p className="text-sm text-slate-600">Issuing Ministry</p>
              </div>
              <div className="border-t border-slate-300 pt-3">
                <p className="font-bold">{certificateId || "Certificate ID pending"}</p>
                <p className="text-sm text-slate-600">Certificate ID</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-blue-100 bg-white p-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
          <p>
            If your name or date is missing, connect the WordPress ordination
            form to this page with name and date query values.
          </p>
          <Button asChild variant="outline">
            <Link href="/auth?source=certificate">
              <ArrowLeft className="h-4 w-4" />
              Return to OrdainedPro
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
