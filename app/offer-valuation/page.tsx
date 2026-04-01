import type { Metadata } from "next";
import { TrackPageView } from "@/components/TrackPageView";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import OfferValuationTool from "@/components/offer-valuation";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Offer valuation engine | Ascendra Technologies",
  description:
    "Evaluate your offer with the 100M value equation, AI-backed diagnosis, and strategic fixes.",
  path: "/offer-valuation",
  keywords: ["offer valuation", "value equation", "CRM", "diagnostic"],
});

export default function OfferValuationPage() {
  return (
    <>
      <TrackPageView path="/offer-valuation" />
      <WebPageJsonLd
        title="Offer valuation engine | Ascendra Technologies"
        description="Run offer valuations with CRM-ready outputs and AI-assisted strategic recommendations."
        path="/offer-valuation"
      />
      <div className="w-full min-w-0 max-w-full marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-4xl space-y-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Offer Valuation Engine
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Internal and client-ready diagnostic engine for offer strength, positioning,
              and conversion improvements.
            </p>
          </div>
          <OfferValuationTool surface="internal" />
        </div>
      </div>
    </>
  );
}

