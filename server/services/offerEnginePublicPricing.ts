import { getOfferTemplateBySlug } from "./offerEngineService";
import { ensurePricingPackage, refreshPricingPackageComputed } from "@shared/ascendraPricingEngine";
import { buildPublicOfferPricingSnapshot, type PublicOfferPricingSnapshot } from "@shared/publicOfferPricingSnapshot";

/** Load offer-engine row and expose pricing fields safe for public pages. */
export async function getPublicPricingSnapshotForEngineTemplateSlug(
  templateSlug: string,
): Promise<PublicOfferPricingSnapshot | null> {
  const slug = templateSlug.trim().toLowerCase();
  if (!slug) return null;
  const row = await getOfferTemplateBySlug(slug);
  if (!row?.pricingPackageJson) return null;
  const merged = refreshPricingPackageComputed(row, ensurePricingPackage(row.pricingPackageJson));
  if (!merged?.computed) return null;
  return buildPublicOfferPricingSnapshot(row.slug, row.name, merged);
}
