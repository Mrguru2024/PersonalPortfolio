import { z } from "zod";
import {
  scarcityConfigTypes,
  scarcityStatusValues,
  type ScarcityConfigType,
  type ScarcityEngineConfigRow,
  type ScarcityStatus,
} from "@shared/scarcityEngineSchema";

export interface ScarcityQueryScope {
  personaId?: string;
  offerSlug?: string;
  leadMagnetSlug?: string;
  funnelSlug?: string;
}

export interface ScarcityEvaluationContext extends ScarcityQueryScope {
  trafficTemperature?: string | null;
  leadScore?: number | null;
  funnelReadinessScore?: number | null;
  offerScore?: number | null;
  leadMagnetScore?: number | null;
  campaignReadinessScore?: number | null;
  conversionRate30d?: number | null;
  leadQuality30d?: number | null;
  revenueCents30d?: number | null;
  conversionStage?: string | null;
  qualificationResult?: string | null;
}

export interface DynamicScarcityInput {
  status: ScarcityStatus;
  availableSlots: number;
  waitlistCount: number;
  nextCycleDate: string | null;
  daysUntilNextCycle: number;
}

export interface DynamicScarcityDisplay extends DynamicScarcityInput {
  message: string;
}

export type ScarcityRouteDecision =
  | "qualified_path"
  | "waitlist"
  | "deferred_cycle"
  | "delayed_intake"
  | "nurture";

export interface LeadScarcityMeta {
  offerSlug: string | null;
  leadMagnetSlug: string | null;
  funnelSlug: string | null;
  scarcityStateAtEntry: ScarcityStatus;
  wasWaitlisted: boolean;
  cycleJoined: string | null;
  configId: number;
  routeDecision: ScarcityRouteDecision;
}

export interface ScarcityEvaluationResult {
  configId: number;
  configType: ScarcityConfigType;
  status: ScarcityStatus;
  availableSlots: number;
  usedSlots: number;
  waitlistCount: number;
  nextCycleDate: string | null;
  cycleOpen: boolean;
  route: ScarcityRouteDecision;
  qualifiesByLeadScore: boolean;
  unlockedByPerformance: boolean;
  message: string;
  reason?: string;
  leadMeta: LeadScarcityMeta;
}

export interface ScarcityConfigWrite {
  id?: number;
  name: string;
  type: ScarcityConfigType;
  maxSlots: number;
  waitlistEnabled: boolean;
  cycleDurationDays: number;
  cycleStartDate?: Date | null;
  personaLimit?: string | null;
  offerLimit?: string | null;
  leadMagnetLimit?: string | null;
  funnelLimit?: string | null;
  qualificationThreshold: number;
  performanceThresholdsJson?: ScarcityEngineConfigRow["performanceThresholdsJson"];
  isActive: boolean;
}

export const scarcityEvaluationContextSchema = z.object({
  personaId: z.string().optional(),
  offerSlug: z.string().optional(),
  leadMagnetSlug: z.string().optional(),
  funnelSlug: z.string().optional(),
  trafficTemperature: z.string().optional().nullable(),
  leadScore: z.number().optional().nullable(),
  funnelReadinessScore: z.number().optional().nullable(),
  offerScore: z.number().optional().nullable(),
  leadMagnetScore: z.number().optional().nullable(),
  campaignReadinessScore: z.number().optional().nullable(),
  conversionRate30d: z.number().optional().nullable(),
  leadQuality30d: z.number().optional().nullable(),
  revenueCents30d: z.number().optional().nullable(),
  conversionStage: z.string().optional().nullable(),
  qualificationResult: z.string().optional().nullable(),
});

export const scarcityConfigWriteSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(180),
  type: z.enum(scarcityConfigTypes),
  maxSlots: z.number().int().min(0),
  waitlistEnabled: z.boolean(),
  cycleDurationDays: z.number().int().min(1).max(365),
  cycleStartDate: z.coerce.date().optional().nullable(),
  personaLimit: z.string().optional().nullable(),
  offerLimit: z.string().optional().nullable(),
  leadMagnetLimit: z.string().optional().nullable(),
  funnelLimit: z.string().optional().nullable(),
  qualificationThreshold: z.number().int().min(0).max(100),
  performanceThresholdsJson: z
    .object({
      conversionRateMin: z.number().min(0).max(100).optional(),
      leadQualityMin: z.number().min(0).max(100).optional(),
      revenueCentsMin: z.number().int().min(0).optional(),
    })
    .optional(),
  isActive: z.boolean(),
});

export const scarcityStatusSchema = z.enum(scarcityStatusValues);
