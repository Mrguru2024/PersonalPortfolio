/**
 * Ensure a CRM lead exists from a form submission; set attribution, run scoring and segmentation.
 * Call after contact/create or qualification form submit.
 */

import { storage } from "@server/storage";
import { addScoreFromEvent } from "@server/services/leadScoringService";
import { computeSegmentTags, mergeSegmentTags } from "@server/services/leadSegmentationService";
import { getLeadCustomFields } from "@shared/leadCustomFields";

export interface FormAttribution {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  ttclid?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
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
  const normalizedIncomingCustomFields = customFields ?? {};

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
    const currentCustomFields = getLeadCustomFields(lead.customFields);
    const mergedCustomFields: Record<string, unknown> = {
      ...currentCustomFields,
      ...normalizedIncomingCustomFields,
      lastTouchSource: attribution?.utm_source ?? currentCustomFields.lastTouchSource,
      lastTouchMedium: attribution?.utm_medium ?? currentCustomFields.lastTouchMedium,
      lastTouchCampaign: attribution?.utm_campaign ?? currentCustomFields.lastTouchCampaign,
      lastTouchTerm: attribution?.utm_term ?? currentCustomFields.lastTouchTerm,
      lastTouchContent: attribution?.utm_content ?? currentCustomFields.lastTouchContent,
      landingPage: attribution?.landing_page ?? currentCustomFields.landingPage,
      referringPage: attribution?.referrer ?? currentCustomFields.referringPage,
      gclid: attribution?.gclid ?? currentCustomFields.gclid,
      fbclid: attribution?.fbclid ?? currentCustomFields.fbclid,
      msclkid: attribution?.msclkid ?? currentCustomFields.msclkid,
      ttclid: attribution?.ttclid ?? currentCustomFields.ttclid,
    };
    if (!currentCustomFields.firstTouchSource && attribution?.utm_source) mergedCustomFields.firstTouchSource = attribution.utm_source;
    if (!currentCustomFields.firstTouchMedium && attribution?.utm_medium) mergedCustomFields.firstTouchMedium = attribution.utm_medium;
    if (!currentCustomFields.firstTouchCampaign && attribution?.utm_campaign) mergedCustomFields.firstTouchCampaign = attribution.utm_campaign;
    if (!currentCustomFields.firstTouchTerm && attribution?.utm_term) mergedCustomFields.firstTouchTerm = attribution.utm_term;
    if (!currentCustomFields.firstTouchContent && attribution?.utm_content) mergedCustomFields.firstTouchContent = attribution.utm_content;

    await storage.updateCrmContact(lead.id, {
      ...attributionUpdates,
      name: name || lead.name,
      phone: phone ?? lead.phone,
      company: company ?? lead.company,
      customFields: mergedCustomFields,
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
    customFields: {
      ...normalizedIncomingCustomFields,
      firstTouchSource: attribution?.utm_source ?? null,
      firstTouchMedium: attribution?.utm_medium ?? null,
      firstTouchCampaign: attribution?.utm_campaign ?? null,
      firstTouchTerm: attribution?.utm_term ?? null,
      firstTouchContent: attribution?.utm_content ?? null,
      lastTouchSource: attribution?.utm_source ?? null,
      lastTouchMedium: attribution?.utm_medium ?? null,
      lastTouchCampaign: attribution?.utm_campaign ?? null,
      lastTouchTerm: attribution?.utm_term ?? null,
      lastTouchContent: attribution?.utm_content ?? null,
      gclid: attribution?.gclid ?? null,
      fbclid: attribution?.fbclid ?? null,
      msclkid: attribution?.msclkid ?? null,
      ttclid: attribution?.ttclid ?? null,
    },
    lastActivityAt: now,
  });

  await addScoreFromEvent(storage, lead.id, "form_submit", {}).catch(() => {});
  const tags = computeSegmentTags({ contact: lead, recentEvents: [], recentSignals: {} });
  if (tags.length > 0) await storage.updateCrmContact(lead.id, { tags });
  if (attribution?.visitorId) await storage.attachVisitorToLead(attribution.visitorId, lead.id);
  return storage.getCrmContactById(lead.id);
}
