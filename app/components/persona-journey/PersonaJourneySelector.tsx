"use client";

import { useState, type ReactNode } from "react";
import {
  Calculator,
  Gem,
  Palette,
  PenLine,
  Rocket,
  Sparkles,
  UtensilsCrossed,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PERSONA_JOURNEYS_PRIMARY,
  PERSONA_JOURNEYS_MORE,
  type PersonaJourney,
  type PersonaJourneyId,
} from "@shared/personaJourneys";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ICONS: Record<PersonaJourneyId, ReactNode> = {
  "marcus-trades": <Wrench className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "kristopher-studio": <Palette className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "tasha-beauty": <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "devon-saas": <Rocket className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "chef-food": <UtensilsCrossed className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "denishia-creative": <PenLine className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "high-ticket-owner": <Gem className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "tax-business-owner": <Calculator className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
};

export interface PersonaJourneySelectorProps {
  variant?: "full" | "compact";
  /** Fired after analytics; use for navigation or parent state. */
  onSelect: (id: PersonaJourneyId) => void;
  className?: string;
  /** For analytics */
  pageVisited?: string;
}

function JourneyCardButton({
  p,
  variant,
  pageVisited,
  tier,
  onSelect,
  track,
}: {
  p: PersonaJourney;
  variant: "full" | "compact";
  pageVisited: string;
  tier: "primary" | "more";
  onSelect: (id: PersonaJourneyId) => void;
  track: ReturnType<typeof useVisitorTracking>["track"];
}) {
  return (
    <button
      type="button"
      role="listitem"
      onClick={() => {
        track("persona_journey_selected", {
          pageVisited,
          component: "PersonaJourneySelector",
          section: "persona_selector",
          metadata: { personaId: p.id, variant, selectorTier: tier },
        });
        onSelect(p.id);
      }}
      className={cn(
        "text-left rounded-2xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/35 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "compact" ? "p-4 min-h-[88px]" : "p-5 sm:p-6 min-h-[100px]"
      )}
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0 space-y-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5">{ICONS[p.id]}</span>
            <div className="min-w-0 space-y-1">
              <h3
                className={cn(
                  "font-semibold text-foreground leading-snug",
                  variant === "compact" ? "text-sm sm:text-base" : "text-base sm:text-lg"
                )}
              >
                {p.selectorTitle}
              </h3>
              <p
                className={cn(
                  "text-muted-foreground leading-relaxed",
                  variant === "compact" ? "text-xs sm:text-sm line-clamp-3" : "text-sm line-clamp-4"
                )}
              >
                {p.selectorSubtitle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function PersonaJourneySelector({
  variant = "full",
  onSelect,
  className,
  pageVisited = "/",
}: PersonaJourneySelectorProps) {
  const { track } = useVisitorTracking();
  const [moreOpen, setMoreOpen] = useState(false);

  const gridClass =
    variant === "compact"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5";

  return (
    <div className={cn("space-y-6", className)}>
      <div className={gridClass} role="list" aria-label="Primary business paths">
        {PERSONA_JOURNEYS_PRIMARY.map((p) => (
          <JourneyCardButton
            key={p.id}
            p={p}
            variant={variant}
            pageVisited={pageVisited}
            tier="primary"
            onSelect={onSelect}
            track={track}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between gap-2 h-auto py-2 px-1 text-left font-medium text-foreground hover:bg-transparent"
          onClick={() => {
            const next = !moreOpen;
            setMoreOpen(next);
            track("persona_journey_more_toggle", {
              pageVisited,
              component: "PersonaJourneySelector",
              section: "persona_selector_more",
              metadata: { open: next, variant },
            });
          }}
          aria-expanded={moreOpen}
          aria-controls="persona-journey-more-paths"
        >
          <span>Additional paths</span>
          <ChevronDown
            className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", moreOpen && "rotate-180")}
            aria-hidden
          />
        </Button>
        <p className="text-xs sm:text-sm text-muted-foreground -mt-1 mb-3 pl-1 pr-10">
          High-ticket operators and tax practices — same tools, lead magnets, and next steps as the core journeys.
        </p>
        {moreOpen && (
          <div id="persona-journey-more-paths" className={cn(gridClass, "pt-1")} role="list" aria-label="Additional business paths">
            {PERSONA_JOURNEYS_MORE.map((p) => (
              <JourneyCardButton
                key={p.id}
                p={p}
                variant={variant}
                pageVisited={pageVisited}
                tier="more"
                onSelect={onSelect}
                track={track}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
