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
}

const SEO_TITLE_MIN = 30;
const SEO_TITLE_MAX = 60;
const SEO_DESC_MIN = 120;
const SEO_DESC_MAX = 160;

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

/**
 * Grade offer content on SEO, design readiness, and copy clarity.
 * Returns scores 0–100 per category, overall letter grade, and feedback.
 */
export function gradeOfferContent(input: GradingInput): ContentGradeResult {
  const seo = gradeSeo(input);
  const design = gradeDesign(input);
  const copy = gradeCopy(input);
  const overall = overallGrade(seo.score, design.score, copy.score);
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
  };
}
