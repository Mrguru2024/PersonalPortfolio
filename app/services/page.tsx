import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PREMIUM_OFFERS } from "@/lib/funnel-content";

export const metadata: Metadata = {
  title: "Services | Ascendra Technologies",
  description:
    "See how we can help—website optimization, brand and website execution, and full business growth. Pick the path that fits where you are.",
};

const pathways = [
  {
    href: "/contractor-systems",
    label: "Contractor & Trades pathway",
    description: "Lead-focused systems for local service businesses.",
  },
  {
    href: "/local-business-growth",
    label: "Local Business pathway",
    description: "Trust-building presentation and appointment-ready websites.",
  },
  {
    href: "/startup-mvp-development",
    label: "Startup MVP pathway",
    description: "Build and scale-ready product execution for founders.",
  },
];

export default function ServicesPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
              Growth systems that fit where you are
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Three ways we help: improve an existing website, build a stronger brand and site, or align strategy, design, and technology for conversion-ready growth.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            {PREMIUM_OFFERS.map((offer) => (
              <Card key={offer.slug} className="border-border bg-card h-full">
                <CardContent className="p-5 sm:p-6 flex h-full flex-col">
                  <h2 className="text-xl font-semibold text-foreground">
                    {offer.name}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Best for:</span>{" "}
                    {offer.audience}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Outcome:</span>{" "}
                    {offer.outcome}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {offer.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <Button asChild className="w-full min-h-[44px]">
                      <Link href="/contact">
                        See recommended growth system
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">
              Paths for your situation
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              If one of these sounds like you, you can go straight to that path.
            </p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {pathways.map((pathway) => (
                <Link
                  key={pathway.href}
                  href={pathway.href}
                  className="rounded-lg border border-border p-4 hover:bg-section/50 transition-colors"
                >
                  <p className="font-medium text-foreground">{pathway.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pathway.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-3 sm:mb-4">
              Not sure where to start?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Start with a Digital Growth Audit to understand where your website may be holding you back. Or explore our{" "}
              <Link href="/website-revenue-calculator" className="font-medium text-primary hover:underline">revenue loss calculator</Link> and{" "}
              <Link href="/homepage-conversion-blueprint" className="font-medium text-primary hover:underline">homepage conversion blueprint</Link> for free tools.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild className="min-h-[44px]">
                <Link href="/digital-growth-audit">Request Your Digital Growth Audit</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/website-revenue-calculator">Explore free growth tools</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/partners/ascendra-technologies#projects">View our work</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
