/**
 * Client-facing Growth System snapshot — safe DTO for GET /api/client/growth-snapshot.
 * No internal field names from AMIE/CRM exposed as raw keys in UI copy.
 */
import { z } from "zod";

export const growthStepStateSchema = z.enum([
  "locked",
  "not_started",
  "in_progress",
  "complete",
  "active",
  "optimizing",
]);
export type GrowthStepState = z.infer<typeof growthStepStateSchema>;

export const bandSummarySchema = z.object({
  label: z.string(),
  /** 1 line for owners */
  summary: z.string(),
});
export type BandSummary = z.infer<typeof bandSummarySchema>;

export const growthLineItemSchema = z.object({
  label: z.string(),
  status: z.enum(["pending", "in_progress", "active", "done", "unknown"]),
  detail: z.string().optional(),
});
export type GrowthLineItem = z.infer<typeof growthLineItemSchema>;

export const growthCtaSchema = z.object({
  label: z.string(),
  href: z.string(),
});
export type GrowthCta = z.infer<typeof growthCtaSchema>;

export const growthActivityItemSchema = z.object({
  title: z.string(),
  at: z.string(),
  kind: z.string(),
});
export type GrowthActivityItem = z.infer<typeof growthActivityItemSchema>;

export const clientGrowthSnapshotSchema = z.object({
  businessLabel: z.string(),
  growthStatusLine: z.string(),
  step: z.object({
    diagnose: growthStepStateSchema,
    build: growthStepStateSchema,
    scale: growthStepStateSchema,
    current: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  }),
  diagnose: z.object({
    healthScore0to100: z.number().int().min(0).max(100).nullable(),
    statusSummary: z.string(),
    primaryIssue: z.string(),
    missedOpportunityHint: z.string(),
    market: bandSummarySchema,
    website: bandSummarySchema,
    offer: bandSummarySchema,
    nextCta: growthCtaSchema,
  }),
  build: z.object({
    activationSummary: z.string(),
    funnel: z.array(growthLineItemSchema),
    messaging: z.array(growthLineItemSchema),
    capture: z.array(growthLineItemSchema),
    followUp: z.array(growthLineItemSchema),
    nextCta: growthCtaSchema,
  }),
  scale: z.object({
    leadsThisWeekApprox: z.number().int().nullable(),
    bookingsCount: z.number().int().nullable(),
    topChannelLabel: z.string().nullable(),
    trendHint: z.string(),
    improvementBullets: z.array(z.string()),
    nextCta: growthCtaSchema,
  }),
  activity: z.array(growthActivityItemSchema),
});

export type ClientGrowthSnapshot = z.infer<typeof clientGrowthSnapshotSchema>;
