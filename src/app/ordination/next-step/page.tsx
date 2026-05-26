import { Suspense } from "react";

import OrdinationFunnelClient from "@/components/ordination/OrdinationFunnelClient";

export const metadata = {
  title: "You Are Ordained | OrdainedPro",
  description:
    "A post-ordination next step for newly ordained Ministries of Love officiants.",
};

export default function OrdinationNextStepPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f8ff]" />}>
      <OrdinationFunnelClient />
    </Suspense>
  );
}
