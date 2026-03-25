import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Your growth path | Ascendra Technologies",
  description:
    "Tell us what you run and what you need to fix — get a tailored path to lead magnets, services, and booking.",
  path: "/journey",
  keywords: ["persona journey", "growth path", "lead magnets", "business type"],
});

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Your growth path | Ascendra Technologies"
        description="Persona-based journey: lead generation, conversion systems, and automation — matched to your business."
        path="/journey"
      />
      {children}
    </>
  );
}
