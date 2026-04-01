import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Your Business Grew — But Your Brand Didn't | Rebrand Strategy",
  description:
    "Complete rebrand and website upgrade for established businesses. Outdated branding hurts credibility and conversion. Book your rebrand strategy call.",
  path: "/rebrand-your-business",
  keywords: ["rebrand", "brand refresh", "website rebuild", "brand redesign", "brand upgrade"],
});

export default function RebrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Your Business Grew — But Your Brand Didn't | Rebrand Strategy"
        description="Complete rebrand and website upgrade for established businesses. Outdated branding hurts credibility and conversion. Book your rebrand strategy call."
        path="/rebrand-your-business"
      />
      {children}
    </>
  );
}
