import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { projects } from "@/lib/data";
import { FunnelPageShell } from "@/components/funnel/FunnelPageShell";

export const metadata: Metadata = {
  title: "Results & Work | Ascendra Technologies",
  description:
    "Selected project examples showing challenge, solution direction, and the type of business each build is best suited for.",
};

const featuredProjects = projects.slice(0, 6);

export default function ResultsPage() {
  return (
    <FunnelPageShell className="py-10 sm:py-14">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
          <section className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Results and work examples
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">
              Honest project framing focused on business context, implementation,
              and what was improved.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {featuredProjects.map((project) => {
              const caseStudy = project.synopsis?.caseStudy;
              return (
                <Card
                  key={project.id}
                  className="border-border bg-card h-full funnel-card funnel-card-hover"
                >
                  <CardContent className="p-5 sm:p-6 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                        {project.category}
                      </p>
                      <h2 className="text-2xl font-semibold text-foreground">
                        {project.title}
                      </h2>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">Challenge</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {caseStudy?.problem || project.description}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">Solution direction</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.synopsis?.description || project.details}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        What was improved
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {(caseStudy?.features?.slice(0, 3) || project.tags.slice(0, 3)).map(
                          (item) => (
                            <li key={item}>• {item}</li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Best-fit business type
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(project.tags || []).join(", ")}
                      </p>
                    </div>

                    <Button asChild variant="outline" className="w-full min-h-[44px]">
                      <Link href={`/projects/${project.id}`}>
                        View project details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="text-center rounded-xl border border-border bg-card p-5 sm:p-6 funnel-card">
            <h2 className="text-2xl font-semibold text-foreground">
              Ready to apply this to your business?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Start with the Digital Growth Audit or request a strategy call if
              you already know your direction.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild className="min-h-[44px]">
                <Link href="/audit">Request a Digital Growth Audit</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/contact">Book a Strategy Call</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </FunnelPageShell>
  );
}
