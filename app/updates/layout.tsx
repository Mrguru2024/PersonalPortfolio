import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Market updates | Ascendra Technologies",
  description:
    "Fact-checked marketing industry updates, persona-interest signals, and new project intake updates.",
  path: "/updates",
  keywords: ["market updates", "marketing updates", "new project intake", "Ascendra"],
});

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Market updates | Ascendra Technologies"
        description="Fact-checked marketing industry updates, persona-interest signals, and new project intake updates."
        path="/updates"
        schemaType="WebPage"
      />
      {children}
    </>
  );
}
