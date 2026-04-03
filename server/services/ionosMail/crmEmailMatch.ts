import { sql } from "drizzle-orm";
import { db } from "@server/db";
import { crmContacts } from "@shared/crmSchema";
import type { SystemEmailCrmMatch, SystemEmailMessage } from "@shared/systemEmailTypes";

/**
 * Match an inbound email address to CRM contacts (exact case-insensitive).
 * Future: accounts/deals join, merge rules, secondary emails on customFields.
 */
export async function findCrmMatchesForEmail(address: string): Promise<SystemEmailCrmMatch[]> {
  const normalized = address.trim().toLowerCase();
  if (!normalized.includes("@")) return [];

  const rows = await db
    .select({
      id: crmContacts.id,
      name: crmContacts.name,
      email: crmContacts.email,
      type: crmContacts.type,
      status: crmContacts.status,
    })
    .from(crmContacts)
    .where(sql`lower(trim(${crmContacts.email})) = ${normalized}`)
    .limit(8);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    type: r.type,
    status: r.status,
  }));
}

export async function enrichSystemEmailMessagesWithCrm(
  messages: SystemEmailMessage[],
): Promise<SystemEmailMessage[]> {
  const unique = [...new Set(messages.map((m) => m.fromAddress).filter(Boolean))];
  const cache = new Map<string, SystemEmailCrmMatch[]>();
  await Promise.all(
    unique.map(async (email) => {
      cache.set(email, await findCrmMatchesForEmail(email));
    }),
  );
  return messages.map((m) => ({ ...m, crmMatches: cache.get(m.fromAddress) ?? [] }));
}
