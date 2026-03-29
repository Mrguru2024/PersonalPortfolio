"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Code2, Megaphone, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { projectCaseStudyPath } from "@/lib/personaCaseStudies";
import {
  BEHANCE_MACON_URL,
  BEHANCE_STYLE_STUDIO_URL,
  ECOSYSTEM_LOGOS,
} from "@/lib/ecosystemProjects";
import {
  resolveLeadMagnetRelatedWork,
  type LeadMagnetRelatedWorkKey,
} from "@/lib/leadMagnetRelatedWork";

export interface LeadMagnetRelatedWorkSectionProps {
  leadMagnetKey: LeadMagnetRelatedWorkKey;
  className?: string;
}

export function LeadMagnetRelatedWorkSection({
  leadMagnetKey,
  className = "",
}: LeadMagnetRelatedWorkSectionProps) {
  const { ascendra, macon, styleStudio } = resolveLeadMagnetRelatedWork(leadMagnetKey);
  const total = ascendra.length + macon.length + styleStudio.length;
  if (total === 0) return null;

  return (
    <section
      className={`space-y-6 sm:space-y-8 border-t border-border/80 pt-10 sm:pt-12 ${className}`.trim()}
      aria-labelledby="lead-magnet-related-work-heading"
    >
      <div className="text-center sm:text-left max-w-3xl sm:max-w-none">
        <h2
          id="lead-magnet-related-work-heading"
          className="text-xl sm:text-2xl font-semibold text-foreground"
        >
          Related work from the ecosystem
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Real builds and portfolio pieces from{" "}
          <strong className="text-foreground font-medium">Macon Designs®</strong>,{" "}
          <strong className="text-foreground font-medium">Style Studio Branding</strong>, and{" "}
          <strong className="text-foreground font-medium">Ascendra</strong>. Examples rotate by page so each tool
          surfaces different work while staying consistent when you revisit the same URL.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {macon.map((project) => (
          <Card key={`macon-${project.id}`} className="border-border/90 bg-card h-full flex flex-col">
            <CardContent className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Palette className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary truncate">
                    Macon Designs®
                  </p>
                </div>
                <div className="relative w-12 h-8 shrink-0">
                  <Image
                    src={ECOSYSTEM_LOGOS.maconBadge}
                    alt=""
                    fill
                    className="object-contain object-right"
                    sizes="48px"
                  />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground leading-snug">{project.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{project.description}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.tags.join(" · ")}</p>
              <div className="flex flex-col gap-2 mt-4">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 min-h-[40px]">
                  <a href={BEHANCE_MACON_URL} target="_blank" rel="noopener noreferrer">
                    View on Behance
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground h-9">
                  <Link href="/partners/macon-designs">Partner profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {styleStudio.map((project) => (
          <Card key={`style-${project.id}`} className="border-border/90 bg-card h-full flex flex-col">
            <CardContent className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary truncate">
                    Style Studio
                  </p>
                </div>
                <div className="relative w-14 h-7 shrink-0">
                  <Image
                    src={ECOSYSTEM_LOGOS.styleStudioLight}
                    alt=""
                    fill
                    className="object-contain object-right dark:hidden"
                    sizes="56px"
                  />
                  <Image
                    src={ECOSYSTEM_LOGOS.styleStudioDark}
                    alt=""
                    fill
                    className="object-contain object-right hidden dark:block"
                    sizes="56px"
                  />
                </div>
              </div>
              <h3 className="text-base font-semibold text-foreground leading-snug">{project.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{project.description}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.tags.join(" · ")}</p>
              <div className="flex flex-col gap-2 mt-4">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 min-h-[40px]">
                  <a href={BEHANCE_STYLE_STUDIO_URL} target="_blank" rel="noopener noreferrer">
                    View on Behance
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="sm" className="w-full text-muted-foreground h-9">
                  <Link href="/partners/style-studio-branding">Partner profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {ascendra.map((project) => (
          <Card key={`ascendra-${project.id}`} className="border-border/90 bg-card h-full flex flex-col">
            <CardContent className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="h-4 w-4 text-primary shrink-0" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ascendra</p>
              </div>
              <h3 className="text-base font-semibold text-foreground leading-snug">{project.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 flex-1">{project.description}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.tags.join(" · ")}</p>
              <Button asChild variant="outline" size="sm" className="w-full mt-4 gap-1.5 min-h-[40px]">
                <Link href={projectCaseStudyPath(project.id)}>
                  View case study
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
