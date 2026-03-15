import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/data";
import { EcosystemProjectsSection } from "@/components/ecosystem/EcosystemProjectsSection";

export const metadata: Metadata = {
  title: "Results & Work | Ascendra Technologies",
  description:
    "Selected project examples showing challenge, solution direction, and the type of business each build is best suited for.",
};

export default function ResultsPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
              Results and work examples
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Real projects—what we did, why, and what changed for the business.
            </p>
          </section>

          <EcosystemProjectsSection ascendraProjects={projects.slice(0, 6)} />

          <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Ready to apply this to your business?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Start with a free audit, or book a call if you already know what you want. See how you stack up with a{" "}
              <Link href="/competitor-position-snapshot" className="font-medium text-primary hover:underline">competitor position snapshot</Link>.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild className="min-h-[44px]">
                <Link href="/audit">Get your free audit</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/contact">Book a free call</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/competitor-position-snapshot">Competitor snapshot</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
