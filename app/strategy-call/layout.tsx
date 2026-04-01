import type { Metadata } from "next";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { MARKETING_CTA_BOOK_STRATEGY_CALL } from "@shared/marketingCtaCopy";

const strategyCallTitle = `${MARKETING_CTA_BOOK_STRATEGY_CALL} | Brand Growth`;
const strategyCallDescription = `${MARKETING_CTA_BOOK_STRATEGY_CALL} to discuss your brand, website, or marketing goals—complimentary and no obligation. One coordinated team for brand, web, and marketing.`;

export const metadata: Metadata = buildMarketingMetadata({
  title: strategyCallTitle,
  description: strategyCallDescription,
  path: "/strategy-call",
  keywords: ["strategy call", "brand strategy", "consultation", "brand growth"],
});

export default function StrategyCallLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WebPageJsonLd title={strategyCallTitle} description={strategyCallDescription} path="/strategy-call" />
      {children}
    </>
  );
}
