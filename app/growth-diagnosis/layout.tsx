import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Website Growth Diagnosis | Conversion & Visibility Audit",
  description:
    "Free website growth diagnosis. Get your Growth Readiness Score, performance and conversion audit, and clear next steps. Then schedule a human diagnosis for the deepest insight.",
  path: "/growth-diagnosis",
  keywords: ["website diagnosis", "conversion audit", "growth score", "website audit"],
});

export default function GrowthDiagnosisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Website Growth Diagnosis | Conversion & Visibility Audit"
        description="Get a clear picture of your site's performance, clarity, and growth opportunities. Free automated diagnosis, then book a human audit for custom strategy."
        path="/growth-diagnosis"
      />
      {children}
    </>
  );
}
