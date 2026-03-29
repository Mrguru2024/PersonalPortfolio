/**
 * Unified metadata contract for Ascendra Experimentation Engine (AEE).
 * Pass through `useVisitorTracking(..., { metadata: buildAeeEventMetadata(...) })` or merge keys manually.
 */
export const AEE_METADATA_KEYS = {
  experimentKey: "experiment_key",
  experimentId: "experiment_id",
  variantKey: "variant_key",
  variantId: "variant_id",
  personaKey: "persona_key",
  marketRegion: "market_region",
  marketCity: "market_city",
  funnelStage: "funnel_stage",
  offerType: "offer_type",
} as const;

export type AeeEventMetadataInput = {
  experimentKey?: string;
  experimentId?: number;
  variantKey?: string;
  variantId?: number;
  personaKey?: string;
  marketRegion?: string;
  marketCity?: string;
  funnelStage?: string;
  offerType?: string;
};

export function buildAeeEventMetadata(input: AeeEventMetadataInput): Record<string, string | number> {
  const m: Record<string, string | number> = {};
  if (input.experimentKey) m[AEE_METADATA_KEYS.experimentKey] = input.experimentKey;
  if (input.experimentId != null) m[AEE_METADATA_KEYS.experimentId] = input.experimentId;
  if (input.variantKey) m[AEE_METADATA_KEYS.variantKey] = input.variantKey;
  if (input.variantId != null) m[AEE_METADATA_KEYS.variantId] = input.variantId;
  if (input.personaKey) m[AEE_METADATA_KEYS.personaKey] = input.personaKey;
  if (input.marketRegion) m[AEE_METADATA_KEYS.marketRegion] = input.marketRegion;
  if (input.marketCity) m[AEE_METADATA_KEYS.marketCity] = input.marketCity;
  if (input.funnelStage) m[AEE_METADATA_KEYS.funnelStage] = input.funnelStage;
  if (input.offerType) m[AEE_METADATA_KEYS.offerType] = input.offerType;
  return m;
}
