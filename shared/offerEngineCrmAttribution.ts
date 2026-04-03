/**
 * Standard `crm_contacts.customFields` keys for Offer Engine + funnel attribution.
 * Forms and APIs should use these exact strings so reporting stays consistent.
 */
export const ASCENDRA_CRM_OFFER_ENGINE_KEYS = [
  "sourceSiteOfferSlug",
  "sourceOfferEngineTemplateId",
  "sourceOfferEngineTemplateSlug",
  "sourceLeadMagnetTemplateId",
  "sourceLeadMagnetTemplateSlug",
  "sourceAscendraIqLeadMagnetId",
  "sourceFunnelPathSlug",
  "trafficTemperature",
] as const;

export type AscendraCrmOfferEngineKey = (typeof ASCENDRA_CRM_OFFER_ENGINE_KEYS)[number];

/** Narrow unknown records to Offer Engine attribution keys (non-destructive). */
export function pickOfferEngineAttributionFields(
  source: Record<string, unknown> | null | undefined,
): Partial<Record<AscendraCrmOfferEngineKey, unknown>> {
  if (!source || typeof source !== "object") return {};
  const out: Partial<Record<AscendraCrmOfferEngineKey, unknown>> = {};
  for (const k of ASCENDRA_CRM_OFFER_ENGINE_KEYS) {
    if (k in source && source[k] !== undefined && source[k] !== null && source[k] !== "") {
      out[k] = source[k];
    }
  }
  return out;
}
