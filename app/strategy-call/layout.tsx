import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Book a free call | Brand Growth",
  description:
    "Book a free call to discuss your brand, website, or marketing goals. One coordinated team—brand, web, and marketing.",
  path: "/strategy-call",
  keywords: ["strategy call", "brand strategy", "consultation", "brand growth"],
});

export default function StrategyCallLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Book a free call | Brand Growth"
        description="Book a free call to discuss your brand, website, or marketing goals. One coordinated team—brand, web, and marketing."
        path="/strategy-call"
      />
      {children}
    </>
  );
}
