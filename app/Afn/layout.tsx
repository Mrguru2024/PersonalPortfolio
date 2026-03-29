import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Ascendra Founder Network | Community for Founders & Builders",
  description:
    "Join a premium community of startup founders, small business owners, and builders. Connect, collaborate, and grow with Ascendra Founder Network.",
  path: "/Afn",
  keywords: ["founder community", "startup community", "builders", "networking", "Ascendra"],
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Ascendra Founder Network | Community for Founders & Builders"
        description="Join a premium community of startup founders, small business owners, and builders. Connect, collaborate, and grow with Ascendra Founder Network."
        path="/Afn"
      />
      {children}
    </>
  );
}
