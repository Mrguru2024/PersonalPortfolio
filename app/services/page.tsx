import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PREMIUM_OFFERS } from "@/lib/funnel-content";
import { FunnelPageShell } from "@/components/funnel/FunnelPageShell";

export const metadata: Metadata = {
  title: "Services | Ascendra Technologies",
  description:
    "Explore Ascendra's premium offer systems for website optimization, brand + website execution, and full business growth delivery.",
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
    <FunnelPageShell className="py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Premium growth systems, built around your stage.
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">
              Choose the delivery path that matches where your business is right
              now. Each offer is designed to improve visibility, trust, and
              conversion.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {PREMIUM_OFFERS.map((offer) => (
              <Card
                key={offer.slug}
                className="border-border bg-card h-full funnel-card funnel-card-hover"
              >
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
                        Discuss this offer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 funnel-card">
            <h2 className="text-2xl font-semibold text-foreground">
              Existing pathway pages (kept and aligned)
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              If your business already fits one of these use cases, you can use
              the dedicated pathway pages directly.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {pathways.map((pathway) => (
                <Link
                  key={pathway.href}
                  href={pathway.href}
                  className="rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors funnel-card-hover"
                >
                  <p className="font-medium text-foreground">{pathway.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pathway.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6 funnel-card">
            <h2 className="text-2xl font-semibold text-foreground">
              Not sure which offer fits?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Start with a Digital Growth Audit and we will map your next move.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild className="min-h-[44px]">
                <Link href="/audit">Request a Digital Growth Audit</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/results">View recent work</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </FunnelPageShell>
  );
}
