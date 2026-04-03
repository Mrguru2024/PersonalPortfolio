import type { FormAttribution } from "@server/services/leadFromFormService";
import type { ScarcityEvaluationResult } from "./scarcityEngine.types";

type LeadIntakeInput = {
  sourceOfferSlug?: string | null;
  sourceLeadMagnetSlug?: string | null;
  sourceFunnelSlug?: string | null;
  sourceCampaignSlug?: string | null;
  trafficTemperature?: string | null;
  leadScore?: number | null;
};

export function toScarcityFormAttribution(
  input: LeadIntakeInput,
  evaluation: ScarcityEvaluationResult,
): FormAttribution {
  return {
    sourceOfferSlug: input.sourceOfferSlug ?? null,
    sourceLeadMagnetSlug: input.sourceLeadMagnetSlug ?? null,
    sourceFunnelSlug: input.sourceFunnelSlug ?? null,
    sourceCampaignSlug: input.sourceCampaignSlug ?? null,
    trafficTemperature: input.trafficTemperature ?? null,
    sourcePathStage:
      evaluation.status === "full" || evaluation.status === "waitlist"
        ? "waitlist"
        : evaluation.status === "limited"
          ? "limited_intake"
          : "open_intake",
    sourceConversionStage:
      evaluation.route === "waitlist"
        ? "waitlist"
        : evaluation.route === "deferred_cycle" || evaluation.route === "delayed_intake"
          ? "deferred"
          : evaluation.route === "nurture"
            ? "nurture"
            : "qualified",
    sourceQualificationResult: evaluation.route === "qualified_path" ? "qualified" : "nurture_first",
  };
}

export function toScarcityCustomFields(
  evaluation: ScarcityEvaluationResult,
  input: LeadIntakeInput,
): Record<string, unknown> {
  return {
    scarcityConfigId: evaluation.configId,
    scarcityStatus: evaluation.status,
    scarcityRoute: evaluation.route,
    scarcityAvailableSlots: evaluation.availableSlots,
    scarcityUsedSlots: evaluation.usedSlots,
    scarcityWaitlistCount: evaluation.waitlistCount,
    scarcityNextCycleDate: evaluation.nextCycleDate,
    scarcityReason: evaluation.reason,
    scarcityMessage: evaluation.message,
    sourceOfferSlug: input.sourceOfferSlug ?? null,
    sourceLeadMagnetSlug: input.sourceLeadMagnetSlug ?? null,
    sourceFunnelSlug: input.sourceFunnelSlug ?? null,
    sourceCampaignSlug: input.sourceCampaignSlug ?? null,
    sourceTrafficTemperature: input.trafficTemperature ?? null,
    sourceLeadScore: input.leadScore ?? null,
    scarcityEvaluatedAt: new Date().toISOString(),
  };
}
