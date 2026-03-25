import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Startup & MVP Development | Ascendra Technologies",
  description:
    "MVP development and scalable architecture for SaaS founders, product builders, and marketplace creators. Ship faster with an experienced development partner.",
  path: "/startup-mvp-development",
  keywords: [
    "MVP development",
    "SaaS development",
    "startup development",
    "product development",
    "scalable architecture",
    "Atlanta developer",
  ],
});

export default function StartupMvpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Startup & MVP Development | Ascendra Technologies"
        description="MVP development and scalable architecture for SaaS founders, product builders, and marketplace creators. Ship faster with an experienced development partner."
        path="/startup-mvp-development"
      />
      {children}
    </>
  );
}
