import Home from "@/route-modules/Home";
import type { Metadata } from "next";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Ascendra Technologies | Strategy, Design, Technology",
  description:
    "A coordinated growth ecosystem helping businesses improve brand clarity, presentation quality, website performance, and conversion systems.",
  path: "/",
  keywords: ["brand growth", "web development", "marketing", "Atlanta", "Ascendra"],
});

export default function HomePage() {
  return (
    <>
      <WebPageJsonLd
        title="Ascendra Technologies | Strategy, Design, Technology"
        description="A coordinated growth ecosystem helping businesses improve brand clarity, presentation quality, website performance, and conversion systems."
        path="/"
        schemaType="WebPage"
      />
      <Home />
    </>
  );
}
