import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Market updates | Ascendra Technologies",
  description:
    "Live marketing, digital, and advertising headlines from curated publishers, plus verified Ascendra public updates—no internal posts.",
  path: "/updates",
  keywords: [
    "market updates",
    "marketing news",
    "digital marketing",
    "advertising",
    "Ascendra",
  ],
});

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Market updates | Ascendra Technologies"
        description="Live curated marketing and advertising feeds plus verified Ascendra public updates."
        path="/updates"
        schemaType="WebPage"
      />
      {children}
    </>
  );
}
