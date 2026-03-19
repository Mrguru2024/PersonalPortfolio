"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquare,
  Map,
  Layout,
  ClipboardList,
  Target,
  Zap,
  Sparkles,
  BarChart3,
  Lightbulb,
  Rocket,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSEO } from "@/components/SEO";
import {
  DEFAULT_OFFER_SECTIONS,
  type OfferSections,
  type OfferDeliverable,
} from "@/lib/offerSections";

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  MessageSquare,
  Map,
  Layout,
  ClipboardList,
  CheckCircle2,
  Target,
  Zap,
  Sparkles,
  BarChart3,
  Lightbulb,
  Rocket,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? FileText;
}

export default function StartupGrowthSystemOfferPage() {
  const { data: offer, isFetched } = useQuery({
    queryKey: ["/api/offers", "startup-growth-system"],
    queryFn: async () => {
      const res = await fetch("/api/offers/startup-growth-system");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const sections: OfferSections = isFetched && offer?.sections
    ? (offer.sections as OfferSections)
    : DEFAULT_OFFER_SECTIONS;

  const metaTitle = offer?.metaTitle ?? "Startup growth system | Affordable audit for founders";
  const metaDescription =
    offer?.metaDescription ??
    "A practical startup growth audit for founders who can't yet afford a full agency build. Website audit, messaging clarity, conversion roadmap, and actionable plan. $249–$399.";

  const hero = sections.hero ?? DEFAULT_OFFER_SECTIONS.hero!;
  const price = sections.price ?? DEFAULT_OFFER_SECTIONS.price!;
  const deliverables = sections.deliverables ?? DEFAULT_OFFER_SECTIONS.deliverables!;
  const bullets = sections.bullets ?? DEFAULT_OFFER_SECTIONS.bullets!;
  const cta = sections.cta ?? DEFAULT_OFFER_SECTIONS.cta!;

  // Fallback hero media when the CMS/DB entry doesn't provide an image.
  const fallbackHeroImageUrl =
    "/Video Content_Ascendra_Files/Ascendra_Business Launch Promo/(Footage)/Asset/Growth_11.jpg";

  return (
    <>
      <PageSEO
        title={metaTitle}
        description={metaDescription}
        canonicalPath="/offers/startup-growth-system"
      />
      <div className="w-full min-w-0 max-w-full overflow-x-hidden py-10 sm:py-14 bg-gradient-to-b from-primary/5 via-background to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-3 fold:px-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-10 sm:space-y-12">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
              <Image
                src={sections.graphics?.bannerUrl ?? fallbackHeroImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>

            <section className="text-center">
              <div className="relative w-full max-w-md mx-auto aspect-video mb-6 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={hero.imageUrl ?? fallbackHeroImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
                {hero.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {hero.subtitle}
              </p>
            </section>

            <section className="rounded-xl border-2 border-primary/20 bg-card p-6 sm:p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {price.label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {price.amount}
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {price.note}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
                What you get
              </h2>
              <div className="space-y-4">
                {deliverables.map((d: OfferDeliverable, i: number) => {
                  const Icon = getIcon(d.icon);
                  return (
                    <Card key={i} className="border-border bg-card">
                      <CardContent className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                        {d.imageUrl ? (
                          <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-primary/10">
                            <Image src={d.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{d.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{d.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 min-h-[48px]">
                <Link href={cta.buttonHref}>
                  {cta.buttonText}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {cta.footnote && (
                <p className="text-xs text-muted-foreground mt-3">{cta.footnote}</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
