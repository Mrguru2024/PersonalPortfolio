import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

/** Defaults match client fallbacks when the offer API has no meta fields yet. */
export const metadata: Metadata = buildMarketingMetadata({
  title: "Startup growth system | Affordable audit for founders",
  description:
    "A practical startup growth audit for founders who can't yet afford a full agency build. Website audit, messaging clarity, conversion roadmap, and actionable plan. $249–$399.",
  path: "/offers/startup-growth-system",
  keywords: ["startup audit", "founder", "website audit", "conversion roadmap", "growth system"],
});

export default function StartupGrowthOfferLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Startup growth system | Affordable audit for founders"
        description="A practical startup growth audit for founders who can't yet afford a full agency build. Website audit, messaging clarity, conversion roadmap, and actionable plan. $249–$399."
        path="/offers/startup-growth-system"
      />
      {children}
    </>
  );
}
