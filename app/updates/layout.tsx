import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Project updates | Ascendra Technologies",
  description:
    "Recent changes and improvements to Ascendra products and the site—plain language, no jargon.",
  path: "/updates",
  keywords: ["changelog", "product updates", "Ascendra"],
});

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Project updates | Ascendra Technologies"
        description="Recent changes and improvements to Ascendra products and the site—plain language, no jargon."
        path="/updates"
        schemaType="WebPage"
      />
      {children}
    </>
  );
}
