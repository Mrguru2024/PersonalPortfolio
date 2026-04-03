import type { Metadata } from "next";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { TrackPageView } from "@/components/TrackPageView";
import { RevenueLossCalculator } from "@/components/funnel/RevenueLossCalculator";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { LeadMagnetUrgencyZone } from "@/components/urgency-conversion/LeadMagnetUrgencyZone";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Website revenue loss calculator | Free growth tool",
  description:
    "Estimate how much revenue your business may be losing due to poor website conversion. Get your Digital Growth Audit for a clear fix.",
  path: "/website-revenue-calculator",
  keywords: ["revenue calculator", "conversion", "website ROI", "lead loss"],
});

export default function WebsiteRevenueCalculatorPage() {
  return (
    <>
      <WebPageJsonLd
        title="Website revenue loss calculator | Free growth tool"
        description="Estimate monthly revenue loss from poor website conversion. Then get a Digital Growth Audit for next steps."
        path="/website-revenue-calculator"
      />
      <TrackPageView path="/website-revenue-calculator" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <section className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                How much revenue could your website be leaving on the table?
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-0">
                Use this quick calculator to estimate how much potential business your website might be missing due to low conversion rates.
              </p>
              <FunnelHeroMedia
                src="/stock images/Digital_19.jpeg"
                aspect="video"
                maxWidth="3xl"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </section>
            <div className="mb-6">
              <LeadMagnetUrgencyZone surfaceKey="revenue-calculator" />
            </div>
            <RevenueLossCalculator />
          </div>
          <div className="mx-auto max-w-4xl mt-12 sm:mt-16">
            <LeadMagnetRelatedWorkSection leadMagnetKey="revenue-calculator" />
          </div>
        </div>
      </div>
    </>
  );
}
