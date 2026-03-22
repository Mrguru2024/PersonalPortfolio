import type { CrmContact } from "@shared/crmSchema";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { getLeadCustomFields } from "@shared/leadCustomFields";
import type { IStorage } from "@server/storage";

/**
 * Resolves CRM contacts for a communications campaign without a duplicate audience DB.
 * Reuses saved-list filter logic where possible, then applies extended filters in memory.
 */
export async function resolveCommAudience(storage: IStorage, filters: CommSegmentFilters): Promise<CrmContact[]> {
  let contacts: CrmContact[];

  if (filters.contactIds && filters.contactIds.length > 0) {
    const rows = await Promise.all(filters.contactIds.map((id) => storage.getCrmContactById(id)));
    contacts = rows.filter((c): c is CrmContact => !!c);
  } else {
    contacts = await storage.getCrmContactsBySavedListFilters(filters);
  }

  const excludeDnc = filters.excludeDoNotContact !== false;
  if (excludeDnc) {
    contacts = contacts.filter((c) => !c.doNotContact);
  }

  if (filters.utmSource) {
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

  if (filters.bookedCall === true) {
    contacts = contacts.filter((c) => c.bookedCallAt != null);
  } else if (filters.bookedCall === false) {
    contacts = contacts.filter((c) => c.bookedCallAt == null);
  }

  if (filters.serviceInterestContains?.trim()) {
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
