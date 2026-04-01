import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Relevant updates | Ascendra Technologies",
  description:
    "Fact-checked client project, Ascendra innovation, site, and market updates.",
  path: "/updates",
  keywords: ["changelog", "product updates", "Ascendra"],
});

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Relevant updates | Ascendra Technologies"
        description="Fact-checked client project, Ascendra innovation, site, and market updates."
        path="/updates"
        schemaType="WebPage"
      />
      {children}
    </>
  );
}
