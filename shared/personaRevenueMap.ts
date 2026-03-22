/**
 * Thin bridge from public journey personas → existing revenue systems (no new engines).
 *
 * - flagshipOfferSlug → `site_offers.slug` (loaded via GET /api/offers/[slug])
 * - leadMagnetSlugs → align with `funnel_content_assets.lead_magnet_slug` / funnel paths for analytics
 */
import type { PersonaJourneyId } from "./personaJourneys";

export interface PersonaRevenueBridge {
  /** DB `site_offers.slug`; public JSON at /api/offers/[slug] */
  flagshipOfferSlug?: string;
  /** Optional slugs for visitor tracking + future asset placement alignment */
  primaryLeadMagnetSlug?: string;
  secondaryLeadMagnetSlug?: string;
}

export const PERSONA_REVENUE_MAP: Record<PersonaJourneyId, PersonaRevenueBridge> = {
  "marcus-trades": {
    flagshipOfferSlug: "startup-growth-system",
    primaryLeadMagnetSlug: "digital-growth-audit",
    secondaryLeadMagnetSlug: "growth-diagnosis",
  },
  "kristopher-studio": {
    flagshipOfferSlug: "startup-growth-system",
    primaryLeadMagnetSlug: "homepage-conversion-blueprint",
    secondaryLeadMagnetSlug: "digital-growth-audit",
  },
  "tasha-beauty": {
    flagshipOfferSlug: "startup-growth-system",
    primaryLeadMagnetSlug: "diagnosis",
    secondaryLeadMagnetSlug: "free-growth-tools",
  },
  "devon-saas": {
    flagshipOfferSlug: "startup-growth-system",
    primaryLeadMagnetSlug: "startup-growth-kit",
    secondaryLeadMagnetSlug: "startup-website-score",
  },
  "chef-food": {
    flagshipOfferSlug: "startup-growth-system",
    primaryLeadMagnetSlug: "competitor-position-snapshot",
    secondaryLeadMagnetSlug: "local-business-growth",
  },
  "denishia-creative": {
    flagshipOfferSlug: "startup-growth-system",
    primaryLeadMagnetSlug: "digital-growth-audit",
    secondaryLeadMagnetSlug: "startup-growth-system",
  },
};

export function getPersonaRevenueBridge(id: PersonaJourneyId): PersonaRevenueBridge {
  return PERSONA_REVENUE_MAP[id] ?? {};
}
