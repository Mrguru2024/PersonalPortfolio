import type { MarketingPersonaDTO } from "./ascendraIntelligenceService";
import type { OfferCopyBlocks, LeadMagnetCopyBlocks, PersonaStrategyLayer } from "@shared/offerEngineTypes";
import type { OfferEngineOfferTemplateRow, OfferEngineLeadMagnetTemplateRow } from "@shared/offerEngineSchema";
import { OFFER_TYPE_LABELS, CTA_GOAL_LABELS } from "@shared/offerEngineConstants";

function mergePersonaVoice(persona: MarketingPersonaDTO, strategy: PersonaStrategyLayer | null | undefined): string {
  const patterns = strategy?.emotionalWordingPatterns?.filter(Boolean).join("; ");
  if (patterns) return `Speak plainly${patterns ? ` — lean on: ${patterns}` : ""}.`;
  const pain = persona.problems[0];
  if (pain) return `Acknowledge real constraints (${pain.toLowerCase()}).`;
  return "Grounded, practical language — no hype, no corporate filler.";
}

export function generateOfferCopyBlocks(
  persona: MarketingPersonaDTO,
  row: OfferEngineOfferTemplateRow,
  strategy: PersonaStrategyLayer | null | undefined,
): OfferCopyBlocks {
  const voice = mergePersonaVoice(persona, strategy);
  const offerLabel = OFFER_TYPE_LABELS[row.offerType as keyof typeof OFFER_TYPE_LABELS] ?? row.offerType;
  const cta = CTA_GOAL_LABELS[row.ctaGoal as keyof typeof CTA_GOAL_LABELS] ?? row.ctaGoal;

  const headline =
    row.primaryPromise?.split(".")[0]?.trim().slice(0, 120) ||
    `A clearer path for ${persona.displayName.split("–")[0]?.trim() ?? "your ideal buyer"} — without guesswork.`;

  return {
    headline,
    subheadline: row.desiredOutcome?.slice(0, 280) ?? persona.goals[0] ?? "",
    problemStatement: row.coreProblem ?? persona.problems.slice(0, 3).join(" "),
    desiredResultStatement: row.desiredOutcome ?? persona.goals[0] ?? "",
    whyNow: row.perceivedOutcomeReviewJson.whyNowStatement || row.strategyWhyConvertJson.whyTheyCareNow || "",
    whyThisWorks:
      `We build systems for lead flow, conversion, automation, and revenue — not one-off pages. ${voice} This is structured as ${offerLabel}.`,
    whyAscendra:
      "Ascendra focuses on the plumbing: offers, funnels, follow-up, and measurement so growth compounds instead of resetting every quarter.",
    deliverablesBlock: row.tangibleDeliverables ?? "",
    objectionReducer: `Common pushback (${persona.objections.slice(0, 2).join(" / ") || "time / skepticism"}): we narrow scope, sequence wins, and keep the next step obvious.`,
    ctaBlock: `${cta}. ${row.funnelNextStep ? `Next: ${row.funnelNextStep}` : "You’ll know exactly what happens after you raise your hand."}`,
    faqBlock: `Q: Is this only a website? A: No — it’s the system around how strangers become leads, leads become calls, and calls become revenue.\nQ: Do you promise specific revenue? A: We don’t guarantee results by law or ethics; we design for measurable improvement and honest milestones.`,
    guaranteeSafeConfidenceBlock:
      "We work in clear phases, document assumptions, and align on what success looks like for your situation — without overpromising.",
    valueStackBlock: [row.tangibleDeliverables, row.timeToFirstWin ? `Time to first meaningful win: ${row.timeToFirstWin}` : ""]
      .filter(Boolean)
      .join("\n"),
  };
}

export function generateLeadMagnetCopyBlocks(
  persona: MarketingPersonaDTO,
  row: OfferEngineLeadMagnetTemplateRow,
  strategy: PersonaStrategyLayer | null | undefined,
): LeadMagnetCopyBlocks {
  const voice = mergePersonaVoice(persona, strategy);
  const b = row.bridgeToPaidJson;

  return {
    hook: row.promiseHook ?? `Get a fast, practical read on ${row.bigProblem ?? persona.problems[0] ?? "what’s blocking growth"}.`,
    whyThisMatters: row.bigProblem ?? persona.problems.slice(0, 2).join(" "),
    whoThisIsFor: `${persona.displayName} — ${persona.summary ?? ""}`.slice(0, 400),
    whatTheyllGet: row.smallQuickWin ?? "A concrete checklist, scores, or steps you can apply this week.",
    fastWinStatement: row.smallQuickWin ?? "",
    ctaBlock: row.ctaAfterConsumption ?? b.ctaShouldComeNext ?? "Take the next step when you’re ready — no pressure tactics.",
    whatHappensNext: b.ctaShouldComeNext ? `After you opt in: ${b.ctaShouldComeNext}` : "We’ll deliver the asset and a clear path if you want hands-on help.",
    bridgeToOfferBlock: `${b.helpsPersonaUnderstand}\n\nWhat it doesn’t fully solve: ${b.doesNotFullySolve}\n\nNatural paid step: ${b.paidStepItPointsTo}\n${b.whyNextStepFeelsNatural}`,
    followUpEmailIntro: `Quick follow-up: here’s the resource you requested. ${voice} If you want help implementing, reply and we’ll point you to the right system build.`,
  };
}
