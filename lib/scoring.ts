/**
 * Growth diagnosis funnel: question definitions, scoring, and recommendation logic.
 * Categories: Brand Clarity, Visual Identity, Website Performance, Lead Generation, Automation.
 * Scores map to Brand (1–2), Design (3), System (4–5).
 */

export type CategoryId = "brand" | "design" | "website" | "leads" | "automation";

export interface QuestionOption {
  value: string;
  label: string;
  /** Points per category: [brand, design, system] — each category 0–20 per question set. */
  points: [number, number, number];
}

export interface DiagnosisQuestion {
  id: string;
  category: CategoryId;
  question: string;
  options: QuestionOption[];
}

/** Category to pillar: brand → Style Studio, design → Macon, website/leads/automation → Ascendra (system). */
const CATEGORY_TO_PILLAR: Record<CategoryId, "brand" | "design" | "system"> = {
  brand: "brand",
  design: "design",
  website: "system",
  leads: "system",
  automation: "system",
};

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  // —— Brand Clarity (category 1) ——
  {
    id: "brand_clear_message",
    category: "brand",
    question: "Can you explain what your business does and who it's for in one sentence?",
    options: [
      { value: "yes", label: "Yes", points: [20, 0, 0] },
      { value: "somewhat", label: "Somewhat", points: [10, 0, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "brand_positioning",
    category: "brand",
    question: "Do you have a clear way to stand out from competitors in your market?",
    options: [
      { value: "yes", label: "Yes", points: [20, 0, 0] },
      { value: "somewhat", label: "Somewhat", points: [10, 0, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "brand_consistency",
    category: "brand",
    question: "Is your messaging consistent across your website, social, and sales materials?",
    options: [
      { value: "yes", label: "Yes", points: [20, 0, 0] },
      { value: "somewhat", label: "Somewhat", points: [10, 0, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "brand_target",
    category: "brand",
    question: "Have you clearly defined your ideal customer or client?",
    options: [
      { value: "yes", label: "Yes", points: [20, 0, 0] },
      { value: "somewhat", label: "Somewhat", points: [10, 0, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  // —— Visual Identity (category 2) ——
  {
    id: "design_quality",
    category: "design",
    question: "Does your current visual identity (logo, colors, typography) look professional and up to date?",
    options: [
      { value: "yes", label: "Yes", points: [0, 20, 0] },
      { value: "somewhat", label: "Somewhat", points: [0, 10, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "design_consistent",
    category: "design",
    question: "Is your visual branding consistent across all touchpoints?",
    options: [
      { value: "yes", label: "Yes", points: [0, 20, 0] },
      { value: "somewhat", label: "Somewhat", points: [0, 10, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "design_trust",
    category: "design",
    question: "Do you feel your design builds trust and credibility with prospects?",
    options: [
      { value: "yes", label: "Yes", points: [0, 20, 0] },
      { value: "somewhat", label: "Somewhat", points: [0, 10, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "design_assets",
    category: "design",
    question: "Do you have professional marketing assets (images, graphics, templates) you use regularly?",
    options: [
      { value: "yes", label: "Yes", points: [0, 20, 0] },
      { value: "somewhat", label: "Somewhat", points: [0, 10, 0] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  // —— Website Performance (category 3 → system) ——
  {
    id: "website_leads",
    category: "website",
    question: "Do you currently collect leads on your website?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "no", label: "No", points: [0, 0, 0] },
      { value: "not_sure", label: "Not sure", points: [0, 0, 5] },
    ],
  },
  {
    id: "website_clear_cta",
    category: "website",
    question: "Does your website have a clear next step (e.g. book a call, get a quote) above the fold?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "website_mobile",
    category: "website",
    question: "Is your website optimized for mobile visitors?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "website_speed",
    category: "website",
    question: "Does your site load quickly and perform well?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  // —— Lead Generation (category 4 → system) ——
  {
    id: "leads_capture",
    category: "leads",
    question: "Do you have a clear process to capture and follow up with new leads?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "leads_qualify",
    category: "leads",
    question: "Do you qualify leads before booking sales calls?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "leads_tracking",
    category: "leads",
    question: "Do you track where your leads come from and how they move through your funnel?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  // —— Automation (category 5 → system) ——
  {
    id: "automation_followup",
    category: "automation",
    question: "Do you use any automation for follow-up (email sequences, reminders)?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
  {
    id: "automation_integration",
    category: "automation",
    question: "Are your website, CRM, and email tools connected so data flows between them?",
    options: [
      { value: "yes", label: "Yes", points: [0, 0, 20] },
      { value: "somewhat", label: "Somewhat", points: [0, 0, 10] },
      { value: "no", label: "No", points: [0, 0, 0] },
    ],
  },
];

const MAX_BRAND = 80;  // 4 questions × 20
const MAX_DESIGN = 80; // 4 questions × 20
const MAX_SYSTEM = 180; // 9 questions (website 4 + leads 3 + automation 2) × 20

/** Normalize raw pillar sums to 0–100 using the max possible for each pillar from our questions. */
function normalizePillar(rawBrand: number, rawDesign: number, rawSystem: number): { brand: number; design: number; system: number } {
  const b = Math.min(100, Math.round((rawBrand / MAX_BRAND) * 100));
  const d = Math.min(100, Math.round((rawDesign / MAX_DESIGN) * 100));
  const s = Math.min(100, Math.round((rawSystem / MAX_SYSTEM) * 100));
  return { brand: b, design: d, system: s };
}

export interface DiagnosisScores {
  totalScore: number;
  brandScore: number;
  designScore: number;
  systemScore: number;
  primaryBottleneck: "brand" | "design" | "system";
  recommendation: "style_studio" | "macon_designs" | "ascendra";
}

/**
 * Compute scores from answers. Answers: record of question id → option value.
 * Returns total (0–100), brand/design/system (0–100), primary bottleneck, and recommendation.
 */
export function calculateScores(answers: Record<string, string>): DiagnosisScores {
  let rawBrand = 0, rawDesign = 0, rawSystem = 0;

  for (const q of DIAGNOSIS_QUESTIONS) {
    const value = answers[q.id];
    if (!value) continue;
    const option = q.options.find((o) => o.value === value);
    if (!option) continue;
    rawBrand += option.points[0];
    rawDesign += option.points[1];
    rawSystem += option.points[2];
  }

  const { brand: brandScore, design: designScore, system: systemScore } = normalizePillar(rawBrand, rawDesign, rawSystem);
  const totalScore = Math.round((brandScore + designScore + systemScore) / 3);

  const weakest =
    brandScore <= designScore && brandScore <= systemScore
      ? { key: "brand" as const, score: brandScore }
      : designScore <= systemScore
        ? { key: "design" as const, score: designScore }
        : { key: "system" as const, score: systemScore };

  const recommendation =
    weakest.key === "brand" ? "style_studio" : weakest.key === "design" ? "macon_designs" : "ascendra";

  return {
    totalScore: Math.min(100, totalScore),
    brandScore,
    designScore,
    systemScore,
    primaryBottleneck: weakest.key,
    recommendation,
  };
}

export function getQuestionsByCategory(): Record<CategoryId, DiagnosisQuestion[]> {
  const byCat: Record<CategoryId, DiagnosisQuestion[]> = {
    brand: [],
    design: [],
    website: [],
    leads: [],
    automation: [],
  };
  for (const q of DIAGNOSIS_QUESTIONS) {
    byCat[q.category].push(q);
  }
  return byCat;
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  brand: "Brand Clarity",
  design: "Visual Identity",
  website: "Website Performance",
  leads: "Lead Generation",
  automation: "Automation",
};

export const RECOMMENDATION_LABELS: Record<DiagnosisScores["recommendation"], string> = {
  style_studio: "Style Studio Branding",
  macon_designs: "Macon Designs",
  ascendra: "Ascendra Technologies",
};
