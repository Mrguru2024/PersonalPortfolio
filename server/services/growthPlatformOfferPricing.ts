import { getPublicPricingSnapshotForEngineTemplateSlug } from "./offerEnginePublicPricing";
import type { PublicOfferPricingSnapshot } from "@shared/publicOfferPricingSnapshot";
import { storage } from "@server/storage";

/**
 * Server-only pricing for /growth-platform (and recommendation).
 *
 * 1. `GROWTH_PLATFORM_OFFER_ENGINE_SLUG` — `offer_engine_offer_templates.slug` (direct).
 * 2. Else `GROWTH_PLATFORM_SITE_OFFER_SLUG` — `site_offers.slug` whose `offer_engine_template_slug` links the template.
 */
export async function loadGrowthPlatformEnginePricing(): Promise<PublicOfferPricingSnapshot | null> {
  const envTemplate = process.env.GROWTH_PLATFORM_OFFER_ENGINE_SLUG?.trim().toLowerCase();
  if (envTemplate) {
    return getPublicPricingSnapshotForEngineTemplateSlug(envTemplate);
  }
  const siteSlug = process.env.GROWTH_PLATFORM_SITE_OFFER_SLUG?.trim();
  if (!siteSlug) return null;
  const row = await storage.getSiteOffer(siteSlug);
  const linked = row?.offerEngineTemplateSlug?.trim().toLowerCase();
  if (!linked) return null;
  return getPublicPricingSnapshotForEngineTemplateSlug(linked);
}
