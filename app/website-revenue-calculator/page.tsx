import type { Metadata } from "next";
import { PageSEO } from "@/components/SEO";
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
            </section>
            <RevenueLossCalculator />
          </div>
        </div>
      </div>
    </>
  );
}
