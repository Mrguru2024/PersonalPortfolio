/**
 * Internal content grading for site offers: SEO, design readiness, copy clarity.
 * Used by admin to ensure agency-grade content before publishing.
 */

export interface GradingInput {
  metaTitle?: string | null;
  metaDescription?: string | null;
  sections?: {
    hero?: { title?: string; subtitle?: string; imageUrl?: string };
    bullets?: string[];
    cta?: { buttonText?: string; buttonHref?: string; footnote?: string };
    deliverables?: { title?: string; desc?: string }[];
  };
}

export interface ContentGradeResult {
  seoScore: number;
  designScore: number;
  copyScore: number;
  overallGrade: "A" | "B" | "C" | "D" | "F";
  feedback: { seo: string[]; design: string[]; copy: string[] };
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
}

/** Measured values from the content (for "your content" vs targets). */
export interface GradingMeasured {
  seo: { metaTitleLength: number; metaDescLength: number };
  design: { hasHeroTitle: boolean; hasHeroSubtitle: boolean; hasHeroImage: boolean; deliverableCount: number; deliverableWithDescCount: number };
  copy: { hasCtaButton: boolean; hasCtaHref: boolean; bulletCount: number; heroSubtitleLength: number };
}

export const SEO_TITLE_MIN = 30;
export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MIN = 120;
export const SEO_DESC_MAX = 160;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
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
 * Compute overall letter grade from three scores.
 */
function overallGrade(seo: number, design: number, copy: number): "A" | "B" | "C" | "D" | "F" {
  const avg = (seo + design + copy) / 3;
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
}

/** Build targets and measured values for transparency in results/audits. */
function buildTargetsAndMeasured(input: GradingInput): {
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

  return {
    targets: {
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
    },
    measured: {
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
    },
  };
}

/**
 * Grade offer content on SEO, design readiness, and copy clarity.
 * Returns scores 0–100 per category, overall letter grade, feedback, targets, and measured values.
 */
export function gradeOfferContent(input: GradingInput): ContentGradeResult {
  const seo = gradeSeo(input);
  const design = gradeDesign(input);
  const copy = gradeCopy(input);
  const overall = overallGrade(seo.score, design.score, copy.score);
  const { targets, measured } = buildTargetsAndMeasured(input);
  return {
    seoScore: seo.score,
    designScore: design.score,
    copyScore: copy.score,
    overallGrade: overall,
    feedback: {
      seo: seo.feedback,
      design: design.feedback,
      copy: copy.feedback,
    },
    targets,
    measured,
  };
}
