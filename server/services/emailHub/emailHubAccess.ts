import { db } from "@server/db";
import { emailHubSenders, emailHubSenderPermissions } from "@shared/emailHubSchema";
import { eq, inArray } from "drizzle-orm";

export type EmailHubSessionUser = {
  id: number;
  isAdmin?: boolean | null;
  adminApproved?: boolean | null;
};

export function assertEmailHubUser(user: EmailHubSessionUser | null | undefined): asserts user is EmailHubSessionUser {
  if (!user?.isAdmin || !user.adminApproved) {
    throw new Error("Admin access required");
  }
}

/** Super users see all senders and all analytics; others see owned, explicitly permitted, and org-default senders. */
export async function getAllowedSenderIdsForUser(userId: number, isSuperAdmin: boolean): Promise<number[] | "all"> {
  if (isSuperAdmin) return "all";

  const owned = await db
    .select({ id: emailHubSenders.id })
    .from(emailHubSenders)
    .where(eq(emailHubSenders.founderUserId, userId));

  const permitted = await db
    .select({ emailSenderId: emailHubSenderPermissions.emailSenderId })
    .from(emailHubSenderPermissions)
    .where(eq(emailHubSenderPermissions.userId, userId));

  const orgDefaults = await db
    .select({ id: emailHubSenders.id })
    .from(emailHubSenders)
    .where(eq(emailHubSenders.isDefault, true));

  const ids = new Set<number>();
  for (const r of owned) ids.add(r.id);
  for (const r of permitted) ids.add(r.emailSenderId);
  for (const r of orgDefaults) ids.add(r.id);
  return [...ids];
}

export async function userMayUseSender(userId: number, senderId: number, isSuperAdmin: boolean): Promise<boolean> {
  if (isSuperAdmin) return true;
  const allowed = await getAllowedSenderIdsForUser(userId, false);
  if (allowed === "all") return true;
  return allowed.includes(senderId);
}

export async function listSendersForUser(userId: number, isSuperAdmin: boolean) {
  const allowed = await getAllowedSenderIdsForUser(userId, isSuperAdmin);
  if (allowed === "all") {
    return db.select().from(emailHubSenders).orderBy(emailHubSenders.name);
  }
  if (allowed.length === 0) return [];
  return db
    .select()
    .from(emailHubSenders)
    .where(inArray(emailHubSenders.id, allowed))
    .orderBy(emailHubSenders.name);
}
