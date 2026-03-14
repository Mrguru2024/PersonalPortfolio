import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink, Palette, Code2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { projects } from "@/lib/data";

const MACON_LOGO_BADGE = "/Ascendra images/logomacondesigns/Macon Designs_Logo_Tagline_Badge.png";
const ASCENDRA_LOGO = "/ascendra-logo.svg";
const BEHANCE_MACON_URL = "https://www.behance.net/macondesigns";
const STYLE_STUDIO_LOGO_LIGHT = "/Ascendra images/Stylestudiologos/StyleStudio_Blk_Rd_.png";
const STYLE_STUDIO_LOGO_DARK = "/Ascendra images/Stylestudiologos/StyleStudio_Wt_Rd_.png";
/** @deprecated Use STYLE_STUDIO_LOGO_LIGHT / STYLE_STUDIO_LOGO_DARK for theme-aware display */
const STYLE_STUDIO_LOGO = STYLE_STUDIO_LOGO_LIGHT;
const BEHANCE_STYLE_STUDIO_URL = "https://www.behance.net/kwilliams7";

/** Macon Designs (Denishia Macon-Lynn) — projects from Behance portfolio */
const MACON_PROJECTS = [
  {
    id: "social-media-branding-kits",
    title: "Social Media Branding Kits",
    description: "Cohesive visual systems for social channels—templates, assets, and guidelines for consistent brand presence.",
    tags: ["Brand identity", "Social media", "Visual systems"],
  },
  {
    id: "wwe-promo-motion",
    title: "WWE-Inspired Promo & Motion Graphics",
    description: "Promo and motion graphics for events and campaigns. Bold typography and dynamic visuals.",
    tags: ["Motion graphics", "Promo", "Event branding"],
  },
  {
    id: "hbo-production",
    title: "HBO Production Work",
    description: "Design and production for broadcast and entertainment. Professional presentation and brand alignment.",
    tags: ["Production design", "Broadcast", "Entertainment"],
  },
  {
    id: "conference-branding",
    title: "Conference & Event Branding",
    description: "Full branding for conferences including National Business League, National Urban League, and National Black Business events.",
    tags: ["Event branding", "Conference", "Identity systems"],
  },
  {
    id: "sc250-exhibit",
    title: "SC250 Revolutionary War Exhibit Banner",
    description: "Exhibit and environmental graphics. Historical and institutional visual storytelling.",
    tags: ["Exhibit design", "Environmental", "Institutional"],
  },
  {
    id: "harp-method-branding",
    title: "HARP Method Branding — G. Patrick Griffin",
    description: "Brand identity and visual system for the HARP Method. Strategy-led design for professional positioning.",
    tags: ["Brand identity", "Visual systems", "Professional services"],
  },
];

/** Style Studio Branding (Kristopher Williams) — projects from Behance portfolio */
const STYLE_STUDIO_PROJECTS = [
  {
    id: "scecep-empowerment",
    title: "SCECEP Empowerment Program",
    description: "Program branding and visual identity for the SCECEP Empowerment Program. Clear, professional presentation for community and education initiatives.",
    tags: ["Program branding", "Visual identity", "Education"],
  },
  {
    id: "osaic-presentations",
    title: "Osaic corporate materials",
    description: "Powerpoint presentations, facts questionnaires, bond credit ratings booklet, social media program sheets, and institutions data sheets. Corporate design at scale.",
    tags: ["Corporate design", "Presentations", "Print"],
  },
  {
    id: "dekalb-school-flyer",
    title: "Dekalb County School Flyer / Brochure",
    description: "Flyer and brochure design for Dekalb County Schools. Clean layout and on-brand messaging for education and outreach.",
    tags: ["Print design", "Brochure", "Education"],
  },
  {
    id: "louisiana-housing-conference",
    title: "Louisiana Housing Conference",
    description: "Conference branding and marketing materials. Event identity and collateral for the Louisiana Housing Conference.",
    tags: ["Conference branding", "Event design", "Marketing"],
  },
  {
    id: "traveling-blackboard",
    title: "Traveling Blackboard Marketing Project",
    description: "Marketing campaign and visual assets for the Traveling Blackboard initiative. Campaign-driven design for engagement.",
    tags: ["Campaign design", "Marketing", "Visual assets"],
  },
  {
    id: "back2basics-foundation",
    title: "Back 2 Basics Business Foundation",
    description: "Brand and visual materials for the Back 2 Basics Business Foundation. Strategic design for business and community programs.",
    tags: ["Brand identity", "Business", "Foundation"],
  },
];

export const metadata: Metadata = {
  title: "Results & Work | Ascendra Technologies",
  description:
    "Selected project examples showing challenge, solution direction, and the type of business each build is best suited for.",
};

const featuredProjects = projects.slice(0, 6);

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

          {/* Ecosystem partner portfolio — Macon Designs (Denishia) */}
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
                  src={MACON_LOGO_BADGE}
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
                  <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                    <div className="flex items-start gap-2 mb-2">
                      <Palette className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                        Macon Designs
                      </p>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex-1">
                      {project.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {project.tags.join(" · ")}
                    </p>
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

          {/* Style Studio Branding (Kristopher Williams) */}
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
                  src={STYLE_STUDIO_LOGO_LIGHT}
                  alt="Style Studio Branding"
                  fill
                  className="object-contain object-left dark:hidden"
                  sizes="96px"
                />
                <Image
                  src={STYLE_STUDIO_LOGO_DARK}
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
                  <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                    <div className="flex items-start gap-2 mb-2">
                      <Megaphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                        Style Studio Branding
                      </p>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex-1">
                      {project.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {project.tags.join(" · ")}
                    </p>
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

          {/* Ascendra Technologies — web & technology projects */}
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
                  src={ASCENDRA_LOGO}
                  alt="Ascendra Technologies"
                  fill
                  className="object-contain object-left"
                  sizes="96px"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            {featuredProjects.map((project) => {
              const caseStudy = project.synopsis?.caseStudy;
              return (
                <Card key={project.id} className="border-border bg-card h-full">
                  <CardContent className="p-5 sm:p-6 space-y-4">
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
                      <h2 className="text-2xl font-semibold text-foreground">
                        {project.title}
                      </h2>
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
            </div>
          </section>

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
