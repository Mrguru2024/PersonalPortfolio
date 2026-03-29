import type { Metadata } from "next";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { TrackPageView } from "@/components/TrackPageView";
import { MarketScoreFunnelClient } from "@/components/funnel/MarketScoreFunnelClient";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FREE_GROWTH_TOOLS_PATH } from "@/lib/funnelCtas";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Free Market Score | Demand, competition & purchase power",
  description:
    "Run a free Market Score for your offer and geography. Get a demand, competition, and purchase-power snapshot—full report unlocks on a strategy call. Connected to Ascendra CRM.",
};

export default function MarketScorePage() {
  return (
    <>
      <WebPageJsonLd
        title="Free Market Score — Ascendra"
        description="Demand, competition, and purchase power snapshot for your market. CRM-linked lead capture and nurture."
        path="/market-score"
      />
      <TrackPageView path="/market-score" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-10 sm:py-14">
          <div className="mx-auto max-w-4xl marketing-stack">
            <MarketScoreFunnelClient />
            <p className="text-center text-xs text-muted-foreground mt-10">
              Prefer browsing first?{" "}
              <Link href={FREE_GROWTH_TOOLS_PATH} className="text-primary underline-offset-4 hover:underline">
                Back to free tools
              </Link>
            </p>
            <LeadMagnetRelatedWorkSection leadMagnetKey="market-score" />
          </div>
        </div>
      </div>
    </>
  );
}
