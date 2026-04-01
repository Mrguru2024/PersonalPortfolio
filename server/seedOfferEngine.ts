/**
 * Idempotent starter data for Ascendra Offer Engine (admin templates).
 * Run from `server/seed.ts` after marketing personas exist.
 */
import { eq, like } from "drizzle-orm";
import { db } from "./db";
import {
  offerEngineOfferTemplates,
  offerEngineLeadMagnetTemplates,
  offerEngineFunnelPaths,
} from "@shared/schema";
import {
  defaultStrategyWhyConvert,
  defaultPerceivedOutcomeReview,
  defaultFunnelAlignment,
  defaultBridgeToPaid,
} from "@shared/offerEngineTypes";
import { scoreOfferTemplate, scoreLeadMagnetTemplate } from "./services/offerEngineScoring";
import { evaluateOfferWarnings, evaluateLeadMagnetWarnings } from "./services/offerEngineWarnings";
import type { CtaGoal } from "@shared/offerEngineConstants";

const starters = [
  {
    personaId: "marcus",
    offerSlug: "engine-marcus-local-booking-system",
    offerName: "Local lead & booking system (trades)",
    lmSlug: "engine-marcus-after-hours-leak-checklist",
    lmName: "After-hours lead leak checklist (trades)",
    funnelSlug: "engine-funnel-marcus-local",
    funnelLabel: "Marcus — Local search → checklist → call",
    magnetType: "checklist",
    magnetFormat: "pdf",
  },
  {
    personaId: "kristopher",
    offerSlug: "engine-kristopher-premium-pipeline-system",
    offerName: "Premium client pipeline system (studio)",
    lmSlug: "engine-kristopher-discovery-scorecard",
    lmName: "Discovery call scorecard (creative studio)",
    funnelSlug: "engine-funnel-kristopher-premium",
    funnelLabel: "Kristopher — Portfolio → scorecard → strategy session",
    magnetType: "scorecard",
    magnetFormat: "pdf",
  },
  {
    personaId: "tasha",
    offerSlug: "engine-tasha-retention-booking-system",
    offerName: "Booking + retention system (beauty)",
    lmSlug: "engine-tasha-noshow-planner",
    lmName: "No-show reduction planner (beauty)",
    funnelSlug: "engine-funnel-tasha-retention",
    funnelLabel: "Tasha — Social → planner → consult",
    magnetType: "planner",
    magnetFormat: "pdf",
  },
  {
    personaId: "devon",
    offerSlug: "engine-devon-gtm-clarity-starter",
    offerName: "GTM clarity starter (early SaaS)",
    lmSlug: "engine-devon-landing-scorecard",
    lmName: "Landing page clarity scorecard (founder)",
    funnelSlug: "engine-funnel-devon-validation",
    funnelLabel: "Devon — Content → scorecard → strategy call",
    magnetType: "scorecard",
    magnetFormat: "interactive_tool",
  },
  {
    personaId: "andre",
    offerSlug: "engine-andre-authority-funnel-system",
    offerName: "Authority + proposal system (consultant)",
    lmSlug: "engine-andre-diagnostic-worksheet",
    lmName: "Offer diagnostic worksheet (consultant)",
    funnelSlug: "engine-funnel-andre-authority",
    funnelLabel: "Andre — LinkedIn → worksheet → paid audit",
    magnetType: "worksheet",
    magnetFormat: "downloadable_template",
  },
] as const;

function strategyBlock(personaLabel: string) {
  const b = defaultStrategyWhyConvert();
  return {
    ...b,
    whyPersonaCares: `${personaLabel} needs fewer random tactics and a system that turns attention into booked conversations.`,
    whyTheyCareNow: "Demand and costs keep moving; small improvements to the conversion path often beat louder ad spend.",
    whatTheyAlreadyTried: "Point tools, one-off site tweaks, or disconnected campaigns without a single CTA path.",
    whyMoreBelievableThanAlternatives:
      "We sequence proof, scope, and delivery around operations — systems for conversion, not a vanity redesign.",
    frictionThatStillExists: "They must share access, milestones, and feedback on schedule for the system to stick.",
    whatThisDoesNotSolve: "Guaranteed business outcomes — results still depend on market, fit, and follow-through.",
    bestNextStepIfNotReady:
      "Use a lightweight diagnostic or checklist, then revisit when ready for implementation support.",
  };
}

function perceivedBlock(title: string) {
  const p = defaultPerceivedOutcomeReview();
  return {
    ...p,
    dreamOutcomeStatement: `A clearer path to consistent, qualified opportunities — ${title}.`,
    currentPainStatement: "Attention without a tight conversion system wastes time and budget.",
    whyNowStatement: "Small leaks in booking or follow-up compound monthly; clarifying the path reduces wasted spend.",
    trustReason: "Scoped milestones, relevant examples, and language grounded in how buyers actually decide.",
    believabilityNotes: "Promises stay bounded; tradeoffs and dependencies are stated plainly.",
    timeToValuePerception: "Early wins can show quickly on the funnel; broader traction depends on cadence and volume.",
    effortPerception: "Starts with focused inputs from them; automation reduces busywork where it fits.",
    keyFrictionPoints: "Skepticism from past vendors, time to gather assets, approval loops.",
    outcomeConfidenceNotes: "Stronger when ICP, proof, and next step are explicit in the asset.",
    actionConfidenceNotes: "CTA should match temperature — diagnostic first when traffic is cold.",
  };
}

function funnelBlock(meta: { traffic: string; temp: string }) {
  const f = defaultFunnelAlignment();
  return {
    ...f,
    trafficSource: meta.traffic,
    audienceTemperature: meta.temp,
    landingPageType: "Focused landing / tool entry",
    conversionAction: "Opt-in for resource or book short call",
    followUpAction: "CRM tag + short nurture + human review for qualified replies",
    crmTaggingLogic: "Tag persona, source=offer-engine-starter, stage by reply intent",
    qualificationRoute: "Reply signals + optional two-question self-segment",
    nurtureSequenceRecommendation: "Proof → one case pattern → soft CTA to call",
    salesHandoffLogic: "Booked call gets discovery; magnet-only stays educational",
    finalConversionGoal: "Scoped system build or audit depending on readiness",
  };
}

function funnelMetaFor(label: string): { traffic: string; temp: string } {
  if (label.includes("Marcus")) return { traffic: "Local SEO + GBP + referrals", temp: "mixed" };
  if (label.includes("Devon")) return { traffic: "Founder content + light paid tests", temp: "warm" };
  if (label.includes("Andre")) return { traffic: "LinkedIn + referral", temp: "warm" };
  return { traffic: "Organic social + referral", temp: "mixed" };
}

async function recomputeEngineScores(): Promise<void> {
  const offers = await db
    .select()
    .from(offerEngineOfferTemplates)
    .where(like(offerEngineOfferTemplates.slug, "engine-%"));
  for (const row of offers) {
    const scored = scoreOfferTemplate(row);
    const warnings = evaluateOfferWarnings({
      primaryPromise: row.primaryPromise,
      coreProblem: row.coreProblem,
      desiredOutcome: row.desiredOutcome,
      strategyWhyConvert: row.strategyWhyConvertJson,
      perceived: row.perceivedOutcomeReviewJson,
      funnel: row.funnelAlignmentJson,
      ctaGoal: (row.ctaGoal as CtaGoal) ?? "book_call",
      audienceTemperature: row.funnelAlignmentJson.audienceTemperature,
    });
    await db
      .update(offerEngineOfferTemplates)
      .set({ scoreCacheJson: scored, warningsJson: warnings, updatedAt: new Date() })
      .where(eq(offerEngineOfferTemplates.id, row.id));
  }

  const lms = await db
    .select()
    .from(offerEngineLeadMagnetTemplates)
    .where(like(offerEngineLeadMagnetTemplates.slug, "engine-%"));
  for (const row of lms) {
    const scored = scoreLeadMagnetTemplate(row);
    const warnings = evaluateLeadMagnetWarnings({
      promiseHook: row.promiseHook,
      smallQuickWin: row.smallQuickWin,
      bridge: row.bridgeToPaidJson,
      perceived: row.perceivedOutcomeReviewJson,
      funnel: row.funnelAlignmentJson,
    });
    await db
      .update(offerEngineLeadMagnetTemplates)
      .set({ scoreCacheJson: scored, warningsJson: warnings, updatedAt: new Date() })
      .where(eq(offerEngineLeadMagnetTemplates.id, row.id));
  }
}

export async function seedOfferEngineStarters(): Promise<void> {
  for (const s of starters) {
    const fm = funnelMetaFor(s.funnelLabel);
    const fa = funnelBlock(fm);
    const personaPretty =
      s.personaId === "marcus"
        ? "Skilled trades owner"
        : s.personaId === "kristopher"
          ? "Studio owner"
          : s.personaId === "tasha"
            ? "Beauty business owner"
            : s.personaId === "devon"
              ? "Early SaaS founder"
              : "Consultant / freelancer";

    const offerValues = {
      slug: s.offerSlug,
      name: s.offerName,
      personaId: s.personaId,
      industryNiche: null as string | null,
      offerType: "productized_service",
      buyerAwareness: "problem_aware",
      coreProblem: "Leads and bookings are inconsistent; the path from interest to a scheduled next step is fragile.",
      desiredOutcome: "A dependable acquisition and conversion system aligned to how they actually sell.",
      emotionalDriversJson: ["more_leads", "less_wasted_time", "easier_operations"],
      primaryPromise:
        "We design and implement a practical lead-to-booking system — messaging, pages, follow-up, and measurement — scoped to your stage.",
      tangibleDeliverables:
        "Offer one-pager, conversion-focused page structure, CRM tagging rules, nurture skeleton, and implementation checklist.",
      timeToFirstWin: "Small improvements can appear in weeks; traction still depends on volume and follow-through.",
      trustBuilderType: "strategy_roadmap",
      pricingModel: "custom_quote",
      riskReversalStyle: "milestone_confidence_language",
      ctaGoal: "book_call",
      funnelEntryPoint: s.funnelLabel,
      funnelNextStep: "Short strategy call to confirm fit and milestones.",
      status: "draft",
      visibility: "internal_only",
      strategyWhyConvertJson: strategyBlock(personaPretty),
      perceivedOutcomeReviewJson: perceivedBlock(s.offerName),
      funnelAlignmentJson: fa,
      copyBlocksJson: {},
      scoreCacheJson: null,
      warningsJson: null,
      pricingPackageJson: null,
      updatedAt: new Date(),
    };

    await db
      .insert(offerEngineOfferTemplates)
      .values(offerValues)
      .onConflictDoUpdate({
        target: offerEngineOfferTemplates.slug,
        set: {
          name: offerValues.name,
          personaId: offerValues.personaId,
          offerType: offerValues.offerType,
          buyerAwareness: offerValues.buyerAwareness,
          coreProblem: offerValues.coreProblem,
          desiredOutcome: offerValues.desiredOutcome,
          emotionalDriversJson: offerValues.emotionalDriversJson,
          primaryPromise: offerValues.primaryPromise,
          tangibleDeliverables: offerValues.tangibleDeliverables,
          timeToFirstWin: offerValues.timeToFirstWin,
          trustBuilderType: offerValues.trustBuilderType,
          pricingModel: offerValues.pricingModel,
          riskReversalStyle: offerValues.riskReversalStyle,
          ctaGoal: offerValues.ctaGoal,
          funnelEntryPoint: offerValues.funnelEntryPoint,
          funnelNextStep: offerValues.funnelNextStep,
          strategyWhyConvertJson: offerValues.strategyWhyConvertJson,
          perceivedOutcomeReviewJson: offerValues.perceivedOutcomeReviewJson,
          funnelAlignmentJson: offerValues.funnelAlignmentJson,
          updatedAt: new Date(),
        },
      });

    const [offerRow] = await db
      .select({ id: offerEngineOfferTemplates.id })
      .from(offerEngineOfferTemplates)
      .where(eq(offerEngineOfferTemplates.slug, s.offerSlug))
      .limit(1);
    const offerId = offerRow?.id;
    if (!offerId) continue;

    const bridge = {
      ...defaultBridgeToPaid(),
      helpsPersonaUnderstand: "Where leads drop today and what a tighter path would change in the next 30–60 days.",
      smallWinItCreates: "A prioritized short list they can act on — not generic advice.",
      doesNotFullySolve: "Labor markets, product demand, and anything outside the funnel system.",
      objectionsReduced: "Whether this is practical before committing time or budget.",
      paidStepItPointsTo: s.offerName,
      ctaShouldComeNext: "Book a strategy call or request a scoped audit.",
      whyNextStepFeelsNatural: "The asset frames a problem they already feel; the call continues that thread.",
    };

    const lmValues = {
      slug: s.lmSlug,
      name: s.lmName,
      personaId: s.personaId,
      relatedOfferTemplateId: offerId,
      funnelStage: "top",
      leadMagnetType: s.magnetType,
      bigProblem: offerValues.coreProblem,
      smallQuickWin: "Surfaces the top few funnel leaks to address first, in plain language.",
      format: s.magnetFormat,
      promiseHook: "See what to fix first — without committing to a full build.",
      ctaAfterConsumption: "Book a call or stay on educational nurture if timing is off.",
      deliveryMethod: "email",
      trustPurpose: "diagnose",
      qualificationIntent: "top_of_funnel",
      status: "draft",
      visibility: "internal_only",
      bridgeToPaidJson: bridge,
      perceivedOutcomeReviewJson: perceivedBlock(s.lmName),
      funnelAlignmentJson: fa,
      copyBlocksJson: {},
      scoreCacheJson: null,
      warningsJson: null,
      updatedAt: new Date(),
    };

    await db
      .insert(offerEngineLeadMagnetTemplates)
      .values(lmValues)
      .onConflictDoUpdate({
        target: offerEngineLeadMagnetTemplates.slug,
        set: {
          name: lmValues.name,
          personaId: lmValues.personaId,
          relatedOfferTemplateId: lmValues.relatedOfferTemplateId,
          funnelStage: lmValues.funnelStage,
          leadMagnetType: lmValues.leadMagnetType,
          bigProblem: lmValues.bigProblem,
          smallQuickWin: lmValues.smallQuickWin,
          format: lmValues.format,
          promiseHook: lmValues.promiseHook,
          bridgeToPaidJson: lmValues.bridgeToPaidJson,
          perceivedOutcomeReviewJson: lmValues.perceivedOutcomeReviewJson,
          funnelAlignmentJson: lmValues.funnelAlignmentJson,
          updatedAt: new Date(),
        },
      });

    const [lmRow] = await db
      .select({ id: offerEngineLeadMagnetTemplates.id })
      .from(offerEngineLeadMagnetTemplates)
      .where(eq(offerEngineLeadMagnetTemplates.slug, s.lmSlug))
      .limit(1);

    const stepsJson = [
      { key: "traffic", label: "Traffic source", detail: fa.trafficSource },
      { key: "entry", label: "Lead magnet / offer entry", detail: s.lmName },
      { key: "cta", label: "Form / CTA", detail: "Email capture or book call" },
      { key: "crm", label: "CRM tag", detail: fa.crmTaggingLogic },
      { key: "qual", label: "Qualification path", detail: fa.qualificationRoute },
      { key: "goal", label: "Booked call / purchase / nurture", detail: s.offerName },
    ];

    await db
      .insert(offerEngineFunnelPaths)
      .values({
        slug: s.funnelSlug,
        label: s.funnelLabel,
        personaId: s.personaId,
        stepsJson,
        primaryOfferTemplateId: offerId,
        primaryLeadMagnetTemplateId: lmRow?.id ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: offerEngineFunnelPaths.slug,
        set: {
          label: s.funnelLabel,
          personaId: s.personaId,
          stepsJson,
          primaryOfferTemplateId: offerId,
          primaryLeadMagnetTemplateId: lmRow?.id ?? null,
          updatedAt: new Date(),
        },
      });
  }

  await recomputeEngineScores();
}
