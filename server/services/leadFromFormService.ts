/**
 * Ensure a CRM lead exists from a form submission; set attribution, run scoring and segmentation.
 * Call after contact/create or qualification form submit.
 */

import { storage } from "@server/storage";
import { addScoreFromEvent } from "@server/services/leadScoringService";
import { computeSegmentTags, mergeSegmentTags } from "@server/services/leadSegmentationService";

export interface FormAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  visitorId?: string | null;
}

/** Self-reported fields from forms — stored on crm_contacts for analytics + tagging */
export interface LeadFormDemographics {
  ageRange?: string | null;
  gender?: string | null;
  occupation?: string | null;
  companySize?: string | null;
  industry?: string | null;
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
    referringPage: attribution?.referrer ?? undefined,
    landingPage: attribution?.landing_page ?? undefined,
    ...(contactId != null ? { contactId } : {}),
  };

  if (existing.length > 0) {
    const lead = existing[0];
    const mergedCustom = mergeRecord(lead.customFields as Record<string, unknown>, customFields ?? undefined);
    const finalCustom = mergeRecord(mergedCustom, visitorEnrichment);

    await storage.updateCrmContact(lead.id, {
      ...attributionUpdates,
      ...demo,
      customFields: Object.keys(finalCustom).length ? finalCustom : undefined,
      name: name || lead.name,
      phone: phone ?? lead.phone,
      company: company ?? lead.company,
    });
    await addScoreFromEvent(storage, lead.id, "form_submit", {}).catch(() => {});
    const events = await storage.getVisitorActivityByLeadId(lead.id);
    const updated = await storage.getCrmContactById(lead.id);
    if (updated) {
      const tags = mergeSegmentTags(updated.tags ?? undefined, computeSegmentTags({ contact: updated, recentEvents: events, recentSignals: {} }));
      if (tags.length > 0) await storage.updateCrmContact(lead.id, { tags });
    }
    if (vid) await storage.attachVisitorToLead(vid, lead.id);
    return storage.getCrmContactById(lead.id);
  }

  const finalCustomCreate = mergeRecord(mergeRecord(undefined, customFields ?? undefined), visitorEnrichment);

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
    customFields: Object.keys(finalCustomCreate).length ? finalCustomCreate : undefined,
    lastActivityAt: now,
    ageRange: demographics?.ageRange?.trim() || null,
    gender: demographics?.gender?.trim() || null,
    occupation: demographics?.occupation?.trim() || null,
    companySize: demographics?.companySize?.trim() || null,
    industry: demographics?.industry?.trim() || null,
  });

  await addScoreFromEvent(storage, lead.id, "form_submit", {}).catch(() => {});
  const tags = computeSegmentTags({ contact: lead, recentEvents: [], recentSignals: {} });
  if (tags.length > 0) await storage.updateCrmContact(lead.id, { tags });
  if (vid) await storage.attachVisitorToLead(vid, lead.id);
  return storage.getCrmContactById(lead.id);
}
