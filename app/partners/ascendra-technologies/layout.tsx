import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Ascendra Technologies | Web Development & Automation",
  description:
    "Anthony Feaster leads Ascendra Technologies—development, websites, automation, and AI solutions. The technical pillar of the Brand Growth ecosystem.",
  path: "/partners/ascendra-technologies",
  keywords: ["Ascendra Technologies", "web development", "automation", "AI solutions", "Anthony Feaster"],
});

export default function AscendraPartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Ascendra Technologies | Web Development & Automation"
        description="Anthony Feaster leads Ascendra Technologies—development, websites, automation, and AI solutions. The technical pillar of the Brand Growth ecosystem."
        path="/partners/ascendra-technologies"
      />
      {children}
    </>
  );
}
