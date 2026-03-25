import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Local Business & Practice Growth | Ascendra Technologies",
  description:
    "Professional websites and appointment systems for healthcare practices, dental offices, med spas, therapy clinics, and professional service firms in Atlanta and beyond.",
  path: "/local-business-growth",
  keywords: [
    "healthcare website",
    "dental website",
    "med spa website",
    "therapy clinic",
    "professional services",
    "local business growth",
    "patient acquisition",
  ],
});

export default function LocalBusinessGrowthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Local Business & Practice Growth | Ascendra Technologies"
        description="Professional websites and appointment systems for healthcare practices, dental offices, med spas, therapy clinics, and professional service firms in Atlanta and beyond."
        path="/local-business-growth"
      />
      {children}
    </>
  );
}
