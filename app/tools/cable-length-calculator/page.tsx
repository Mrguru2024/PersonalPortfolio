import type { Metadata } from "next";
import { WebPageJsonLd } from "@/components/SEO/WebPageJsonLd";
import { TrackPageView } from "@/components/TrackPageView";
import { CableLengthCalculator } from "@/components/calculators/CableLengthCalculator";
import { buildMarketingMetadata } from "@/lib/marketingMetadata";
import { FunnelHeroMedia } from "@/components/funnel/FunnelHeroMedia";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Cable Length Calculator | Free Contractor Tool",
  description:
    "Calculate total cable length needed for electrical installations. Easy-to-use tool for contractors to determine cable requirements including vertical runs, terminations, service loops, and waste.",
  path: "/tools/cable-length-calculator",
  keywords: [
    "cable calculator",
    "wire length calculator",
    "electrical calculator",
    "contractor tools",
    "cable length",
    "wire calculator",
  ],
});

export default function CableLengthCalculatorPage() {
  return (
    <>
      <WebPageJsonLd
        title="Cable Length Calculator | Free Contractor Tool"
        description="Calculate total cable length needed for your electrical installation project. Includes vertical runs, panel terminations, device terminations, service loops, and waste allowance."
        path="/tools/cable-length-calculator"
      />
      <TrackPageView path="/tools/cable-length-calculator" />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden marketing-page-y bg-gradient-to-b from-blue-50/50 via-background to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-8 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <Button asChild variant="ghost" size="sm" className="gap-2 mb-4">
                <Link href="/contractor-systems">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Contractor Systems
                </Link>
              </Button>
            </div>

            <section className="text-center mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                Cable Length Calculator
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                Calculate the exact cable length you need for your installation. Add up vertical runs, terminations, service loops, and waste allowance—all in one place.
              </p>
              <FunnelHeroMedia
                src="/stock images/Growth_6.jpeg"
                aspect="video"
                maxWidth="3xl"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </section>

            <CableLengthCalculator />

            <section className="mt-12 sm:mt-16 p-6 sm:p-8 bg-card border border-border rounded-xl shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                How to Use This Calculator
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">1. Vertical Run</h3>
                  <p className="text-sm sm:text-base">
                    Enter the vertical distance from your panel to the device location. This is typically measured in feet.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">2. Panel Termination</h3>
                  <p className="text-sm sm:text-base">
                    Add the length needed at the panel for proper termination and connections. Usually 2-3 feet.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">3. Device Termination</h3>
                  <p className="text-sm sm:text-base">
                    Enter the length needed at the device end for termination. This field supports both feet and inches for precise measurements.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">4. Other Terminations</h3>
                  <p className="text-sm sm:text-base">
                    If you have junction boxes or additional connection points, add extra length here.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">5. Service Loop</h3>
                  <p className="text-sm sm:text-base">
                    Add extra cable for service loops and slack. Standard is 10 feet, but adjust based on your needs. Supports feet and inches.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">6. Waste Allowance</h3>
                  <p className="text-sm sm:text-base">
                    Include a safety margin for cuts, errors, and unexpected adjustments. Supports feet and inches. A 5-10% waste factor is common.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 p-6 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3">
                Need Help With Your Contractor Business?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                We build custom websites and automation systems for contractors and trades businesses. Get more calls, better leads, and higher conversion from your online presence.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link href="/contractor-systems">
                    Learn About Our Contractor Systems
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/digital-growth-audit">
                    Get Free Website Audit
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
