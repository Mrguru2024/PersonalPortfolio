import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ECOSYSTEM_PILLARS,
  POSITIONING_STATEMENT,
  PREMIUM_OFFERS,
} from "@/lib/funnel-content";
import { projects } from "@/lib/data";

const processSteps = [
  "Diagnose the current bottleneck across strategy, design, and website conversion.",
  "Define the right offer path and implementation scope for your stage.",
  "Execute in clear phases with measurable next-step priorities.",
];

const trustHighlights = [
  "Conversion-focused website and funnel execution",
  "Cross-functional strategy, design, and implementation support",
  "Practical delivery model for businesses starting lean",
];

export default function Home() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-8 sm:space-y-10 pb-10 sm:pb-14">
      <section id="home" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/80 p-6 sm:p-10 text-center">
          <p className="text-sm font-medium text-primary">
            Ascendra Technologies ecosystem
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            A coordinated growth ecosystem for businesses that need better
            strategy, stronger presentation, and websites that convert.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
            {POSITIONING_STATEMENT}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="min-h-[44px]">
              <Link href="/audit">
                Request a Digital Growth Audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/services">View Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="skills" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Why most businesses stall online
              </h2>
              <ul className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
                {[
                  "Brand presence is unclear, so trust drops before conversations start.",
                  "Visual execution is inconsistent, so quality perception suffers.",
                  "Websites exist but fail to convert traffic into qualified leads.",
                  "Systems are disconnected, so growth efforts feel random and slow.",
                ].map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-foreground">
                What changes with this model
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Instead of treating strategy, design, and technology as separate
                vendors, we coordinate all three around one goal: improve how your
                business is seen, understood, and converted online.
              </p>
              <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                <Link href="/about">How the ecosystem works</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="about" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-foreground text-center">
            The 3-pillar ecosystem
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {ECOSYSTEM_PILLARS.map((pillar) => (
              <Card key={pillar.name} className="border-border bg-card h-full">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-foreground">
                    {pillar.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-primary">{pillar.role}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {pillar.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Free Digital Growth Audit
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Your entry point into the ecosystem. We review brand clarity, visual
            presentation, and website conversion structure to identify the most
            valuable next move.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button asChild className="min-h-[44px]">
              <Link href="/audit">Request a Digital Growth Audit</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/services">See premium offer systems</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-semibold text-foreground text-center">
            Premium offer systems
          </h2>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PREMIUM_OFFERS.map((offer) => (
              <Card key={offer.slug} className="border-border bg-card h-full">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{offer.outcome}</p>
                  <p className="mt-3 text-sm font-medium text-foreground">Best for</p>
                  <p className="text-sm text-muted-foreground">{offer.audience}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-foreground">
                How we work
              </h2>
              <ol className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
                {processSteps.map((step, index) => (
                  <li key={step}>
                    <span className="font-semibold text-foreground mr-2">
                      {index + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Trust and transformation focus
              </h2>
              <ul className="mt-4 space-y-2 text-sm sm:text-base text-muted-foreground">
                {trustHighlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-4 min-h-[44px]">
                <Link href="/results">Review results and work</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="projects" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Selected project examples
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {projects.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors"
              >
                <p className="font-medium text-foreground">{project.title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-5 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Ready to improve how your business is seen, understood, and converted?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Start with the Digital Growth Audit or move directly to a strategy
            call if you are already clear on your direction.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild className="min-h-[44px]">
              <Link href="/audit">Request a Digital Growth Audit</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/contact">Book a Strategy Call</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
