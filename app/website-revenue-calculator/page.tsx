import type { Metadata } from "next";
import Image from "next/image";
import { PageSEO } from "@/components/SEO";
import { TrackPageView } from "@/components/TrackPageView";
import { RevenueLossCalculator } from "@/components/funnel/RevenueLossCalculator";

export const metadata: Metadata = {
  title: "Website revenue loss calculator | Free growth tool",
  description:
    "Estimate how much revenue your business may be losing due to poor website conversion. Get your Digital Growth Audit for a clear fix.",
};

export default function WebsiteRevenueCalculatorPage() {
  return (
    <>
      <PageSEO
        title="Website revenue loss calculator | Free growth tool"
        description="Estimate monthly revenue loss from poor website conversion. Then get a Digital Growth Audit for next steps."
        canonicalPath="/website-revenue-calculator"
      />
      <TrackPageView path="/website-revenue-calculator" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <section className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                How much revenue could your website be leaving on the table?
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Use this quick calculator to estimate how much potential business your website might be missing due to low conversion rates.
              </p>
              <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden border border-border/60 bg-muted shadow-lg ring-1 ring-black/5 dark:ring-white/5 mt-8">
                <Image
                  src="/stock images/Digital_19.jpeg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" aria-hidden />
              </div>
            </section>
            <RevenueLossCalculator />
          </div>
        </div>
      </div>
    </>
  );
}
