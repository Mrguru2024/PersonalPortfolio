"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PERSONA_JOURNEYS_BY_ID,
  isPersonaJourneyId,
  type PersonaJourneyId,
} from "@shared/personaJourneys";

const STORAGE_KEY = "ascendra_persona_journey_v1";

function readStoredId(): PersonaJourneyId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && isPersonaJourneyId(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * URL `?journey=<id>` + localStorage. On `/journey`, updates query; elsewhere navigates to `/journey?journey=`.
 */
export function usePersonaJourney() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = useState<PersonaJourneyId | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const q = searchParams.get("journey");
    if (q && isPersonaJourneyId(q)) {
      setActiveId(q);
      try {
        localStorage.setItem(STORAGE_KEY, q);
      } catch {
        /* ignore */
      }
      setHydrated(true);
      return;
    }
    setActiveId(readStoredId());
    setHydrated(true);
  }, [searchParams]);

  const journey = useMemo(
    () => (activeId ? PERSONA_JOURNEYS_BY_ID[activeId] : undefined),
    [activeId]
  );

  const setPersona = useCallback(
    (id: PersonaJourneyId) => {
      setActiveId(id);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* ignore */
      }
      const next = `/journey?journey=${encodeURIComponent(id)}`;
      if (pathname === "/journey") {
        router.replace(next, { scroll: false });
      } else {
        router.push(next);
      }
    },
    [pathname, router]
  );

  const clearPersona = useCallback(() => {
    setActiveId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (pathname === "/journey") {
      router.replace("/journey", { scroll: false });
    }
  }, [pathname, router]);

  return { activeId, journey, setPersona, clearPersona, hydrated };
}
