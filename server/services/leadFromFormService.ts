/**
 * Ensure a CRM lead exists from a form submission; set attribution, run scoring and segmentation.
 * Call after contact/create or qualification form submit.
 */

import { storage } from "@server/storage";
import { addScoreFromEvent } from "@server/services/leadScoringService";
import { computeSegmentTags, mergeSegmentTags } from "@server/services/leadSegmentationService";
import { onNewCrmContactCreated } from "@server/services/revenueOpsService";
import {
  recordAeeCrmAttributionEvent,
  resolveAeeExperimentVariantForAttribution,
} from "@server/services/experimentation/aeeCrmAttributionService";
import { syncPpcRevenueLayerAfterFormLead } from "@server/services/paid-growth/ppcRevenueFormSync";
import {
  evaluateScarcityForContext,
  type ScarcityEvaluationResult,
} from "@modules/scarcity-engine";

export interface FormAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  visitorId?: string | null;
  /** First-party session key (localStorage); pairs with visitorId for `ppc_attribution_sessions`. */
  sessionId?: string | null;
  /** AEE: stable experiment key or numeric ids from forms / tracking. */
  experimentKey?: string | null;
  variantKey?: string | null;
  experimentId?: number | string | null;
  variantId?: number | string | null;
  sourceOfferSlug?: string | null;
  sourceLeadMagnetSlug?: string | null;
  sourceFunnelSlug?: string | null;
  sourceCampaignSlug?: string | null;
  sourceCampaignId?: number | string | null;
  sourceCampaignType?: string | null;
  trafficTemperature?: string | null;
  sourcePathStage?: string | null;
  sourceConversionStage?: string | null;
  sourceQualificationResult?: string | null;
}

/** Self-reported fields from forms — stored on crm_contacts for analytics + tagging */
export interface LeadFormDemographics {
  ageRange?: string | null;
  gender?: string | null;
  occupation?: string | null;
  companySize?: string | null;
  industry?: string | null;
}

function isPaidSearchAttribution(a: FormAttribution | null | undefined): boolean {
  const medium = (a?.utm_medium || "").toLowerCase();
  if (/^(cpc|ppc|paidsearch|paid)$/i.test(medium.replace(/\s/g, ""))) return true;
  if (medium.includes("cpc") || medium.includes("ppc") || medium.includes("paid")) return true;
  return false;
}

export interface EnsureLeadInput {
  email: string;
  name: string;
  phone?: string | null;
  company?: string | null;
  /** Optional: link to legacy contacts.id */
  contactId?: number | null;
  /** Attribution from request (URL params or body). */
  attribution?: FormAttribution | null;
  /** Custom fields for lead intelligence (businessType, pain points, etc.). */
  customFields?: Record<string, unknown> | null;
  /** Maps to crm_contacts age/gender/occupation/company_size/industry when present */
  demographics?: LeadFormDemographics | null;
}

type MaybeScarcityInput = {
  sourceOfferSlug?: string | null;
  sourceLeadMagnetSlug?: string | null;
  sourceFunnelSlug?: string | null;
  sourceTrafficTemperature?: string | null;
  sourceLeadScore?: number | null;
};

function mergeRecord(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ...(a && typeof a === "object" ? a : {}),
    ...(b && typeof b === "object" ? b : {}),
  };
  return out;
}

function normalizeText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function normalizeNumeric(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

function demographicsPatch(d: LeadFormDemographics | null | undefined): Record<string, string> {
  if (!d) return {};
  const out: Record<string, string> = {};
  if (d.ageRange?.trim()) out.ageRange = d.ageRange.trim();
  if (d.gender?.trim()) out.gender = d.gender.trim();
  if (d.occupation?.trim()) out.occupation = d.occupation.trim();
  if (d.companySize?.trim()) out.companySize = d.companySize.trim();
  if (d.industry?.trim()) out.industry = d.industry.trim();
  return out;
}

/**
 * Get or create a CRM contact for this form submission; set attribution, apply form_submit score, run segmentation.
 * Returns the CRM contact (created or updated).
 */
export async function ensureCrmLeadFromFormSubmission(input: EnsureLeadInput) {
  const { email, name, phone, company, contactId, attribution, customFields, demographics } = input;
  const existing = await storage.getCrmContactsByEmails([email]);
  const now = new Date();

  let visitorEnrichment: Record<string, unknown> = {};
  const vid = attribution?.visitorId?.trim();
  if (vid) {
    const snap = await storage.getLatestVisitorSnapshot(vid);
    if (snap && (snap.country || snap.region || snap.city || snap.deviceType || snap.timezone)) {
      visitorEnrichment = {
        ...(snap.country ? { inferredCountry: snap.country } : {}),
        ...(snap.region ? { inferredRegion: snap.region } : {}),
        ...(snap.city ? { inferredCity: snap.city } : {}),
        ...(snap.deviceType ? { inferredDeviceType: snap.deviceType } : {}),
        ...(snap.timezone ? { inferredTimezone: snap.timezone } : {}),
        inferredFromVisitorTrackingAt: now.toISOString(),
      };
    }
  }

  const demo = demographicsPatch(demographics);

  const attributionUpdates = {
    lastActivityAt: now,
    utmSource: attribution?.utm_source ?? undefined,
    utmMedium: attribution?.utm_medium ?? undefined,
    utmCampaign: attribution?.utm_campaign ?? undefined,
    utmContent: attribution?.utm_content ?? undefined,
    utmTerm: attribution?.utm_term ?? undefined,
    referringPage: attribution?.referrer ?? undefined,
    landingPage: attribution?.landing_page ?? undefined,
    ...(contactId != null ? { contactId } : {}),
  };
  const sourceOfferSlug = normalizeText(attribution?.sourceOfferSlug);
  const sourceLeadMagnetSlug = normalizeText(attribution?.sourceLeadMagnetSlug);
  const sourceFunnelSlug = normalizeText(attribution?.sourceFunnelSlug);
  const sourceCampaignSlug =
    normalizeText(attribution?.sourceCampaignSlug) ??
    normalizeText(attribution?.sourceCampaignType) ??
    (normalizeNumeric(attribution?.sourceCampaignId) != null
      ? `campaign-${normalizeNumeric(attribution?.sourceCampaignId)}`
      : null);
  const sourceCampaignId = normalizeNumeric(attribution?.sourceCampaignId);
  const sourceCampaignType = normalizeText(attribution?.sourceCampaignType);
  const sourceTrafficTemperature = normalizeText(attribution?.trafficTemperature);
  const sourcePathStage =
    normalizeText(attribution?.sourcePathStage) ?? normalizeText(attribution?.sourceConversionStage);
  const sourceQualificationResult = normalizeText(attribution?.sourceQualificationResult);
  const scarcityContextInput: MaybeScarcityInput = {
    sourceOfferSlug: sourceOfferSlug ?? normalizeText(customFields?.sourceOfferSlug),
    sourceLeadMagnetSlug: sourceLeadMagnetSlug ?? normalizeText(customFields?.sourceLeadMagnetSlug),
    sourceFunnelSlug: sourceFunnelSlug ?? normalizeText(customFields?.sourceFunnelSlug),
    sourceTrafficTemperature:
      sourceTrafficTemperature ?? normalizeText(customFields?.sourceTrafficTemperature),
    sourceLeadScore: normalizeNumeric(customFields?.sourceLeadScore),
  };
  const scarcity = await evaluateScarcityForContext({
    offerSlug: scarcityContextInput.sourceOfferSlug ?? undefined,
    leadMagnetSlug: scarcityContextInput.sourceLeadMagnetSlug ?? undefined,
    funnelSlug: scarcityContextInput.sourceFunnelSlug ?? undefined,
    trafficTemperature: scarcityContextInput.sourceTrafficTemperature ?? undefined,
    leadScore: scarcityContextInput.sourceLeadScore ?? undefined,
  }).catch(() => null as ScarcityEvaluationResult | null);
  const scarcityRoute = scarcity?.route;
  const scarcityConversionStage =
    scarcityRoute === "waitlist"
      ? "waitlist"
      : scarcityRoute === "delayed_intake"
        ? "deferred"
        : scarcityRoute === "nurture"
          ? "nurture"
          : null;
  const scarcityQualificationResult =
    scarcityRoute === "qualified_path" ? "qualified" : "nurture_first";
  const scarcitySourcePathStage =
    scarcity?.status === "waitlist"
      ? "waitlist"
      : scarcity?.status === "limited"
        ? "limited_intake"
        : scarcity?.status
          ? "open_intake"
          : null;

  if (existing.length > 0) {
    const lead = existing[0];
    const mergedCustom = mergeRecord(lead.customFields as Record<string, unknown>, customFields ?? undefined);
    const finalCustom = mergeRecord(mergedCustom, visitorEnrichment);
    const sourceAwareCustom = mergeRecord(finalCustom, {
      ...(sourceOfferSlug ? { sourceOfferSlug } : {}),
      ...(sourceLeadMagnetSlug ? { sourceLeadMagnetSlug } : {}),
      ...(sourceFunnelSlug ? { sourceFunnelSlug } : {}),
      ...(sourceCampaignSlug ? { sourceCampaignSlug } : {}),
      ...(sourceCampaignId != null ? { sourceCampaignId } : {}),
      ...(sourceCampaignType ? { sourceCampaignType } : {}),
      ...(sourceTrafficTemperature ? { sourceTrafficTemperature } : {}),
      ...(sourcePathStage ? { sourcePathStage } : {}),
      ...(sourceQualificationResult ? { sourceQualificationResult } : {}),
      ...(scarcity ? {
        scarcityConfigId: scarcity.configId,
        scarcityStatus: scarcity.status,
        scarcityRoute: scarcity.route,
        scarcityAvailableSlots: scarcity.availableSlots,
        scarcityUsedSlots: scarcity.usedSlots,
        scarcityWaitlistCount: scarcity.waitlistCount,
        scarcityNextCycleDate: scarcity.nextCycleDate,
        scarcityMessage: scarcity.message,
      } : {}),
    });

    await storage.updateCrmContact(lead.id, {
      ...attributionUpdates,
      ...demo,
      sourceOfferSlug: sourceOfferSlug ?? undefined,
      sourceLeadMagnetSlug: sourceLeadMagnetSlug ?? undefined,
      sourceFunnelSlug: sourceFunnelSlug ?? undefined,
      sourceCampaignSlug: sourceCampaignSlug ?? undefined,
      sourceTrafficTemperature: sourceTrafficTemperature ?? undefined,
      sourcePathStage:
        scarcitySourcePathStage ?? sourcePathStage ?? undefined,
      sourceConversionStage:
        scarcityConversionStage ?? undefined,
      sourceQualificationResult:
        sourceQualificationResult ?? scarcityQualificationResult ?? undefined,
      customFields: Object.keys(sourceAwareCustom).length ? sourceAwareCustom : undefined,
      name: name || lead.name,
      phone: phone ?? lead.phone,
      company: company ?? lead.company,
    });
    await addScoreFromEvent(storage, lead.id, "form_submit", {}).catch(() => {});
    const events = await storage.getVisitorActivityByLeadId(lead.id);
    const updated = await storage.getCrmContactById(lead.id);
    if (updated) {
      let tags = mergeSegmentTags(updated.tags ?? undefined, computeSegmentTags({ contact: updated, recentEvents: events, recentSignals: {} }));
      if (isPaidSearchAttribution(attribution)) {
        tags = mergeSegmentTags(tags, ["ascendra_ppc_attribution"]);
      }
      if (tags.length > 0) await storage.updateCrmContact(lead.id, { tags });
    }
    if (vid) await storage.attachVisitorToLead(vid, lead.id);
    await syncPpcRevenueLayerAfterFormLead(storage, lead.id, attribution, isPaidSearchAttribution(attribution)).catch(
      () => {},
    );
    return storage.getCrmContactById(lead.id);
  }

  const finalCustomCreate = mergeRecord(mergeRecord(undefined, customFields ?? undefined), visitorEnrichment);
  const finalCustomCreateWithSource = mergeRecord(finalCustomCreate, {
    ...(sourceOfferSlug ? { sourceOfferSlug } : {}),
    ...(sourceLeadMagnetSlug ? { sourceLeadMagnetSlug } : {}),
    ...(sourceFunnelSlug ? { sourceFunnelSlug } : {}),
    ...(sourceCampaignSlug ? { sourceCampaignSlug } : {}),
    ...(sourceCampaignId != null ? { sourceCampaignId } : {}),
    ...(sourceCampaignType ? { sourceCampaignType } : {}),
    ...(sourceTrafficTemperature ? { sourceTrafficTemperature } : {}),
    ...(sourcePathStage ? { sourcePathStage } : {}),
    ...(sourceQualificationResult ? { sourceQualificationResult } : {}),
    ...(scarcity ? {
      scarcityConfigId: scarcity.configId,
      scarcityStatus: scarcity.status,
      scarcityRoute: scarcity.route,
      scarcityAvailableSlots: scarcity.availableSlots,
      scarcityUsedSlots: scarcity.usedSlots,
      scarcityWaitlistCount: scarcity.waitlistCount,
      scarcityNextCycleDate: scarcity.nextCycleDate,
      scarcityMessage: scarcity.message,
    } : {}),
  });

  const lead = await storage.createCrmContact({
    type: "lead",
    name: name || "Unknown",
    email,
    phone: phone ?? null,
    company: company ?? null,
    source: attribution?.utm_source ?? "website",
    status: "new",
    contactId: contactId ?? null,
    utmSource: attribution?.utm_source ?? null,
    utmMedium: attribution?.utm_medium ?? null,
    utmCampaign: attribution?.utm_campaign ?? null,
    referringPage: attribution?.referrer ?? null,
    landingPage: attribution?.landing_page ?? null,
    sourceOfferSlug,
    sourceLeadMagnetSlug,
    sourceFunnelSlug,
    sourceCampaignSlug,
    sourceTrafficTemperature,
    sourcePathStage: scarcitySourcePathStage ?? sourcePathStage,
    sourceConversionStage: scarcityConversionStage ?? undefined,
    sourceQualificationResult: sourceQualificationResult ?? scarcityQualificationResult,
    customFields: Object.keys(finalCustomCreateWithSource).length ? finalCustomCreateWithSource : undefined,
    lastActivityAt: now,
    ageRange: demographics?.ageRange?.trim() || null,
    gender: demographics?.gender?.trim() || null,
    occupation: demographics?.occupation?.trim() || null,
    companySize: demographics?.companySize?.trim() || null,
    industry: demographics?.industry?.trim() || null,
  });

  await addScoreFromEvent(storage, lead.id, "form_submit", {}).catch(() => {});
  let tags = computeSegmentTags({ contact: lead, recentEvents: [], recentSignals: {} });
  if (isPaidSearchAttribution(attribution)) {
    tags = mergeSegmentTags(tags, ["ascendra_ppc_attribution"]);
  }
  if (tags.length > 0) await storage.updateCrmContact(lead.id, { tags });
  if (vid) await storage.attachVisitorToLead(vid, lead.id);
  const created = await storage.getCrmContactById(lead.id);
  if (created) await onNewCrmContactCreated(storage, created).catch(() => {});
  if (created) {
    const aeeResolved = await resolveAeeExperimentVariantForAttribution(attribution).catch(() => null);
    if (aeeResolved) {
      await recordAeeCrmAttributionEvent({
        contactId: created.id,
        visitorId: attribution?.visitorId ?? null,
        experimentId: aeeResolved.experimentId,
        variantId: aeeResolved.variantId,
        eventKind: "lead_created",
        metadataJson: { source: "ensureCrmLeadFromFormSubmission" },
      }).catch(() => {});
    }
    await syncPpcRevenueLayerAfterFormLead(storage, created.id, attribution, isPaidSearchAttribution(attribution)).catch(
      () => {},
    );
  }
  return created;
}
