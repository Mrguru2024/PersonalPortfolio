import { z } from "zod";

export const guaranteeStatusValueSchema = z.enum(["pending", "met", "not_met"]);
export type GuaranteeStatusValue = z.infer<typeof guaranteeStatusValueSchema>;

export const guaranteeTypeValueSchema = z.enum([
  "lead_flow",
  "booked_jobs",
  "conversion",
  "payback",
]);
export type GuaranteeTypeValue = z.infer<typeof guaranteeTypeValueSchema>;

export const guaranteeDashboardStatusSchema = z.enum([
  "met",
  "in_progress",
  "action_required",
]);
export type GuaranteeDashboardStatus = z.infer<typeof guaranteeDashboardStatusSchema>;

export const guaranteeDashboardColorSchema = z.enum(["green", "yellow", "red"]);
export type GuaranteeDashboardColor = z.infer<typeof guaranteeDashboardColorSchema>;

export const guaranteeActionTypeSchema = z.enum([
  "optimize_funnel",
  "adjust_offer",
  "increase_traffic",
  "fix_conversion_flow",
]);
export type GuaranteeActionType = z.infer<typeof guaranteeActionTypeSchema>;

export const guaranteeComplianceSchema = z.object({
  isCompliant: z.boolean(),
  reasons: z.array(z.string()),
});
export type GuaranteeCompliance = z.infer<typeof guaranteeComplianceSchema>;

export const guaranteeMetricRowSchema = z.object({
  type: guaranteeTypeValueSchema,
  status: guaranteeStatusValueSchema,
  qualifiedLeadsCount: z.number().int().min(0),
  bookedJobsCount: z.number().int().min(0),
  conversionRate: z.number(),
  revenueGenerated: z.number().int().min(0),
  systemCost: z.number().int().min(0),
  roiPercentage: z.number(),
});
export type GuaranteeMetricRow = z.infer<typeof guaranteeMetricRowSchema>;

export const guaranteeSnapshotSchema = z.object({
  clientId: z.number().int().positive(),
  timeframeStart: z.string(),
  timeframeEnd: z.string(),
  timeframeLabel: z.string(),
  qualifiedLeadsCount: z.number().int().min(0),
  bookedJobsCount: z.number().int().min(0),
  conversionRate: z.number(),
  baselineConversionRate: z.number().nullable(),
  revenueGenerated: z.number().int().min(0),
  systemCost: z.number().int().min(0),
  roiPercentage: z.number(),
  compliance: guaranteeComplianceSchema,
  rows: z.array(guaranteeMetricRowSchema).length(4),
  dashboardStatus: guaranteeDashboardStatusSchema,
  dashboardColor: guaranteeDashboardColorSchema,
});
export type GuaranteeSnapshot = z.infer<typeof guaranteeSnapshotSchema>;

export const guaranteeControlRowSchema = z.object({
  clientId: z.number().int().positive(),
  clientLabel: z.string(),
  qualifiedLeadsCount: z.number().int().min(0),
  bookedJobsCount: z.number().int().min(0),
  conversionRate: z.number(),
  roiPercentage: z.number(),
  dashboardStatus: guaranteeDashboardStatusSchema,
  dashboardColor: guaranteeDashboardColorSchema,
  compliance: guaranteeComplianceSchema,
  suggestedActions: z.array(guaranteeActionTypeSchema),
});
export type GuaranteeControlRow = z.infer<typeof guaranteeControlRowSchema>;

export const guaranteeControlFilterSchema = z.enum([
  "all",
  "not_met",
  "at_risk",
  "performing",
]);
export type GuaranteeControlFilter = z.infer<typeof guaranteeControlFilterSchema>;

export const guaranteePreviewInputSchema = z.object({
  monthlyTraffic: z.number().min(0),
  estimatedConversionRate: z.number().min(0).max(100),
  avgJobValue: z.number().min(0),
  systemCost: z.number().min(0),
});
export type GuaranteePreviewInput = z.infer<typeof guaranteePreviewInputSchema>;

export const guaranteePreviewOutputSchema = z.object({
  projectedLeads: z.number().int().min(0),
  projectedJobs: z.number().int().min(0),
  projectedRevenue: z.number().int().min(0),
  projectedRoiPercentage: z.number(),
});
export type GuaranteePreviewOutput = z.infer<typeof guaranteePreviewOutputSchema>;
