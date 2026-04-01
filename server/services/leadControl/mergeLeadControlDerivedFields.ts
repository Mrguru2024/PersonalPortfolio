import type { LeadControlOrgConfig } from "@shared/leadControlOrgSettingsTypes";
import type { LeadControlPriorityBand } from "@shared/leadControlPriority";
import { computeLeadControlPriority } from "@shared/leadControlPriority";
import { evaluateLeadControlRoutingHint } from "@shared/leadControlRouting";
import type { CrmContact } from "@shared/crmSchema";

/** Persists Lead Control band + routing hint from current contact row and org routing rules. */
export function mergeLeadControlPersistedFields(
  contact: CrmContact,
  orgConfig: LeadControlOrgConfig | null | undefined,
  now: Date = new Date(),
): { leadControlPriority: LeadControlPriorityBand; leadRoutingHint: string | null } {
  return {
    leadControlPriority: computeLeadControlPriority(contact, now),
    leadRoutingHint: evaluateLeadControlRoutingHint(contact, orgConfig),
  };
}
