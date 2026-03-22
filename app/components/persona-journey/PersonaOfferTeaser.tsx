"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonaJourneyId } from "@shared/personaJourneys";
import { DEFAULT_OFFER_SECTIONS, type OfferSections } from "@/lib/offerSections";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";

interface OfferApiRow {
  slug: string;
  name?: string;
  sections?: OfferSections;
}

export interface PersonaOfferTeaserProps {
  personaId: PersonaJourneyId;
  offerSlug: string;
  /** One-line “problem” from persona (e.g. top pain) */
  problemLine: string;
  pageVisited: string;
}

/**
 * Compact “Grand Slam” preview: persona problem + hero/price from existing site_offers API.
 */
export function PersonaOfferTeaser({ personaId, offerSlug, problemLine, pageVisited }: PersonaOfferTeaserProps) {
  const { track } = useVisitorTracking();
  const viewSent = useRef(false);

  const { data, isSuccess, isError, isPending } = useQuery({
    queryKey: ["/api/offers", offerSlug],
    queryFn: async (): Promise<OfferApiRow | null> => {
      const res = await fetch(`/api/offers/${encodeURIComponent(offerSlug)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load offer");
      return res.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isSuccess || !data || viewSent.current) return;
    viewSent.current = true;
    track("section_engagement", {
      pageVisited,
      component: "PersonaOfferTeaser",
      section: "persona_offer_teaser",
      metadata: { personaId, offerSlug },
    });
  }, [isSuccess, data, track, pageVisited, personaId, offerSlug]);

  if (isPending || isError) return null;
  if (!data) return null;

  const sections = (data.sections as OfferSections | undefined) ?? DEFAULT_OFFER_SECTIONS;
  const hero = sections.hero ?? DEFAULT_OFFER_SECTIONS.hero!;
  const price = sections.price ?? DEFAULT_OFFER_SECTIONS.price!;
  const offerPath = `/offers/${encodeURIComponent(offerSlug)}`;

  return (
    <section aria-labelledby="persona-offer-teaser-heading">
      <Card className="border-secondary/25 bg-gradient-to-br from-secondary/5 via-background to-primary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Core offer</span>
          </div>
          <CardTitle id="persona-offer-teaser-heading" className="text-lg sm:text-xl pt-1">
            Matched to your situation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Problem</p>
            <p className="text-sm text-foreground mt-1 leading-relaxed">{problemLine}</p>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{hero.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{hero.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xs font-medium text-muted-foreground">{price.label}</span>
            <span className="text-lg font-bold text-primary">{price.amount}</span>
            <span className="text-xs text-muted-foreground">{price.note}</span>
          </div>
          <Button asChild size="lg" className="gap-2 min-h-[48px] w-full sm:w-fit">
            <TrackedCtaLink
              href={offerPath}
              ctaLabel="persona_offer_teaser_primary"
              pageVisited={pageVisited}
              extraMetadata={{ personaId, offerSlug }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2"
            >
              View full offer &amp; deliverables
              <ArrowRight className="h-4 w-4" aria-hidden />
            </TrackedCtaLink>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
