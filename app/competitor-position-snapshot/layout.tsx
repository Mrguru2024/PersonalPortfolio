import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Competitor position snapshot | Free growth tool",
  description:
    "Get a structured snapshot of how your online presence compares to competitors. Guided strategic review—brand clarity, visual trust, conversion readiness.",
  path: "/competitor-position-snapshot",
  keywords: ["competitor analysis", "positioning", "brand clarity", "conversion"],
});

export default function CompetitorSnapshotLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Competitor position snapshot | Free growth tool"
        description="Get a structured snapshot of how your online presence compares to competitors. Guided strategic review—brand clarity, visual trust, conversion readiness."
        path="/competitor-position-snapshot"
      />
      {children}
    </>
  );
}
