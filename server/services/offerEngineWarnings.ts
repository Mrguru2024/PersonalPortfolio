import type { PerceivedOutcomeReview, FunnelAlignment, StrategyWhyConvert } from "@shared/offerEngineTypes";
import type { OfferEngineWarningPayload } from "@shared/offerEngineSchema";
import { CTA_GOALS, type CtaGoal } from "@shared/offerEngineConstants";

const UNSAFE_GUARANTEE_RE = /\b(guarantee|guaranteed|100%\s*(results?|roi)|no\s*risk|sure\s*fire|certain\s*to)\b/i;

export function scanCopyForGuaranteeRisk(text: string): string[] {
  const flags: string[] = [];
  if (!text.trim()) return flags;
  if (UNSAFE_GUARANTEE_RE.test(text)) {
    flags.push(
      "Avoid absolute guarantees or “100% results”; prefer outcome-focused, scoped language (e.g. milestones, process, what we optimize for).",
    );
  }
  return flags;
}

function wordCount(s: string): number {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function evaluateOfferWarnings(input: {
  primaryPromise: string | null | undefined;
  coreProblem: string | null | undefined;
  desiredOutcome: string | null | undefined;
  strategyWhyConvert: StrategyWhyConvert;
  perceived: PerceivedOutcomeReview;
  funnel: FunnelAlignment;
  ctaGoal: CtaGoal;
  audienceTemperature?: string | null;
}): OfferEngineWarningPayload {
  const codes: string[] = [];
  const messages: string[] = [];
  const copySafetyFlags: string[] = [
    ...scanCopyForGuaranteeRisk(input.primaryPromise ?? ""),
    ...scanCopyForGuaranteeRisk(input.perceived.dreamOutcomeStatement),
  ];

  const promiseWords = wordCount(input.primaryPromise ?? "");
  if (promiseWords > 0 && promiseWords < 8) {
    codes.push("promise_vague");
    messages.push("Primary promise is very short — add specificity (who, what changes, in what timeframe).");
  }

  if (wordCount(input.coreProblem ?? "") < 6) {
    codes.push("problem_thin");
    messages.push("Core problem reads thin — clarify pain and situation for this persona.");
  }

  if (wordCount(input.desiredOutcome ?? "") < 6) {
    codes.push("outcome_thin");
    messages.push("Desired outcome needs more clarity — what does “win” look like for them?");
  }

  if (!input.strategyWhyConvert.whyPersonaCares?.trim() || !input.strategyWhyConvert.whyTheyCareNow?.trim()) {
    codes.push("strategy_incomplete");
    messages.push("Complete “Why this offer should convert” (persona relevance + why now).");
  }

  if (!input.strategyWhyConvert.currentAlternativesInMarket?.trim()) {
    codes.push("market_context_missing");
    messages.push("Document current alternatives in market so differentiation can be assessed.");
  }

  if (!input.strategyWhyConvert.reasonToBelieve?.trim() && !input.strategyWhyConvert.proofCredibilityFactors?.trim()) {
    codes.push("proof_missing");
    messages.push("Reason-to-believe/proof is missing — add concrete credibility factors.");
  }

  if (!input.strategyWhyConvert.guaranteeIdeas?.length && !input.strategyWhyConvert.urgencyPlan?.trim()) {
    codes.push("risk_reversal_light");
    messages.push("Guarantee + urgency are both weak; add scoped risk reversal and a real urgency driver.");
  }

  if (!input.strategyWhyConvert.pricingValueJustification?.trim()) {
    codes.push("pricing_justification_missing");
    messages.push("Pricing-to-value justification is missing; add why this price is credible for the persona.");
  }

  if (!input.strategyWhyConvert.easeOfUnderstandingNotes?.trim()) {
    codes.push("clarity_evidence_missing");
    messages.push("Add ease-of-understanding notes to ensure the offer can be explained quickly.");
  }

  if (!input.perceived.trustReason?.trim()) {
    codes.push("trust_gap");
    messages.push("Perceived outcome: add a concrete trust reason (proof, process, relevant experience).");
  }

  if (!input.funnel.crmTaggingLogic?.trim()) {
    codes.push("crm_tag_missing");
    messages.push("Funnel alignment: define CRM tagging logic so leads are segmentable.");
  }

  if (!input.funnel.nurtureSequenceRecommendation?.trim()) {
    codes.push("nurture_unknown");
    messages.push("Top/mid-funnel assets usually need a nurture recommendation — flag if intentionally direct-only.");
  }

  const safeCta: CtaGoal = CTA_GOALS.includes(input.ctaGoal as CtaGoal) ? (input.ctaGoal as CtaGoal) : "book_call";
  const temp = (input.audienceTemperature ?? "").toLowerCase();
  if (temp.includes("cold") && (safeCta === "book_call" || safeCta === "apply_now")) {
    codes.push("cold_high_friction_cta");
    messages.push("Cold traffic + book/apply CTA often misaligns — consider lead magnet or diagnostic first.");
  }

  if (!input.funnel.followUpAction?.trim()) {
    codes.push("follow_up_weak");
    messages.push("Follow-up action is empty — define what happens after the conversion action.");
  }

  return {
    codes,
    messages,
    ...(copySafetyFlags.length ? { copySafetyFlags } : {}),
  };
}

export function evaluateLeadMagnetWarnings(input: {
  promiseHook: string | null | undefined;
  smallQuickWin: string | null | undefined;
  bridge: {
    paidStepItPointsTo: string;
    ctaShouldComeNext: string;
    specificityLevel?: string;
    valueDensity?: string;
    awarenessLevel?: string;
    intendedNextStep?: string;
  };
  perceived: PerceivedOutcomeReview;
  funnel: FunnelAlignment;
}): OfferEngineWarningPayload {
  const codes: string[] = [];
  const messages: string[] = [];
  const copySafetyFlags: string[] = [
    ...scanCopyForGuaranteeRisk(input.promiseHook ?? ""),
    ...scanCopyForGuaranteeRisk(input.perceived.dreamOutcomeStatement),
  ];

  if (wordCount(input.smallQuickWin ?? "") < 5) {
    codes.push("no_quick_win");
    messages.push("Define a clearer small quick win the magnet delivers.");
  }

  if (!input.bridge.paidStepItPointsTo?.trim() || !input.bridge.ctaShouldComeNext?.trim()) {
    codes.push("bridge_weak");
    messages.push("Bridge to paid offer incomplete — specify paid step and next CTA.");
  }

  if (!input.bridge.specificityLevel?.trim()) {
    codes.push("specificity_missing");
    messages.push("Specificity level is missing — vague magnets tend to attract low-intent leads.");
  }

  if (!input.bridge.valueDensity?.trim()) {
    codes.push("value_density_missing");
    messages.push("Value density is unclear — define exactly what they get in the first interaction.");
  }

  if (!input.bridge.awarenessLevel?.trim()) {
    codes.push("awareness_mismatch_risk");
    messages.push("Awareness level is undefined; magnet may mismatch traffic sophistication.");
  }

  if (!input.bridge.intendedNextStep?.trim()) {
    codes.push("next_step_missing");
    messages.push("Intended next step is missing — define the handoff after magnet consumption.");
  }

  if (!input.funnel.crmTaggingLogic?.trim()) {
    codes.push("crm_tag_missing");
    messages.push("Lead magnet should specify CRM tagging for qualification/segmentation.");
  }

  return {
    codes,
    messages,
    ...(copySafetyFlags.length ? { copySafetyFlags } : {}),
  };
}
