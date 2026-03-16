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
}

/**
 * Get or create a CRM contact for this form submission; set attribution, apply form_submit score, run segmentation.
 * Returns the CRM contact (created or updated).
 */
export async function ensureCrmLeadFromFormSubmission(input: EnsureLeadInput) {
  const { email, name, phone, company, contactId, attribution, customFields } = input;
  const existing = await storage.getCrmContactsByEmails([email]);
  const now = new Date();

  const attributionUpdates = {
    lastActivityAt: now,
    utmSource: attribution?.utm_source ?? undefined,
    utmMedium: attribution?.utm_medium ?? undefined,
    utmCampaign: attribution?.utm_campaign ?? undefined,
    referringPage: attribution?.referrer ?? undefined,
    landingPage: attribution?.landing_page ?? undefined,
    ...(contactId != null ? { contactId } : {}),
    ...(customFields && Object.keys(customFields).length > 0 ? { customFields } : {}),
  };

  if (existing.length > 0) {
    const lead = existing[0];
    await storage.updateCrmContact(lead.id, {
      ...attributionUpdates,
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
    if (attribution?.visitorId) await storage.attachVisitorToLead(attribution.visitorId, lead.id);
    return storage.getCrmContactById(lead.id);
  }

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
    customFields: customFields ?? undefined,
    lastActivityAt: now,
  });

  await addScoreFromEvent(storage, lead.id, "form_submit", {}).catch(() => {});
  const tags = computeSegmentTags({ contact: lead, recentEvents: [], recentSignals: {} });
  if (tags.length > 0) await storage.updateCrmContact(lead.id, { tags });
  if (attribution?.visitorId) await storage.attachVisitorToLead(attribution.visitorId, lead.id);
  return storage.getCrmContactById(lead.id);
}
