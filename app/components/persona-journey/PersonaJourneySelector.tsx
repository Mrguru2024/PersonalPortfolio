"use client";

import type { ReactNode } from "react";
import { Palette, PenLine, Rocket, Sparkles, UtensilsCrossed, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERSONA_JOURNEYS, type PersonaJourneyId } from "@shared/personaJourneys";
import { useVisitorTracking } from "@/lib/useVisitorTracking";
import { Card, CardContent } from "@/components/ui/card";

const ICONS: Record<PersonaJourneyId, ReactNode> = {
  "marcus-trades": <Wrench className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "kristopher-studio": <Palette className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "tasha-beauty": <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "devon-saas": <Rocket className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "chef-food": <UtensilsCrossed className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
  "denishia-creative": <PenLine className="h-5 w-5 shrink-0 text-primary" aria-hidden />,
};

export interface PersonaJourneySelectorProps {
  variant?: "full" | "compact";
  /** Fired after analytics; use for navigation or parent state. */
  onSelect: (id: PersonaJourneyId) => void;
  className?: string;
  /** For analytics */
  pageVisited?: string;
}

export function PersonaJourneySelector({
  variant = "full",
  onSelect,
  className,
  pageVisited = "/",
}: PersonaJourneySelectorProps) {
  const { track } = useVisitorTracking();

  const gridClass =
    variant === "compact"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5";

  return (
    <div className={cn(gridClass, className)} role="list">
      {PERSONA_JOURNEYS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="listitem"
          onClick={() => {
            track("persona_journey_selected", {
              pageVisited,
              component: "PersonaJourneySelector",
              section: "persona_selector",
              metadata: { personaId: p.id, variant },
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
      ))}
    </div>
  );
}
