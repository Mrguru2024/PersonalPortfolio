"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonaJourney } from "@shared/personaJourneys";
import { DIAGNOSTICS_HUB_PATH } from "@/lib/funnelCtas";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import {
  getPersonaEcosystemSpotlight,
  projectCaseStudyPath,
} from "@/lib/personaCaseStudies";
import {
  BEHANCE_MACON_URL,
  BEHANCE_STYLE_STUDIO_URL,
} from "@/lib/ecosystemProjects";
import { getPersonaRevenueBridge } from "@shared/personaRevenueMap";
import { PersonaOfferTeaser } from "@/components/persona-journey/PersonaOfferTeaser";

export interface PersonaJourneyPanelProps {
  journey: PersonaJourney;
  onChangePersona: () => void;
}

export function PersonaJourneyPanel({ journey, onChangePersona }: PersonaJourneyPanelProps) {
  const { track } = useVisitorTracking();
  const pageVisited = "/journey";
  const revenueBridge = getPersonaRevenueBridge(journey.id);

  const onMagnetClick = (magnetKey: "primary" | "secondary") => {
    const leadMagnetSlug =
      magnetKey === "primary" ? revenueBridge.primaryLeadMagnetSlug : revenueBridge.secondaryLeadMagnetSlug;
    track("persona_journey_lead_magnet_click", {
      pageVisited,
      component: "PersonaJourneyPanel",
      section: "persona_lead_magnet",
      metadata: {
        personaId: journey.id,
        magnet: magnetKey,
        ...(leadMagnetSlug ? { leadMagnetSlug } : {}),
      },
    });
  };

  const spotlight = getPersonaEcosystemSpotlight(journey.id, journey.caseStudyRefs);

  const trackExternal = (cta: string, url: string) => {
    track("cta_click", {
      pageVisited,
      metadata: { cta, personaId: journey.id, href: url },
    });
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2 text-muted-foreground hover:text-foreground mb-4"
          onClick={onChangePersona}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Choose a different path
        </Button>
        <p className="text-xs font-medium uppercase tracking-wide text-primary/90 mb-2">
          {journey.businessTypeLabel}
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {journey.headline}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl">{journey.subhead}</p>
        <p className="mt-4 text-sm sm:text-base text-foreground/90 max-w-2xl leading-relaxed">
          {journey.valueProposition}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/15 bg-gradient-to-b from-primary/5 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Start here — lead magnet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{journey.primaryLeadMagnet.blurb}</p>
            <Button asChild size="lg" className="w-full gap-2 min-h-[48px]">
              <Link
                href={journey.primaryLeadMagnet.href}
                onClick={() => onMagnetClick("primary")}
              >
                {journey.primaryLeadMagnet.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground pt-1">{journey.secondaryLeadMagnet.blurb}</p>
            <Button asChild variant="outline" size="lg" className="w-full gap-2 min-h-[48px]">
              <Link
                href={journey.secondaryLeadMagnet.href}
                onClick={() => onMagnetClick("secondary")}
              >
                {journey.secondaryLeadMagnet.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recommended next step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{journey.recommendedService.rationale}</p>
              <TrackedCtaLink
                href={journey.recommendedService.href}
                ctaLabel={`persona_service_${journey.id}`}
                pageVisited={pageVisited}
                extraMetadata={{ personaId: journey.id }}
                className="inline-flex items-center gap-2 text-base font-semibold text-primary underline-offset-4 hover:underline"
              >
                {journey.recommendedService.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </TrackedCtaLink>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <Button asChild size="lg" className="w-full min-h-[48px]">
                <TrackedCtaLink
                  href={journey.primaryCta.href}
                  ctaLabel={`persona_primary_cta_${journey.id}`}
                  pageVisited={pageVisited}
                  extraMetadata={{ personaId: journey.id }}
                  className="inline-flex w-full items-center justify-center gap-2"
                >
                  {journey.primaryCta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </TrackedCtaLink>
              </Button>
              {journey.secondaryCta ? (
                <Button asChild variant="outline" size="lg" className="w-full min-h-[48px]">
                  <TrackedCtaLink
                    href={journey.secondaryCta.href}
                    ctaLabel={`persona_secondary_cta_${journey.id}`}
                    pageVisited={pageVisited}
                    extraMetadata={{ personaId: journey.id }}
                    className="inline-flex w-full items-center justify-center"
                  >
                    {journey.secondaryCta.label}
                  </TrackedCtaLink>
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Not sure which tool?{" "}
              <Link href={DIAGNOSTICS_HUB_PATH} className="font-medium text-primary underline-offset-4 hover:underline">
                Open the diagnostics hub
              </Link>{" "}
              to compare scan vs questionnaire vs assessment.
            </p>
          </CardContent>
        </Card>
      </div>

      {revenueBridge.flagshipOfferSlug ? (
        <PersonaOfferTeaser
          personaId={journey.id}
          offerSlug={revenueBridge.flagshipOfferSlug}
          problemLine={journey.pains[0] ?? journey.headline}
          pageVisited={pageVisited}
        />
      ) : null}

      <section aria-labelledby="persona-trust-heading" className="space-y-3">
        <h2 id="persona-trust-heading" className="text-xl font-semibold text-foreground">
          {journey.trustIntro}
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground max-w-3xl">
          {journey.trustPoints.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="text-sm sm:text-base text-foreground/90 max-w-3xl pt-2">{journey.educationBlurb}</p>
      </section>

      <section aria-labelledby="persona-case-studies-heading" className="space-y-4">
        <h2 id="persona-case-studies-heading" className="text-xl font-semibold text-foreground">
          Related work
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          One example from each pillar of the Brand Growth ecosystem — Ascendra (web &amp; systems), Macon Designs®
          (brand visuals), and Style Studio Branding (strategy &amp; production design). We rotate portfolio picks by
          path so different journeys surface different work; your refs still anchor the Ascendra story when present.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3 max-w-5xl">
          <li>
            <TrackedCtaLink
              href={projectCaseStudyPath(spotlight.ascendra.id)}
              ctaLabel={`persona_case_study_${spotlight.ascendra.id}`}
              pageVisited={pageVisited}
              extraMetadata={{ personaId: journey.id, projectId: spotlight.ascendra.id, pillar: "ascendra" }}
              className="block h-full rounded-xl border border-border/80 bg-card/50 hover:bg-card hover:border-primary/30 transition-colors p-4 min-h-[88px]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Ascendra</span>
              <span className="block font-medium text-foreground text-sm sm:text-base mt-1">
                {spotlight.ascendra.title}
              </span>
              <span className="block text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {spotlight.ascendra.description}
              </span>
              {spotlight.ascendra.synopsis?.caseStudy?.problem ? (
                <span className="block text-xs text-muted-foreground mt-2 border-l-2 border-primary/35 pl-2.5 leading-relaxed line-clamp-3">
                  <span className="font-medium text-foreground/85">Challenge: </span>
                  {spotlight.ascendra.synopsis.caseStudy.problem}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2">
                View case study
                <ArrowRight className="h-3 w-3" aria-hidden />
              </span>
            </TrackedCtaLink>
          </li>
          <li>
            <div className="h-full rounded-xl border border-border/80 bg-card/50 hover:bg-card hover:border-primary/30 transition-colors p-4 min-h-[88px] flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Macon Designs®</span>
              <span className="block font-medium text-foreground text-sm sm:text-base mt-1">{spotlight.macon.title}</span>
              <span className="block text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">
                {spotlight.macon.description}
              </span>
              <div className="flex flex-col gap-1.5 mt-3">
                <a
                  href={BEHANCE_MACON_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                  onClick={() => trackExternal("persona_partner_behance_macon", BEHANCE_MACON_URL)}
                >
                  View on Behance
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                <Link
                  href="/partners/macon-designs"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Partner profile
                </Link>
              </div>
            </div>
          </li>
          <li>
            <div className="h-full rounded-xl border border-border/80 bg-card/50 hover:bg-card hover:border-primary/30 transition-colors p-4 min-h-[88px] flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Style Studio</span>
              <span className="block font-medium text-foreground text-sm sm:text-base mt-1">
                {spotlight.styleStudio.title}
              </span>
              <span className="block text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-3 flex-1">
                {spotlight.styleStudio.description}
              </span>
              <div className="flex flex-col gap-1.5 mt-3">
                <a
                  href={BEHANCE_STYLE_STUDIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                  onClick={() => trackExternal("persona_partner_behance_style_studio", BEHANCE_STYLE_STUDIO_URL)}
                >
                  View on Behance
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                <Link
                  href="/partners/style-studio-branding"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Partner profile
                </Link>
              </div>
            </div>
          </li>
        </ul>
        {spotlight.ascendraMore.length > 0 ? (
          <div className="max-w-5xl pt-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Also from Ascendra</p>
            <ul className="flex flex-wrap gap-2">
              {spotlight.ascendraMore.map((p) => (
                <li key={p.id}>
                  <TrackedCtaLink
                    href={projectCaseStudyPath(p.id)}
                    ctaLabel={`persona_case_study_${p.id}`}
                    pageVisited={pageVisited}
                    extraMetadata={{ personaId: journey.id, projectId: p.id }}
                    className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50"
                  >
                    {p.title}
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </TrackedCtaLink>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="persona-faq-heading" className="space-y-4">
        <h2 id="persona-faq-heading" className="text-xl font-semibold text-foreground">
          Quick answers
        </h2>
        <div className="space-y-4 max-w-3xl">
          {journey.faqs.map((f) => (
            <div key={f.question} className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
              <h3 className="font-medium text-foreground text-sm sm:text-base">{f.question}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
