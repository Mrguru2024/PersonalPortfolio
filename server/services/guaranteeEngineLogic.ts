import type { GuaranteeTypeValue } from "@shared/schema";
import type {
  GuaranteeCompliance,
  GuaranteeDashboardColor,
  GuaranteeDashboardStatus,
  GuaranteeMetricRow,
  GuaranteePreviewInput,
  GuaranteePreviewOutput,
  GuaranteeStatusValue,
} from "@shared/guaranteeEngine";

type EvaluateMetricsInput = {
  qualifiedLeadsCount: number;
  bookedJobsCount: number;
  conversionRate: number;
  baselineConversionRate: number | null;
  revenueGenerated: number;
  systemCost: number;
  roiPercentage: number;
  compliance: GuaranteeCompliance;
};

/** Visitor → lead assumption for sales preview (remaining funnel uses lead → book rate). */
const PREVIEW_VISITOR_TO_LEAD_DIVISOR = 100;
/** Default share of qualified leads that book (preview only; tune with data). */
const PREVIEW_LEAD_TO_BOOK_RATE = 0.35;

type EvaluateMetricsOutput = {
  rows: GuaranteeMetricRow[];
  dashboardStatus: GuaranteeDashboardStatus;
  dashboardColor: GuaranteeDashboardColor;
};

const GUARANTEE_TYPES: GuaranteeTypeValue[] = [
  "lead_flow",
  "booked_jobs",
  "conversion",
  "payback",
];

function pct(value: number): number {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}

function int(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function deriveStatus(
  type: GuaranteeTypeValue,
  input: EvaluateMetricsInput,
): GuaranteeStatusValue {
  if (type === "lead_flow") {
    return input.qualifiedLeadsCount === 0 ? "not_met" : "met";
  }
  if (type === "booked_jobs") {
    return input.bookedJobsCount === 0 ? "not_met" : "met";
  }
  if (type === "conversion") {
    if (input.qualifiedLeadsCount === 0) return "not_met";
    if (input.baselineConversionRate == null) return "pending";
    return input.conversionRate > input.baselineConversionRate ? "met" : "not_met";
  }
  if (input.systemCost <= 0) return "pending";
  return input.roiPercentage <= 0 ? "not_met" : "met";
}

function deriveDashboardStatus(
  statuses: GuaranteeStatusValue[],
  compliance: GuaranteeCompliance,
): Pick<EvaluateMetricsOutput, "dashboardStatus" | "dashboardColor"> {
  if (!compliance.isCompliant) {
    return { dashboardStatus: "action_required", dashboardColor: "red" };
  }
  if (statuses.includes("not_met")) {
    return { dashboardStatus: "action_required", dashboardColor: "red" };
  }
  if (statuses.includes("pending")) {
    return { dashboardStatus: "in_progress", dashboardColor: "yellow" };
  }
  return { dashboardStatus: "met", dashboardColor: "green" };
}

export function evaluateGuaranteeFromMetrics(
  input: EvaluateMetricsInput,
): EvaluateMetricsOutput {
  const rows: GuaranteeMetricRow[] = GUARANTEE_TYPES.map((type) => ({
    type,
    status: deriveStatus(type, input),
    qualifiedLeadsCount: int(input.qualifiedLeadsCount),
    bookedJobsCount: int(input.bookedJobsCount),
    conversionRate: pct(input.conversionRate),
    revenueGenerated: int(input.revenueGenerated),
    systemCost: int(input.systemCost),
    roiPercentage: pct(input.roiPercentage),
  }));
  const dashboard = deriveDashboardStatus(
    rows.map((r) => r.status),
    input.compliance,
  );
  return { rows, ...dashboard };
}

export function calculateGuaranteePreview(
  input: GuaranteePreviewInput & { systemCost?: number },
): GuaranteePreviewOutput {
  const projectedLeads = int(
    input.monthlyTraffic * (input.estimatedConversionRate / PREVIEW_VISITOR_TO_LEAD_DIVISOR),
  );
  const projectedJobs = int(projectedLeads * PREVIEW_LEAD_TO_BOOK_RATE);
  const projectedRevenue = int(projectedJobs * input.avgJobValue);
  const cost = Math.max(0, Number(input.systemCost ?? 0));
  const projectedRoiPercentage =
    cost <= 0 ? 0 : pct(((projectedRevenue - cost) / cost) * 100);
  return {
    projectedLeads,
    projectedJobs,
    projectedRevenue,
    projectedRoiPercentage,
  };
}

