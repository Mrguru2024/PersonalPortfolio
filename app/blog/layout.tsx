import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Blog | Ascendra Technologies",
  description:
    "Insights and updates from Ascendra Technologies – brand growth, web systems, and development.",
  path: "/blog",
  keywords: ["blog", "brand growth", "web development", "marketing insights"],
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Blog | Ascendra Technologies"
        description="Insights and updates from Ascendra Technologies – brand growth, web systems, and development."
        path="/blog"
        schemaType="CollectionPage"
      />
      {children}
    </>
  );
}
