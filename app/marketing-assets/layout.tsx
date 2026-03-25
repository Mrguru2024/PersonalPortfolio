import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Professional Marketing Assets That Actually Convert | Style Studio",
  description:
    "Ad creatives, social graphics, packaging, and promotional design for businesses that already have a brand and website. Led by Style Studio Branding. Start your marketing upgrade.",
  path: "/marketing-assets",
  keywords: [
    "marketing design",
    "ad creatives",
    "packaging design",
    "social media graphics",
    "marketing assets",
  ],
});

export default function MarketingAssetsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Professional Marketing Assets That Actually Convert | Style Studio"
        description="Ad creatives, social graphics, packaging, and promotional design for businesses that already have a brand and website. Led by Style Studio Branding. Start your marketing upgrade."
        path="/marketing-assets"
      />
      {children}
    </>
  );
}
