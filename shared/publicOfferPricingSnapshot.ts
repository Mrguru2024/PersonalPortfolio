/**
 * Public-safe subset of Ascendra pricing package for site_offers API and growth-platform.
 * No Stripe secrets, no internal validation booleans.
 */
import type { AscendraPricingPackage } from "./ascendraPricingPackageTypes";

export type PublicOfferPricingSnapshot = {
  templateSlug: string;
  templateName: string;
  tierFocus: string | null;
  setupPriceRangeUsd: [number, number] | null;
  monthlyPriceRangeUsd: [number, number] | null;
  dwyPriceRangeUsd: [number, number] | null;
  diyPriceRangeUsd: [number, number] | null;
  suggestedSetupUsd: number | null;
  suggestedMonthlyUsd: number | null;
  suggestedDwyOneTimeUsd: number | null;
  suggestedDiyUsd: number | null;
  projectedMonthlyRevenue: number | null;
  projectedAnnualRevenue: number | null;
  breakEvenMonthsVsPrice: number | null;
  positioningStatement: string | null;
  outcomeSnippet: string | null;
  disclaimer: string | null;
  /** From template inputs — optional calculator defaults on /growth-platform. */
  modelAverageJobValue: number | null;
  modelJobsPerMonth: number | null;
};

export function buildPublicOfferPricingSnapshot(
  templateSlug: string,
  templateName: string,
  pkg: AscendraPricingPackage,
): PublicOfferPricingSnapshot | null {
  const c = pkg.computed;
  if (!c) return null;
  const inputs = pkg.inputs ?? {};
  return {
    templateSlug,
    templateName,
    tierFocus: pkg.tierFocus ?? null,
    setupPriceRangeUsd: c.setupPriceRangeUsd ?? null,
    monthlyPriceRangeUsd: c.monthlyPriceRangeUsd ?? null,
    dwyPriceRangeUsd: c.dwyPriceRangeUsd ?? null,
    diyPriceRangeUsd: c.diyPriceRangeUsd ?? null,
    suggestedSetupUsd: c.suggestedSetupUsd ?? null,
    suggestedMonthlyUsd: c.suggestedMonthlyUsd ?? null,
    suggestedDwyOneTimeUsd: c.suggestedDwyOneTimeUsd ?? null,
    suggestedDiyUsd: c.suggestedDiyUsd ?? null,
    projectedMonthlyRevenue: c.projectedMonthlyRevenue ?? null,
    projectedAnnualRevenue: c.projectedAnnualRevenue ?? null,
    breakEvenMonthsVsPrice: c.breakEvenMonthsVsPrice ?? null,
    positioningStatement: c.autoPositioningStatement ?? null,
    outcomeSnippet: c.outcomeStatementSnippet ?? null,
    disclaimer: c.legalDisclaimerEffective ?? null,
    modelAverageJobValue: inputs.avgJobValue ?? null,
    modelJobsPerMonth: inputs.targetJobsPerMonth ?? null,
  };
}

export function formatUsdPair(range: [number, number] | null | undefined): string {
  if (!range) return "—";
  const [a, b] = range;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`;
}
