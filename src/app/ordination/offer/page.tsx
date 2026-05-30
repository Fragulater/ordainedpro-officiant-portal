import { Suspense } from "react";

import { OrdinationOfferClient } from "@/components/ordination/OrdinationFunnelClient";

export const metadata = {
  title: "Your Ordination Next Step | OrdainedPro",
  description:
    "Learn how OrdainedPro helps newly ordained officiants prepare and write memorable ceremonies.",
};

export default function OrdinationOfferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f8ff]" />}>
      <OrdinationOfferClient />
    </Suspense>
  );
}
