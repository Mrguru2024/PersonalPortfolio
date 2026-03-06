"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Code,
  Database,
  PhoneCall,
  Rocket,
  Search,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageSEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/data";
import { cn } from "@/lib/utils";

type PersonaVariant = "contractor" | "local" | "startup";

interface WorkflowStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface PersonaStyleConfig {
  pageGradientClassName: string;
  glowOneClassName: string;
  glowTwoClassName: string;
  sectionSurfaceClassName: string;
  heroClassName: string;
  heroPanelClassName: string;
  heroBodyClassName: string;
  eyebrow: string;
  workflowTitle: string;
  workflowSteps: WorkflowStep[];
  visualTitle: string;
  visualPoints: string[];
  sectionTintClassName: string;
}

const PERSONA_CONFIG: Record<PersonaVariant, PersonaStyleConfig> = {
  contractor: {
    pageGradientClassName:
      "bg-gradient-to-b from-background via-slate-50/70 to-background dark:from-background dark:via-slate-900/30 dark:to-background",
    glowOneClassName: "bg-primary/20 dark:bg-primary/15",
    glowTwoClassName: "bg-sky-500/15 dark:bg-sky-400/10",
    sectionSurfaceClassName: "border-border/70 bg-card/65",
    heroClassName: "border-border bg-background",
    heroPanelClassName: "border-border bg-muted/40",
    heroBodyClassName: "text-muted-foreground",
    eyebrow: "For contractors and trades teams",
    workflowTitle: "Lead Capture and Follow-Up Workflow",
    workflowSteps: [
      {
        title: "Service intent landing",
        description: "Visitors land on service-area pages built for estimate requests.",
        icon: Building2,
      },
      {
        title: "Fast contact capture",
        description: "Clear call and form actions reduce drop-off on mobile devices.",
        icon: PhoneCall,
      },
      {
        title: "Automated follow-up",
        description: "Form submissions trigger internal alerts and customer follow-up paths.",
        icon: Workflow,
      },
      {
        title: "Performance tracking",
        description: "Call, form, and source data show where qualified leads come from.",
        icon: BarChart3,
      },
    ],
    visualTitle: "Visual Priorities for Service Businesses",
    visualPoints: [
      "Clear service-page hierarchy with practical CTA placement",
      "Mobile-first estimate request flow and trust-oriented layout",
      "Simple conversion and reporting view for lead visibility",
    ],
    sectionTintClassName: "bg-muted/30",
  },
  local: {
    pageGradientClassName:
      "bg-gradient-to-b from-background via-primary/[0.035] to-background dark:from-background dark:via-primary/[0.08] dark:to-background",
    glowOneClassName: "bg-primary/15 dark:bg-primary/12",
    glowTwoClassName: "bg-emerald-500/15 dark:bg-emerald-400/10",
    sectionSurfaceClassName: "border-primary/20 bg-card/70",
    heroClassName: "border-primary/20 bg-card shadow-sm",
    heroPanelClassName: "border-primary/20 bg-primary/5 shadow-sm",
    heroBodyClassName: "text-muted-foreground",
    eyebrow: "For local businesses scaling online",
    workflowTitle: "Booking and Conversion Workflow",
    workflowSteps: [
      {
        title: "Offer-focused entry",
        description: "Visitors reach pages matched to service intent and business type.",
        icon: Users,
      },
      {
        title: "Appointment path",
        description: "Structured booking actions guide visitors toward consultation or inquiry.",
        icon: Calendar,
      },
      {
        title: "Credibility layers",
        description: "Trust-focused layout and proof blocks reduce hesitation before contact.",
        icon: ShieldCheck,
      },
      {
        title: "Funnel insights",
        description: "Analytics tracking reveals where demand converts and where it stalls.",
        icon: BarChart3,
      },
    ],
    visualTitle: "Visual Priorities for Local Brand Trust",
    visualPoints: [
      "Polished section structure that supports credibility",
      "Clear CTA hierarchy for consultations and bookings",
      "Dashboard-style reporting visuals for conversion oversight",
    ],
    sectionTintClassName: "bg-gradient-to-b from-background to-muted/40",
  },
  startup: {
    pageGradientClassName:
      "bg-gradient-to-b from-background via-slate-900/[0.08] to-background dark:from-background dark:via-slate-900/[0.22] dark:to-background",
    glowOneClassName: "bg-violet-500/15 dark:bg-violet-400/10",
    glowTwoClassName: "bg-cyan-500/15 dark:bg-cyan-400/10",
    sectionSurfaceClassName: "border-slate-700/50 bg-slate-900/25",
    heroClassName:
      "border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100",
    heroPanelClassName: "border-slate-700 bg-slate-900/80",
    heroBodyClassName: "text-slate-300",
    eyebrow: "For startup founders and product teams",
    workflowTitle: "MVP Build-to-Scale Workflow",
    workflowSteps: [
      {
        title: "Scope and architecture",
        description: "Define MVP boundaries and technical structure before coding starts.",
        icon: Code,
      },
      {
        title: "Core product build",
        description: "Implement core flows across frontend, backend, and integration layers.",
        icon: Database,
      },
      {
        title: "Release readiness",
        description: "Performance, observability, and launch checks prepare stable rollout.",
        icon: Rocket,
      },
      {
        title: "Iteration loop",
        description: "Usage signals drive post-launch priorities without rewriting foundations.",
        icon: Workflow,
      },
    ],
    visualTitle: "Visual Priorities for Product Teams",
    visualPoints: [
      "Architecture-oriented layout and technical credibility cues",
      "SaaS-style UI framing for roadmap and delivery clarity",
      "Scalable system visuals for post-launch planning decisions",
    ],
    sectionTintClassName: "bg-slate-950/30",
  },
};

export interface PersonaLandingPageProps {
  slug: string;
  persona: PersonaVariant;
  title: string;
  subtitle: string;
  heroDescription: string;
  projectIds: string[];
  visualAssets?: {
    src: string;
    alt: string;
    caption: string;
  }[];
  painPoints: string[];
  outcomes: string[];
  serviceHighlights: string[];
  caseExamples: {
    title: string;
    summary: string;
  }[];
}

export function PersonaLandingPage({
  slug,
  persona,
  title,
  subtitle,
  heroDescription,
  projectIds,
  visualAssets,
  painPoints,
  outcomes,
  serviceHighlights,
  caseExamples,
}: PersonaLandingPageProps) {
  const config = PERSONA_CONFIG[persona];
  const highlightedProjects = projects
    .filter((project) => projectIds.includes(project.id))
    .slice(0, 3);
  const showcaseAssets =
    visualAssets && visualAssets.length > 0
      ? visualAssets.slice(0, 3)
      : highlightedProjects.map((project) => ({
          src: project.image,
          alt: `${project.title} visual`,
          caption: project.title,
        }));

  return (
    <div className="relative isolate overflow-hidden rounded-[2rem]">
      <PageSEO
        title={`${title} | Ascendra Technologies`}
        description={heroDescription}
        canonicalPath={`/${slug}`}
        schemaType="WebPage"
      />

      {/* Subtle decorative background layers to add depth without reducing CTA readability */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className={cn("absolute inset-0", config.pageGradientClassName)} />
        <div className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)] [background-image:linear-gradient(to_right,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div
          className={cn(
            "absolute -right-16 -top-16 h-72 w-72 rounded-full blur-3xl",
            config.glowOneClassName
          )}
        />
        <div
          className={cn(
            "absolute -bottom-20 -left-16 h-72 w-72 rounded-full blur-3xl",
            config.glowTwoClassName
          )}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <section
          className={cn(
            "rounded-2xl border p-5 shadow-lg shadow-black/[0.03] backdrop-blur-[1px] sm:p-8",
            config.heroClassName
          )}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {config.eyebrow}
              </p>
              <h1 className="text-3xl font-bold text-balance sm:text-4xl md:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className={cn("max-w-3xl text-base sm:text-lg", config.heroBodyClassName)}>
                {subtitle}
              </p>
              <p className={cn("max-w-3xl text-sm sm:text-base", config.heroBodyClassName)}>
                {heroDescription}
              </p>
              <div className="flex flex-col items-center justify-start gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="w-full h-auto px-4 py-3 text-center leading-snug whitespace-normal sm:w-auto"
                >
                  <Link href="/audit">
                    <Search className="mr-2 h-4 w-4" />
                    Get Your Free Website Growth Audit
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full h-auto px-4 py-3 text-center leading-snug whitespace-normal sm:w-auto"
                >
                  <Link href="/schedule">
                    Book a Strategy Call
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <Card className={cn("h-full border", config.heroPanelClassName)}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">{config.visualTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.visualPoints.map((point) => (
                  <div key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className={cn("text-sm", config.heroBodyClassName)}>{point}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          className={cn(
            "mt-8 rounded-2xl border p-4 shadow-sm backdrop-blur-[1px] sm:p-5",
            config.sectionTintClassName,
            config.sectionSurfaceClassName
          )}
        >
          <h2 className="mb-4 text-2xl font-semibold">Visual Direction and Quality References</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {showcaseAssets.map((asset) => (
              <Card
                key={asset.src}
                className="group h-full overflow-hidden border-border/70 bg-card/95 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={asset.src}
                    alt={asset.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    quality={90}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{asset.caption}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {highlightedProjects.map((project) => (
              <Card key={project.id} className="border-border/70 bg-card/95 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">{project.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  <Link
                    href={`/projects/${project.id}`}
                    className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                  >
                    View project reference
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle>{config.workflowTitle}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {config.workflowSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-lg border border-border/60 bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="h-full border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle>Pain Points We Solve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {painPoints.map((point) => (
                <div key={point} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm">{point}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="h-full border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle>Outcomes You Can Expect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outcomes.map((outcome) => (
                <div key={outcome} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm">{outcome}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle>What’s Included</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {serviceHighlights.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold">Case-Style Examples</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {caseExamples.map((example) => (
              <Card key={example.title} className="h-full border-border/70 bg-card/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{example.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

