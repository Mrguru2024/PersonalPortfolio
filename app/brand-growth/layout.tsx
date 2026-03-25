import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { BRAND_GROWTH_PATH } from "@/lib/funnelCtas";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Build a Brand That Converts | Brand Growth System",
  description:
    "Brand strategy, websites, and marketing visuals—built together by one coordinated team. Launch, rebrand, or scale with Macon Designs, Style Studio Branding, and Ascendra Technologies.",
  path: BRAND_GROWTH_PATH,
  keywords: [
    "brand strategy",
    "brand identity",
    "website development",
    "marketing design",
    "rebrand",
    "brand growth",
    "conversion",
  ],
});

export default function BrandGrowthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Build a Brand That Converts | Brand Growth System"
        description="Brand strategy, websites, and marketing visuals—built together by one coordinated team. Launch, rebrand, or scale with Macon Designs, Style Studio Branding, and Ascendra Technologies."
        path={BRAND_GROWTH_PATH}
      />
      {children}
    </>
  );
}
