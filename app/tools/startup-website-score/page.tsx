import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSEO } from "@/components/SEO";
import { StartupWebsiteScoreCard } from "@/components/funnel/StartupWebsiteScoreCard";
import {
  STARTUP_GROWTH_KIT_PATH,
  REVENUE_CALCULATOR_PATH,
  STARTUP_ACTION_PLAN_PATH,
} from "@/lib/funnelCtas";

export const metadata: Metadata = {
  title: "Startup website score | Free growth tool",
  description:
    "Answer five questions about your startup website and get a readiness score (0–100) with improvement suggestions. Then view your Startup Action Plan.",
};

export default function StartupWebsiteScorePage() {
  return (
    <>
      <PageSEO
        title="Startup website score | Free growth tool"
        description="See how your startup website scores on offer clarity, lead capture, CTA, trust, and mobile. Get suggestions and your Startup Action Plan."
        canonicalPath="/tools/startup-website-score"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-8">
            <section className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Startup website score
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Five simple questions about your website. Get a readiness score (0–100), improvement suggestions, and a clear next step with the Startup Action Plan.
              </p>
              <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5 mt-8">
                <Image
                  src="/stock images/Web Design_2.jpeg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" aria-hidden />
              </div>
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
        </div>
      </div>
    </>
  );
}
