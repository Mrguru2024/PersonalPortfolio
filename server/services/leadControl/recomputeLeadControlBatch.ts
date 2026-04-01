import type { IStorage } from "@server/storage";
import { computeLeadControlPriority } from "@shared/leadControlPriority";
import { evaluateLeadControlRoutingHint } from "@shared/leadControlRouting";
import type { LeadControlOrgConfig } from "@shared/leadControlOrgSettingsTypes";

export type RecomputeLeadControlOptions = {
  contactIds?: number[];
  /** When true, refresh lead_control_priority from shared rules. */
  updatePriority: boolean;
  /** When true, refresh lead_routing_hint from org routing rules config. */
  updateRoutingHint: boolean;
  /** Cap when scanning all leads (default 2000, max 5000). */
  limit?: number;
};

export async function recomputeLeadControlBatch(
  storage: IStorage,
  orgConfig: LeadControlOrgConfig | null | undefined,
  opts: RecomputeLeadControlOptions,
): Promise<{ updated: number; scanned: number }> {
  if (!opts.updatePriority && !opts.updateRoutingHint) {
    return { updated: 0, scanned: 0 };
  }

  const maxCap = 5000;
  const defaultLimit = 2000;
  const limit = Math.min(
    maxCap,
    Math.max(1, typeof opts.limit === "number" && Number.isFinite(opts.limit) ? Math.floor(opts.limit) : defaultLimit),
  );

  const contacts = opts.contactIds?.length
    ? await storage.getCrmContactsByIds(opts.contactIds.filter((id) => Number.isFinite(id)))
    : await storage.getCrmContacts("lead", limit);

  let updated = 0;
  for (const c of contacts) {
    const patch: {
      leadControlPriority?: string;
      leadRoutingHint?: string | null;
    } = {};

    if (opts.updatePriority) {
      patch.leadControlPriority = computeLeadControlPriority(c);
    }
    if (opts.updateRoutingHint) {
      patch.leadRoutingHint = evaluateLeadControlRoutingHint(c, orgConfig);
    }

    const hasPatch = Object.keys(patch).length > 0;
    if (!hasPatch) continue;

    const same =
      (!opts.updatePriority || c.leadControlPriority === patch.leadControlPriority) &&
      (!opts.updateRoutingHint || (c.leadRoutingHint ?? null) === (patch.leadRoutingHint ?? null));
    if (same) continue;

    await storage.updateCrmContact(c.id, patch);
    updated += 1;
  }

  return { updated, scanned: contacts.length };
}
