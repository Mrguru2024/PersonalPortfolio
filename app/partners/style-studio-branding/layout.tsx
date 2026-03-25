import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Style Studio Branding | Marketing & Production Design",
  description:
    "Kristopher Williams leads Style Studio Branding—production design, marketing assets, packaging, and ad creatives. Part of the Brand Growth ecosystem.",
  path: "/partners/style-studio-branding",
  keywords: [
    "Style Studio Branding",
    "production design",
    "marketing assets",
    "packaging design",
    "ad creatives",
    "Kristopher Williams",
  ],
});

export default function StyleStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Style Studio Branding | Marketing & Production Design"
        description="Kristopher Williams leads Style Studio Branding—production design, marketing assets, packaging, and ad creatives. Part of the Brand Growth ecosystem."
        path="/partners/style-studio-branding"
      />
      {children}
    </>
  );
}
