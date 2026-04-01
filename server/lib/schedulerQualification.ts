/**
 * Phase 1 operational signals for Ascendra Scheduler — deterministic heuristics.
 * Replace or augment with model scoring in Phase 3 without changing appointment storage shape.
 */

export type SchedulerQualification = {
  leadScoreTier: "high" | "medium" | "low";
  intentClassification: string;
  noShowRiskTier: "low" | "medium" | "high";
  estimatedValueCents: number | null;
};

function collectText(formAnswers: Record<string, unknown>, notes?: string | null, company?: string | null): string {
  const parts: string[] = [];
  if (company?.trim()) parts.push(company.trim());
  if (notes?.trim()) parts.push(notes.trim());
  for (const v of Object.values(formAnswers)) {
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  }
  return parts.join("\n").toLowerCase();
}

/** Parse rough budget hints like "$5k", "10000", "20k usd" → cents when unambiguous. */
function parseBudgetHint(text: string): number | null {
  const t = text.replace(/,/g, "");
  const m = t.match(/\$?\s*(\d+(?:\.\d+)?)\s*([km])?/i);
  if (!m) return null;
  let n = parseFloat(m[1]!);
  if (!Number.isFinite(n) || n <= 0) return null;
  const suffix = (m[2] || "").toLowerCase();
  if (suffix === "k") n *= 1000;
  if (suffix === "m") n *= 1_000_000;
  const cents = Math.round(n * 100);
  return cents > 0 && cents < 1_000_000_000 ? cents : null;
}

export function deriveSchedulerQualification(input: {
  formAnswers: Record<string, unknown>;
  guestEmail: string;
  guestPhone?: string | null;
  guestNotes?: string | null;
  guestCompany?: string | null;
}): SchedulerQualification {
  const blob = collectText(input.formAnswers, input.guestNotes, input.guestCompany);
  const hasPhone = !!(input.guestPhone && input.guestPhone.trim().length > 5);
  const emailLooksPersonal =
    /@(gmail|yahoo|hotmail|icloud|outlook|aol|proton)\./i.test(input.guestEmail) && !blob.includes("inc") && !blob.includes("llc");

  let intentClassification = "exploring";
  if (/\burgent|asap|emergency|today|this week\b/.test(blob)) intentClassification = "urgent_help";
  else if (/\bready to (buy|start|sign)|purchase|invoice\b/.test(blob)) intentClassification = "ready_to_buy";
  else if (/\bquote|pricing|how much|budget|proposal\b/.test(blob)) intentClassification = "needs_quote";

  let leadScoreTier: SchedulerQualification["leadScoreTier"] = "medium";
  if (intentClassification === "ready_to_buy" || intentClassification === "urgent_help") leadScoreTier = "high";
  else if (blob.length < 20 && emailLooksPersonal && !hasPhone) leadScoreTier = "low";

  let noShowRiskTier: SchedulerQualification["noShowRiskTier"] = "low";
  if (!hasPhone && blob.length < 30) noShowRiskTier = "medium";
  if (!hasPhone && blob.length < 12 && emailLooksPersonal) noShowRiskTier = "high";

  let estimatedValueCents = parseBudgetHint(blob);
  if (estimatedValueCents == null && intentClassification === "ready_to_buy") estimatedValueCents = 2500_00;

  if (intentClassification === "exploring" && leadScoreTier === "high") {
    leadScoreTier = "medium";
  }

  return { leadScoreTier, intentClassification, noShowRiskTier, estimatedValueCents };
}
