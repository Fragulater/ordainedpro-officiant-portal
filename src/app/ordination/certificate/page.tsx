import { Suspense } from "react";

import OrdinationCertificateClient from "@/components/ordination/OrdinationCertificateClient";

export const metadata = {
  title: "Ordination Certificate | OrdainedPro",
  description: "View, print, and download your Ministries of Love ordination certificate.",
};

export default function OrdinationCertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f8ff]" />}>
      <OrdinationCertificateClient />
    </Suspense>
  );
}
