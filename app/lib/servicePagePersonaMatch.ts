import type { PersonaJourney, PersonaJourneyId } from "@shared/personaJourneys";
import { PERSONA_JOURNEYS_BY_ID } from "@shared/personaJourneys";

function journeyTargetsPath(journey: PersonaJourney, pathname: string): boolean {
  if (journey.recommendedService.href === pathname) return true;
  if (journey.primaryCta.href === pathname) return true;
  if (journey.secondaryCta?.href === pathname) return true;
  return false;
}

/**
 * When the visitor has an active persona and this path is one of that journey's service/CTA targets,
 * return the journey for personalized hero messaging.
 */
export function getMatchedPersonaJourneyForPath(
  pathname: string,
  activePersonaId: PersonaJourneyId | null
): PersonaJourney | null {
  if (!activePersonaId) return null;
  const journey = PERSONA_JOURNEYS_BY_ID[activePersonaId];
  if (!journey) return null;
  return journeyTargetsPath(journey, pathname) ? journey : null;
}
