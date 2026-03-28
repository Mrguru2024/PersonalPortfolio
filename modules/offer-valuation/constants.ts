import type { DataVisibilityTier } from "@shared/accessScope";
import type { OfferValuationClientExperienceMode } from "@shared/schema";

export const OFFER_VALUATION_ENTITY_TYPE = "offer_valuation_engine";
export const OFFER_VALUATION_ENTITY_ID = "global";

export const OFFER_VALUATION_DEFAULT_VISIBILITY: DataVisibilityTier = "internal_only";
export const OFFER_VALUATION_DEFAULT_MODE: OfferValuationClientExperienceMode =
  "included_service";
