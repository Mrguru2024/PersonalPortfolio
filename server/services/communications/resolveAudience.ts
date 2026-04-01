import type { CrmContact } from "@shared/crmSchema";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { getLeadCustomFields } from "@shared/leadCustomFields";
import type { IStorage } from "@server/storage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeAdditionalEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  if (!e || !EMAIL_RE.test(e)) return null;
  return e;
}

export type ResolvedCommRecipient =
  | { source: "crm"; contact: CrmContact }
  | { source: "manual"; email: string };

/**
 * Full campaign audience: CRM segment matches plus optional extra addresses (with dedupe).
 * When `additionalRecipientsOnly` is set, only additional emails are used.
 */
export async function resolveCommCampaignRecipients(
  storage: IStorage,
  filters: CommSegmentFilters,
): Promise<ResolvedCommRecipient[]> {
  const rawManual = filters.additionalEmails ?? [];
  const manualList = [...new Set(rawManual.map(normalizeAdditionalEmail).filter((e): e is string => e != null))];

  if (filters.additionalRecipientsOnly === true) {
    return manualList.map((email) => ({ source: "manual" as const, email }));
  }

  const crmContacts = await resolveCommAudience(storage, filters);
  const crmEmails = new Set(
    crmContacts.map((c) => c.email?.trim().toLowerCase()).filter((e): e is string => Boolean(e)),
  );
  const out: ResolvedCommRecipient[] = crmContacts.map((c) => ({ source: "crm" as const, contact: c }));
  for (const email of manualList) {
    if (!crmEmails.has(email)) out.push({ source: "manual", email });
  }
  return out;
}

/**
 * Resolves CRM contacts for a communications campaign without a duplicate audience DB.
 * Reuses saved-list filter logic where possible, then applies extended filters in memory.
 */
export async function resolveCommAudience(storage: IStorage, filters: CommSegmentFilters): Promise<CrmContact[]> {
  let contacts: CrmContact[];

  if (filters.allCrmContacts === true) {
    contacts = await storage.getCrmContacts();
    contacts = contacts.filter((c) => Boolean(c.email?.trim()));
  } else if (filters.contactIds && filters.contactIds.length > 0) {
    const rows = await Promise.all(filters.contactIds.map((id) => storage.getCrmContactById(id)));
    contacts = rows.filter((c): c is CrmContact => !!c);
  } else {
    contacts = await storage.getCrmContactsBySavedListFilters(filters);
  }

  const excludeDnc = filters.excludeDoNotContact !== false;
  if (excludeDnc) {
    contacts = contacts.filter((c) => !c.doNotContact);
  }

  const narrowExtras = filters.allCrmContacts !== true;
  if (narrowExtras && filters.utmSource) {
    contacts = contacts.filter((c) => (c.utmSource ?? "").toLowerCase() === filters.utmSource!.toLowerCase());
  }
  if (filters.utmMedium) {
    contacts = contacts.filter((c) => (c.utmMedium ?? "").toLowerCase() === filters.utmMedium!.toLowerCase());
  }
  if (filters.utmCampaign) {
    contacts = contacts.filter((c) => (c.utmCampaign ?? "").toLowerCase() === filters.utmCampaign!.toLowerCase());
  }

  if (filters.personaId) {
    const pid = filters.personaId;
    contacts = contacts.filter((c) => {
      const cf = getLeadCustomFields(c.customFields as Record<string, unknown> | null | undefined);
      const p = (cf as { marketingPersonaId?: string }).marketingPersonaId;
      return p === pid;
    });
  }

  if (narrowExtras && filters.bookedCall === true) {
    contacts = contacts.filter((c) => c.bookedCallAt != null);
  } else if (narrowExtras && filters.bookedCall === false) {
    contacts = contacts.filter((c) => c.bookedCallAt == null);
  }

  if (narrowExtras && filters.serviceInterestContains?.trim()) {
    const needle = filters.serviceInterestContains.trim().toLowerCase();
    contacts = contacts.filter((c) => {
      const cf = getLeadCustomFields(c.customFields as Record<string, unknown> | null | undefined);
      const si = cf.serviceInterest;
      const str = Array.isArray(si) ? si.join(" ") : (si ?? c.notes ?? "");
      return str.toLowerCase().includes(needle);
    });
  }

  return contacts;
}
