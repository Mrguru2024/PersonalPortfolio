/**
 * Internal content grading for site offers: SEO, design readiness, copy clarity,
 * and optional persona + audience-context fit (IQ personas, tenure, vision investment).
 */

import type { AudienceTenureBand, AudienceVisionInvestment } from "../app/lib/offerSections";

export interface GradingInput {
  metaTitle?: string | null;
  metaDescription?: string | null;
  sections?: {
    hero?: { title?: string; subtitle?: string; imageUrl?: string };
    bullets?: string[];
    cta?: { buttonText?: string; buttonHref?: string; footnote?: string };
    deliverables?: { title?: string; desc?: string }[];
  };
  /**
   * When set (from offer `iqTargeting` + loaded IQ personas), adds a fourth pillar:
   * vocabulary overlap with persona problems/goals/objections plus tenure/vision heuristics.
   */
  personaContext?: PersonaGradingContext;
}

/** Loaded from `marketing_personas` for grading only. */
export interface PersonaGradingSnapshot {
  displayName: string;
  problems: string[];
  goals: string[];
  objections: string[];
  summary?: string | null;
}

export interface PersonaGradingContext {
  personas: PersonaGradingSnapshot[];
  audienceTenureBand?: AudienceTenureBand;
  audienceVisionInvestment?: AudienceVisionInvestment;
}

export interface ContentGradeResult {
  seoScore: number;
  designScore: number;
  copyScore: number;
  /** Present when `personaContext` was provided to grading. */
  personaContextScore?: number;
  overallGrade: "A" | "B" | "C" | "D" | "F";
  feedback: {
    seo: string[];
    design: string[];
    copy: string[];
    persona?: string[];
  };
  /** Target criteria used (for audits/diagnostics). */
  targets?: GradingTargets;
  /** Measured values (for accuracy confirmation in results). */
  measured?: GradingMeasured;
}

/** Target criteria shown in results to confirm grading accuracy. */
export interface GradingTargets {
  seo: { metaTitleMin: number; metaTitleMax: number; metaDescMin: number; metaDescMax: number };
  design: { heroTitleRequired: boolean; heroSubtitleRequired: boolean; heroImageRecommended: boolean; minDeliverables: number; deliverablesNeedDesc: boolean };
  copy: { ctaButtonRequired: boolean; ctaHrefRequired: boolean; minBullets: number; heroSubtitleMinChars: number };
  personaContext?: {
    minPersonaTokenOverlapRatio: number;
    tenureBandsConsidered: string[];
    visionLevelsConsidered: string[];
  };
}

/** Measured values from the content (for "your content" vs targets). */
export interface GradingMeasured {
  seo: { metaTitleLength: number; metaDescLength: number };
  design: { hasHeroTitle: boolean; hasHeroSubtitle: boolean; hasHeroImage: boolean; deliverableCount: number; deliverableWithDescCount: number };
  copy: { hasCtaButton: boolean; hasCtaHref: boolean; bulletCount: number; heroSubtitleLength: number };
  personaContext?: {
    personaTokenHits: number;
    personaTokenUniverse: number;
    overlapRatio: number;
    proofLanguageHits: number;
    audienceTenureBand?: AudienceTenureBand;
    audienceVisionInvestment?: AudienceVisionInvestment;
    personaCount: number;
  };
}

export const SEO_TITLE_MIN = 30;
export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MIN = 120;
export const SEO_DESC_MAX = 160;

const STOPWORDS = new Set([
  "that",
  "this",
  "with",
  "from",
  "your",
  "have",
  "will",
  "what",
  "when",
  "where",
  "which",
  "their",
  "there",
  "about",
  "would",
  "could",
  "should",
  "these",
  "those",
  "them",
  "than",
  "then",
  "into",
  "also",
  "just",
  "only",
  "very",
  "more",
  "most",
  "some",
  "such",
  "being",
  "each",
  "other",
  "many",
]);

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildHaystack(input: GradingInput): string {
  const parts: string[] = [];
  parts.push(input.metaTitle ?? "", input.metaDescription ?? "");
  const hero = input.sections?.hero;
  parts.push(hero?.title ?? "", hero?.subtitle ?? "");
  for (const b of input.sections?.bullets ?? []) parts.push(b);
  const cta = input.sections?.cta;
  parts.push(cta?.buttonText ?? "", cta?.footnote ?? "");
  for (const d of input.sections?.deliverables ?? []) {
    parts.push(d.title ?? "", d.desc ?? "");
  }
  return parts.join(" ").toLowerCase();
}

function meaningfulTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const w of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length > 4 && !STOPWORDS.has(w)) out.add(w);
  }
  return out;
}

function personaTokenUniverse(personas: PersonaGradingSnapshot[]): Set<string> {
  const u = new Set<string>();
  for (const p of personas) {
    const blob = [p.summary ?? "", ...p.problems, ...p.goals, ...p.objections].join(" ");
    for (const t of meaningfulTokens(blob)) u.add(t);
  }
  return u;
}

const PROOF_PATTERN =
  /\d[\d,]*%?|\$[\d,]+|roi|return\b|result|results|proven|metric|metrics|revenue|growth rate|scale|mrr|arr|kpi/i;

/**
 * Persona vocabulary overlap + audience tenure + vision-investment heuristics.
 */
function gradePersonaContext(input: GradingInput, ctx: PersonaGradingContext): {
  score: number;
  feedback: string[];
  measured: NonNullable<GradingMeasured["personaContext"]>;
} {
  const feedback: string[] = [];
  let score = 100;
  const haystack = buildHaystack(input);
  const subtitle = (input.sections?.hero?.subtitle ?? "").trim();
  const footnote = (input.sections?.cta?.footnote ?? "").trim();
  const buttonText = (input.sections?.cta?.buttonText ?? "").trim();

  const universe = personaTokenUniverse(ctx.personas);
  let hits = 0;
  if (universe.size > 0) {
    for (const t of universe) {
      if (haystack.includes(t)) hits += 1;
    }
  }
  const overlapRatio = universe.size > 0 ? hits / universe.size : 0;

  if (ctx.personas.length === 0) {
    feedback.push("No IQ personas attached — persona fit is scored only on business tenure and vision settings.");
  } else if (universe.size === 0) {
    score -= 25;
    feedback.push("Selected personas have empty problems/goals/objections in IQ — add them to improve fit scoring.");
  } else {
    if (overlapRatio < 0.08) {
      score -= 35;
      feedback.push(
        "Low overlap between offer copy and persona problems/goals/objections — weave their language into hero, bullets, and deliverables."
      );
    } else if (overlapRatio < 0.15) {
      score -= 18;
      feedback.push("Moderate persona fit — strengthen ties to persona pains and goals in the hero and bullets.");
    } else {
      feedback.push("Persona vocabulary overlap looks healthy for the selected IQ profiles.");
    }
  }

  const proofHits = PROOF_PATTERN.test(haystack) ? 1 : 0;
  const tenure = ctx.audienceTenureBand;
  const vision = ctx.audienceVisionInvestment;

  if (tenure === "pre_launch" || tenure === "under_2_years") {
    if (subtitle.length > 0 && subtitle.length < 70) {
      score -= 14;
      feedback.push(
        "For newer or pre-launch businesses, a longer hero subtitle (≈70+ chars) usually clarifies value and reduces confusion."
      );
    }
    if (!/\b(plan|roadmap|step|clear|simple|start|guide|foundation)\b/i.test(haystack)) {
      score -= 8;
      feedback.push("Early-stage readers often respond to words like plan, roadmap, steps, or clarity — consider one explicit education angle.");
    }
  }

  if (tenure === "five_plus_years" || tenure === "two_to_five_years") {
    if (!PROOF_PATTERN.test(haystack)) {
      score -= tenure === "five_plus_years" ? 22 : 12;
      feedback.push(
        tenure === "five_plus_years"
          ? "Established operators often expect proof: numbers, outcomes, ROI, or metrics somewhere in the offer."
          : "Growing businesses often look for concrete outcomes — add a proof point, metric, or specific result."
      );
    }
  }

  if (vision === "all_in") {
    if (footnote.length < 35) {
      score -= 16;
      feedback.push("Highly invested readers usually want reassurance under the CTA — expand the footnote (risk reversal, what happens next).");
    }
    if (buttonText && !/^(get|book|start|claim|secure|schedule|join|reserve)/i.test(buttonText.trim())) {
      score -= 10;
      feedback.push('For "all-in" vision fit, a decisive CTA verb (Get, Book, Start, Secure…) often matches commitment level.');
    }
  }

  if (vision === "exploring") {
    if (subtitle.length > 350) {
      score -= 6;
      feedback.push("Explorers can fatigue on very long hero copy — consider tightening the subtitle while keeping clarity.");
    }
  }

  if (vision === "committed" && footnote.length > 0 && footnote.length < 22) {
    score -= 8;
    feedback.push("Committed buyers often appreciate a short reassurance line under the CTA (what to expect after clicking).");
  }

  return {
    score: clampScore(score),
    feedback,
    measured: {
      personaTokenHits: hits,
      personaTokenUniverse: universe.size,
      overlapRatio: Math.round(overlapRatio * 1000) / 1000,
      proofLanguageHits: proofHits,
      audienceTenureBand: tenure,
      audienceVisionInvestment: vision,
      personaCount: ctx.personas.length,
    },
  };
}

/**
 * Grade SEO: meta title length, meta description length, basic keyword presence.
 */
function gradeSeo(input: GradingInput): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 100;
  const title = (input.metaTitle ?? "").trim();
  const desc = (input.metaDescription ?? "").trim();

  if (!title) {
    score -= 30;
    feedback.push("Missing meta title.");
  } else {
    if (title.length < SEO_TITLE_MIN) {
      score -= 15;
      feedback.push(`Meta title is short (${title.length} chars). Aim for ${SEO_TITLE_MIN}-${SEO_TITLE_MAX}.`);
    } else if (title.length > SEO_TITLE_MAX) {
      score -= 10;
      feedback.push(`Meta title may be truncated in search (${title.length} chars).`);
    }
  }

  if (!desc) {
    score -= 30;
    feedback.push("Missing meta description.");
  } else {
    if (desc.length < SEO_DESC_MIN) {
      score -= 15;
      feedback.push(`Meta description is short (${desc.length} chars). Aim for ${SEO_DESC_MIN}-${SEO_DESC_MAX}.`);
    } else if (desc.length > SEO_DESC_MAX) {
      score -= 5;
      feedback.push(`Meta description may be truncated (${desc.length} chars).`);
    }
  }

  return { score: clampScore(score), feedback };
}

/**
 * Grade design readiness: hero structure, visuals, deliverable structure.
 */
function gradeDesign(input: GradingInput): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 100;
  const hero = input.sections?.hero;
  const deliverables = input.sections?.deliverables ?? [];

  if (!hero?.title?.trim()) {
    score -= 25;
    feedback.push("Hero title is missing.");
  }
  if (!hero?.subtitle?.trim()) {
    score -= 15;
    feedback.push("Hero subtitle is missing.");
  }
  if (!hero?.imageUrl?.trim()) {
    score -= 10;
    feedback.push("Consider adding a hero image for visual impact.");
  }
  if (deliverables.length === 0) {
    score -= 20;
    feedback.push("No deliverables listed; add at least one.");
  } else {
    const withDesc = deliverables.filter((d) => d.desc?.trim()).length;
    if (withDesc < deliverables.length) {
      score -= 10;
      feedback.push("Some deliverables are missing descriptions.");
    }
  }

  return { score: clampScore(score), feedback };
}

/**
 * Grade copy clarity: clear CTA, benefit-focused bullets, professional tone.
 */
function gradeCopy(input: GradingInput): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 100;
  const cta = input.sections?.cta;
  const bullets = input.sections?.bullets ?? [];
  const hero = input.sections?.hero;

  if (!cta?.buttonText?.trim()) {
    score -= 25;
    feedback.push("CTA button text is missing.");
  }
  if (!cta?.buttonHref?.trim()) {
    score -= 20;
    feedback.push("CTA link is missing.");
  }
  if (bullets.length < 2) {
    score -= 15;
    feedback.push("Add at least 2 benefit bullets for clarity.");
  }
  const subtitle = (hero?.subtitle ?? "").trim();
  if (subtitle.length < 50) {
    score -= 10;
    feedback.push("Hero subtitle could be more descriptive (50+ chars).");
  }

  return { score: clampScore(score), feedback };
}

/**
 * Compute overall letter grade from three or four scores.
 */
function overallGrade(seo: number, design: number, copy: number, personaContext?: number): "A" | "B" | "C" | "D" | "F" {
  const avg =
    personaContext !== undefined
      ? (seo + design + copy + personaContext) / 4
      : (seo + design + copy) / 3;
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
}

/** Build targets and measured values for transparency in results/audits. */
function buildTargetsAndMeasured(
  input: GradingInput,
  personaMeasured?: GradingMeasured["personaContext"]
): {
  targets: GradingTargets;
  measured: GradingMeasured;
} {
  const title = (input.metaTitle ?? "").trim();
  const desc = (input.metaDescription ?? "").trim();
  const hero = input.sections?.hero;
  const deliverables = input.sections?.deliverables ?? [];
  const cta = input.sections?.cta;
  const bullets = input.sections?.bullets ?? [];
  const subtitle = (hero?.subtitle ?? "").trim();

  const deliverableWithDescCount = deliverables.filter((d) => (d.desc ?? "").trim().length > 0).length;

  const targets: GradingTargets = {
    seo: {
      metaTitleMin: SEO_TITLE_MIN,
      metaTitleMax: SEO_TITLE_MAX,
      metaDescMin: SEO_DESC_MIN,
      metaDescMax: SEO_DESC_MAX,
    },
    design: {
      heroTitleRequired: true,
      heroSubtitleRequired: true,
      heroImageRecommended: true,
      minDeliverables: 1,
      deliverablesNeedDesc: true,
    },
    copy: {
      ctaButtonRequired: true,
      ctaHrefRequired: true,
      minBullets: 2,
      heroSubtitleMinChars: 50,
    },
  };

  if (input.personaContext) {
    targets.personaContext = {
      minPersonaTokenOverlapRatio: 0.08,
      tenureBandsConsidered: ["pre_launch", "under_2_years", "two_to_five_years", "five_plus_years"],
      visionLevelsConsidered: ["exploring", "committed", "all_in"],
    };
  }

  const measured: GradingMeasured = {
    seo: { metaTitleLength: title.length, metaDescLength: desc.length },
    design: {
      hasHeroTitle: Boolean(hero?.title?.trim()),
      hasHeroSubtitle: Boolean(hero?.subtitle?.trim()),
      hasHeroImage: Boolean(hero?.imageUrl?.trim()),
      deliverableCount: deliverables.length,
      deliverableWithDescCount,
    },
    copy: {
      hasCtaButton: Boolean(cta?.buttonText?.trim()),
      hasCtaHref: Boolean(cta?.buttonHref?.trim()),
      bulletCount: bullets.length,
      heroSubtitleLength: subtitle.length,
    },
  };

  if (personaMeasured) {
    measured.personaContext = personaMeasured;
  }

  return { targets, measured };
}

/**
 * Grade offer content on SEO, design readiness, copy clarity, and optional persona/audience context.
 */
export function gradeOfferContent(input: GradingInput): ContentGradeResult {
  const seo = gradeSeo(input);
  const design = gradeDesign(input);
  const copy = gradeCopy(input);

  let personaContextScore: number | undefined;
  let personaFeedback: string[] | undefined;
  let personaMeasured: GradingMeasured["personaContext"] | undefined;

  if (input.personaContext) {
    const pg = gradePersonaContext(input, input.personaContext);
    personaContextScore = pg.score;
    personaFeedback = pg.feedback;
    personaMeasured = pg.measured;
  }

  const overall = overallGrade(seo.score, design.score, copy.score, personaContextScore);
  const { targets, measured } = buildTargetsAndMeasured(input, personaMeasured);

  return {
    seoScore: seo.score,
    designScore: design.score,
    copyScore: copy.score,
    ...(personaContextScore !== undefined ? { personaContextScore } : {}),
    overallGrade: overall,
    feedback: {
      seo: seo.feedback,
      design: design.feedback,
      copy: copy.feedback,
      ...(input.personaContext ? { persona: personaFeedback ?? [] } : {}),
    },
    targets,
    measured,
  };
}
