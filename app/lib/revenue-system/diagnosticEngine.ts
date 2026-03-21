export type RevenuePersona = "trades" | "freelancers" | "founders" | "operators";

export interface RevenueDiagnosticInput {
  fullName: string;
  email: string;
  companyName?: string;
  businessType?: string;
  persona: RevenuePersona;
  systems: {
    visibility: number; // 1-5
    conversion: number; // 1-5
    trust: number; // 1-5
    followUp: number; // 1-5
    capture: number; // 1-5
    retention: number; // 1-5
  };
  pains: string[];
  monthlyRevenue: number;
  avgDealValue: number;
  monthlyLeads: number;
  closeRatePercent: number;
}

export interface RevenueDiagnosticCategoryScores {
  visibility: number;
  conversion: number;
  trust: number;
  followUp: number;
  capture: number;
  retention: number;
}

export interface RevenueSystemRecommendation {
  systemKey: "lead_system" | "authority_system" | "validation_funnel" | "revenue_system";
  label: string;
  reason: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
}

export interface RevenueDiagnosticResult {
  categoryScores: RevenueDiagnosticCategoryScores;
  websitePerformanceScore: number;
  startupWebsiteScore: number;
  overallScore: number;
  topBottlenecks: string[];
  revenueOpportunityEstimate: number;
  recommendation: RevenueSystemRecommendation;
}

const CATEGORY_LABELS: Record<keyof RevenueDiagnosticCategoryScores, string> = {
  visibility: "Visibility",
  conversion: "Conversion",
  trust: "Trust",
  followUp: "Follow-Up",
  capture: "Capture",
  retention: "Retention",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: number): number {
  return clamp(Math.round((value / 5) * 100), 0, 100);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getPersonaRecommendation(
  persona: RevenuePersona,
  overallScore: number,
): RevenueSystemRecommendation {
  const dynamicCtaLabel =
    overallScore < 45
      ? "Run Full Diagnosis"
      : overallScore < 70
        ? "Get Custom Plan"
        : "Book Strategy Call";

  if (persona === "trades") {
    return {
      systemKey: "lead_system",
      label: "Lead System",
      reason: "Your scoring points to missed leads and inconsistent follow-up hurting booked jobs.",
      primaryCtaLabel: dynamicCtaLabel,
      primaryCtaHref: "/strategy-call",
    };
  }
  if (persona === "freelancers") {
    return {
      systemKey: "authority_system",
      label: "Authority System",
      reason: "Your score shows positioning and proof gaps lowering pricing power and conversion quality.",
      primaryCtaLabel: dynamicCtaLabel,
      primaryCtaHref: "/rebrand-your-business",
    };
  }
  if (persona === "founders") {
    return {
      systemKey: "validation_funnel",
      label: "Validation Funnel",
      reason: "Your diagnostics indicate validation friction from unclear conversion paths and trust signals.",
      primaryCtaLabel: dynamicCtaLabel,
      primaryCtaHref: "/offers/startup-growth-system",
    };
  }
  return {
    systemKey: "revenue_system",
    label: "Revenue System",
    reason: "Your business can unlock compounding gains by connecting visibility, conversion, and retention systems.",
    primaryCtaLabel: dynamicCtaLabel,
    primaryCtaHref: "/brand-growth",
  };
}

export function runRevenueDiagnostic(input: RevenueDiagnosticInput): RevenueDiagnosticResult {
  const categoryScores: RevenueDiagnosticCategoryScores = {
    visibility: toPercent(input.systems.visibility),
    conversion: toPercent(input.systems.conversion),
    trust: toPercent(input.systems.trust),
    followUp: toPercent(input.systems.followUp),
    capture: toPercent(input.systems.capture),
    retention: toPercent(input.systems.retention),
  };

  const websitePerformanceScore = mean([
    categoryScores.visibility,
    categoryScores.conversion,
    categoryScores.capture,
    categoryScores.trust,
  ]);
  const startupWebsiteScore = mean([
    categoryScores.visibility,
    categoryScores.conversion,
    categoryScores.trust,
  ]);
  const overallScore = mean(Object.values(categoryScores));

  const topBottlenecks = (Object.entries(categoryScores) as Array<
    [keyof RevenueDiagnosticCategoryScores, number]
  >)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key]) => CATEGORY_LABELS[key]);

  const normalizedLeads = Math.max(0, input.monthlyLeads || 0);
  const normalizedDealValue = Math.max(0, input.avgDealValue || 0);
  const normalizedCloseRate = clamp(input.closeRatePercent || 0, 0, 100);
  const currentMonthlyWon = normalizedLeads * (normalizedCloseRate / 100) * normalizedDealValue;

  const closeRateLift = (100 - categoryScores.conversion) * 0.18;
  const leadLift = 1 + (100 - categoryScores.capture) / 220;
  const retentionLift = 1 + (100 - categoryScores.retention) / 300;
  const targetCloseRate = clamp(normalizedCloseRate + closeRateLift, 0, 95);

  const optimizedMonthlyWon =
    normalizedLeads * leadLift * (targetCloseRate / 100) * normalizedDealValue * retentionLift;
  const revenueOpportunityEstimate = Math.max(
    0,
    Math.round((optimizedMonthlyWon - currentMonthlyWon) * 12),
  );

  return {
    categoryScores,
    websitePerformanceScore,
    startupWebsiteScore,
    overallScore,
    topBottlenecks,
    revenueOpportunityEstimate,
    recommendation: getPersonaRecommendation(input.persona, overallScore),
  };
}

export function normalizePersona(persona: string | undefined | null): RevenuePersona {
  const value = String(persona ?? "").toLowerCase();
  if (value.includes("trade")) return "trades";
  if (value.includes("freelance")) return "freelancers";
  if (value.includes("founder") || value.includes("startup")) return "founders";
  return "operators";
}
