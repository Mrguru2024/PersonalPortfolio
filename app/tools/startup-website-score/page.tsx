import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { StartupWebsiteScoreCard } from "@/components/funnel/StartupWebsiteScoreCard";
import { LeadMagnetRelatedWorkSection } from "@/components/ecosystem/LeadMagnetRelatedWorkSection";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import {
  STARTUP_GROWTH_KIT_PATH,
  REVENUE_CALCULATOR_PATH,
  STARTUP_ACTION_PLAN_PATH,
} from "@/lib/funnelCtas";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Startup website score | Free growth tool",
  description:
    "Answer five questions about your startup website and get a readiness score (0–100) with improvement suggestions. Then view your Startup Action Plan.",
  path: "/tools/startup-website-score",
  keywords: ["startup", "website score", "readiness", "founders"],
});

export default function StartupWebsiteScorePage() {
  return (
    <>
      <WebPageJsonLd
        title="Startup website score | Free growth tool"
        description="See how your startup website scores on offer clarity, lead capture, CTA, trust, and mobile. Get suggestions and your Startup Action Plan."
        path="/tools/startup-website-score"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-8">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Startup website score
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-0">
                Five simple questions about your website. Get a readiness score (0–100), improvement suggestions, and a clear next step with the Startup Action Plan.
              </p>
              <FunnelHeroMedia
                src="/stock images/Web Design_2.jpeg"
                aspect="video"
                maxWidth="3xl"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </section>

            <StartupWebsiteScoreCard />

            <section className="flex flex-col sm:flex-row gap-3 justify-center text-center">
              <Button asChild variant="outline" className="gap-2 min-h-[44px]">
                <Link href={STARTUP_GROWTH_KIT_PATH}>
                  Read the startup growth kit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 min-h-[44px]">
                <Link href={REVENUE_CALCULATOR_PATH}>Revenue calculator</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 min-h-[44px]">
                <Link href={STARTUP_ACTION_PLAN_PATH}>Startup action plan</Link>
              </Button>
            </section>
          </div>
          <div className="mx-auto max-w-4xl mt-12 sm:mt-16">
            <LeadMagnetRelatedWorkSection leadMagnetKey="startup-website-score" />
          </div>
        </div>
      </div>
    </>
  );
}
