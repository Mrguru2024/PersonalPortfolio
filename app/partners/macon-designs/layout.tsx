import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Macon Designs | Brand Identity & Visual Systems",
  description:
    "Denishia leads Macon Designs—brand identity, visual systems, and strategic design. Part of the coordinated Brand Growth ecosystem with Ascendra and Style Studio.",
  path: "/partners/macon-designs",
  keywords: ["Macon Designs", "brand identity", "visual identity", "brand systems", "Denishia"],
});

export default function MaconDesignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Macon Designs | Brand Identity & Visual Systems"
        description="Denishia leads Macon Designs—brand identity, visual systems, and strategic design. Part of the coordinated Brand Growth ecosystem with Ascendra and Style Studio."
        path="/partners/macon-designs"
      />
      {children}
    </>
  );
}
