"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePersonaJourney } from "@/hooks/usePersonaJourney";
import { getMatchedPersonaJourneyForPath } from "@/lib/servicePagePersonaMatch";
import { PERSONA_JOURNEY_PATH } from "@/lib/funnelCtas";
import { cn } from "@/lib/utils";

function PersonaServiceHeroAccentInner({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  const { activeId, hydrated } = usePersonaJourney();

  if (!hydrated || !activeId) return null;

  const match = getMatchedPersonaJourneyForPath(pathname, activeId);
  if (!match) return null;

  return (
    <div
      className={cn(
        "mx-auto mb-5 sm:mb-6 max-w-2xl rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:px-5 sm:py-4 text-left shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your selected path</p>
      <p className="mt-1.5 text-sm sm:text-base font-semibold text-foreground leading-snug">{match.headline}</p>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">{match.subhead}</p>
      <Link
        href={`${PERSONA_JOURNEY_PATH}?journey=${encodeURIComponent(match.id)}`}
        className="mt-2 inline-block text-xs sm:text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        View full journey
      </Link>
    </div>
  );
}

/** Shows journey-aware copy when `localStorage` / URL persona matches this service page. */
export function PersonaServiceHeroAccent(props: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <PersonaServiceHeroAccentInner {...props} />
    </Suspense>
  );
}
