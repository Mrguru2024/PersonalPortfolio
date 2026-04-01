import type { GrowthPersonaOfferPricing } from "@shared/schema";
import {
  ASCENDRA_OFFER_STACK,
  type AscendraOfferTier,
  type AscendraOfferTierDefinition,
} from "@shared/ascendraOfferStack";

function clampMult(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(5, Math.max(0.25, n));
}

/** Deep-cloned stack with persona multipliers applied to cent ranges (display / quoting only). */
export function mergeOfferStackWithPersona(
  personaRow: GrowthPersonaOfferPricing | null,
): Record<AscendraOfferTier, AscendraOfferTierDefinition> {
  const raw = JSON.parse(JSON.stringify(ASCENDRA_OFFER_STACK)) as Record<
    AscendraOfferTier,
    AscendraOfferTierDefinition
  >;
  if (!personaRow) return raw;

  const ds = clampMult(personaRow.dfySetupMultiplier ?? 1);
  const dm = clampMult(personaRow.dfyMonthlyMultiplier ?? 1);
  const dw = clampMult(personaRow.dwyProgramMultiplier ?? 1);

  if (raw.DFY.pricing.setup) {
    raw.DFY.pricing.setup = {
      minCents: Math.round(raw.DFY.pricing.setup.minCents * ds),
      maxCents: Math.round(raw.DFY.pricing.setup.maxCents * ds),
    };
  }
  if (raw.DFY.pricing.monthly) {
    raw.DFY.pricing.monthly = {
      minCents: Math.round(raw.DFY.pricing.monthly.minCents * dm),
      maxCents: Math.round(raw.DFY.pricing.monthly.maxCents * dm),
    };
  }
  if (raw.DWY.pricing.program) {
    raw.DWY.pricing.program = {
      minCents: Math.round(raw.DWY.pricing.program.minCents * dw),
      maxCents: Math.round(raw.DWY.pricing.program.maxCents * dw),
    };
  }

  return raw;
}
