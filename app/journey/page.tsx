"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { usePersonaJourney } from "@/hooks/usePersonaJourney";
import { PersonaJourneySelector } from "@/components/persona-journey/PersonaJourneySelector";
import { PersonaJourneyPanel } from "@/components/persona-journey/PersonaJourneyPanel";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { DIAGNOSTICS_HUB_PATH, PERSONA_JOURNEY_PATH } from "@/lib/funnelCtas";
import { SectionReveal } from "@/components/motion";

function JourneyPageInner() {
  const { journey, setPersona, clearPersona, hydrated, activeId } = usePersonaJourney();
  const { track } = useVisitorTracking();
  const lastViewedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    if (lastViewedRef.current === activeId) return;
    lastViewedRef.current = activeId;
    track("persona_journey_viewed", {
      pageVisited: PERSONA_JOURNEY_PATH,
      component: "JourneyPage",
      section: "persona_journey",
      metadata: { personaId: activeId },
    });
  }, [hydrated, activeId, track]);

  if (!hydrated) {
    return (
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 py-20 text-center text-muted-foreground text-sm">
        Loading your path…
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden pb-12 sm:pb-16">
      <div className="container mx-auto px-3 fold:px-4 sm:px-6 max-w-5xl pt-10 sm:pt-14">
        <SectionReveal>
          {!journey ? (
            <div className="space-y-8 sm:space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  Choose the path that fits you
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  What best describes your business? We&apos;ll match you to the right tools, messaging, and next step
                  — lead systems, conversion, and automation first.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Prefer to pick a diagnostic?{" "}
                  <Link
                    href={DIAGNOSTICS_HUB_PATH}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open the diagnostics hub
                  </Link>
                  .
                </p>
              </div>
              <PersonaJourneySelector variant="full" pageVisited={PERSONA_JOURNEY_PATH} onSelect={setPersona} />
            </div>
          ) : (
            <PersonaJourneyPanel journey={journey} onChangePersona={clearPersona} />
          )}
        </SectionReveal>
      </div>
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-3 py-20 text-center text-muted-foreground text-sm">Loading…</div>
      }
    >
      <JourneyPageInner />
    </Suspense>
  );
}
