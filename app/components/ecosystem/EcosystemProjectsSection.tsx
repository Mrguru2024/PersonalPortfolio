import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Palette, Code2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project } from "@/lib/data";
import {
  MACON_PROJECTS,
  STYLE_STUDIO_PROJECTS,
  BEHANCE_MACON_URL,
  BEHANCE_STYLE_STUDIO_URL,
  ECOSYSTEM_LOGOS,
} from "@/lib/ecosystemProjects";

interface EcosystemProjectsSectionProps {
  /** Ascendra (web/tech) projects to show in the third section */
  ascendraProjects: Project[];
}

export function EcosystemProjectsSection({ ascendraProjects }: EcosystemProjectsSectionProps) {
  return (
    <div className="marketing-stack">
      {/* Macon Designs */}
      <section className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              From our ecosystem
            </h2>
            <p className="text-sm text-muted-foreground">
              Brand identity and design by <strong className="text-foreground">Macon Designs®</strong> — Denishia Macon-Lynn. Part of the Brand Growth ecosystem.
            </p>
          </div>
          <div className="relative w-24 h-16 shrink-0">
            <Image
              src={ECOSYSTEM_LOGOS.maconBadge}
              alt="Macon Designs"
              fill
              className="object-contain object-left"
              sizes="96px"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          {MACON_PROJECTS.map((project) => (
            <Card key={project.id} className="border-border bg-card h-full">
              <CardContent className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col h-full">
                <div className="flex items-start gap-2 mb-2">
                  <Palette className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                    Macon Designs
                  </p>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{project.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{project.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{project.tags.join(" · ")}</p>
                <Button asChild variant="outline" className="w-full mt-4 min-h-[44px] gap-2">
                  <a href={BEHANCE_MACON_URL} target="_blank" rel="noopener noreferrer">
                    View on Behance
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          All projects link to{" "}
          <a href={BEHANCE_MACON_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Denishia&apos;s full Behance portfolio
          </a>
          .
        </p>
      </section>

      {/* Style Studio Branding */}
      <section className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Style Studio Branding
            </h2>
            <p className="text-sm text-muted-foreground">
              Marketing and production design by <strong className="text-foreground">Kristopher Williams</strong>. Strategy and messaging pillar of the Brand Growth ecosystem.
            </p>
          </div>
          <div className="relative w-24 h-10 shrink-0">
            <Image
              src={ECOSYSTEM_LOGOS.styleStudioLight}
              alt="Style Studio Branding"
              fill
              className="object-contain object-left dark:hidden"
              sizes="96px"
            />
            <Image
              src={ECOSYSTEM_LOGOS.styleStudioDark}
              alt="Style Studio Branding"
              fill
              className="object-contain object-left hidden dark:block"
              sizes="96px"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          {STYLE_STUDIO_PROJECTS.map((project) => (
            <Card key={project.id} className="border-border bg-card h-full">
              <CardContent className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col h-full">
                <div className="flex items-start gap-2 mb-2">
                  <Megaphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                    Style Studio Branding
                  </p>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{project.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{project.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{project.tags.join(" · ")}</p>
                <Button asChild variant="outline" className="w-full mt-4 min-h-[44px] gap-2">
                  <a href={BEHANCE_STYLE_STUDIO_URL} target="_blank" rel="noopener noreferrer">
                    View on Behance
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          All projects link to{" "}
          <a href={BEHANCE_STYLE_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Kristopher&apos;s full Behance portfolio
          </a>
          .
        </p>
      </section>

      {/* Ascendra Technologies */}
      <section className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Ascendra Technologies
            </h2>
            <p className="text-sm text-muted-foreground">
              Web development, funnel systems, and conversion-focused builds. Technology pillar of the Brand Growth ecosystem.
            </p>
          </div>
          <div className="relative w-24 h-10 shrink-0">
            <Image
              src={ECOSYSTEM_LOGOS.ascendra}
              alt="Ascendra Technologies"
              fill
              className="object-contain object-left"
              sizes="96px"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          {ascendraProjects.map((project) => {
            const caseStudy = project.synopsis?.caseStudy;
            return (
              <Card key={project.id} className="border-border bg-card h-full">
                <CardContent className="px-6 py-5 sm:px-8 sm:py-6 space-y-4">
                  <div className="flex items-start gap-2 mb-1">
                    <Code2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                      Ascendra Technologies
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-1">
                      {project.category}
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground">{project.title}</h2>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Challenge</p>
                    <p className="text-sm text-muted-foreground">
                      {caseStudy?.problem || project.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Solution direction</p>
                    <p className="text-sm text-muted-foreground">
                      {project.synopsis?.description || project.details}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">What was improved</p>
                    <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                      {(caseStudy?.features?.slice(0, 3) || project.tags.slice(0, 3)).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Best-fit business type</p>
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
        </div>
      </section>
    </div>
  );
}
