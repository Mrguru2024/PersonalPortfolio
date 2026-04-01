import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Launch Your Business With a Brand That Looks Professional | Brand Launch",
  description:
    "Complete business brand build for new entrepreneurs: brand identity, website, and marketing kit—built by one coordinated team. Book your brand launch call.",
  path: "/launch-your-brand",
  keywords: ["brand launch", "new business branding", "startup brand", "brand identity", "launch kit"],
});

export default function LaunchYourBrandLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd
        title="Launch Your Business With a Brand That Looks Professional | Brand Launch"
        description="Complete business brand build for new entrepreneurs: brand identity, website, and marketing kit—built by one coordinated team. Book your brand launch call."
        path="/launch-your-brand"
      />
      {children}
    </>
  );
}
