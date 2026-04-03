import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@server/db";
import {
  adminInboxItems,
  adminInboxReads,
  pushSubscriptions,
  users,
} from "@shared/schema";
import { storage } from "@server/storage";
import { pushNotificationService } from "@server/services/pushNotificationService";

export type RecordAdminInboxInput = {
  kind: string;
  title: string;
  body?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  metadata?: Record<string, unknown> | null;
  /** When false, skip web push (still records inbox). Default true. */
  sendPush?: boolean;
};

/**
 * Persist an inbox row for all approved admins and optionally send web push
 * to subscribed admins (respects admin_settings.pushNotificationsEnabled).
 */
export async function recordAdminInboxAndNotify(
  input: RecordAdminInboxInput,
): Promise<{ id: number }> {
  const [row] = await db
    .insert(adminInboxItems)
    .values({
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      linkUrl: "/admin/inbox",
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      metadata: input.metadata ?? null,
    })
    .returning({ id: adminInboxItems.id });

  if (!row?.id) {
    throw new Error("admin_inbox_items insert failed");
  }

  const linkUrl = `/admin/inbox?item=${row.id}`;
  await db
    .update(adminInboxItems)
    .set({ linkUrl })
    .where(eq(adminInboxItems.id, row.id));

  if (input.sendPush !== false) {
    try {
      await sendFormInboundPushToAdmins({
        title: input.title,
        body: (input.body ?? "").slice(0, 180),
        tag: `admin-inbox-${input.kind}`,
        url: linkUrl,
      });
    } catch (e) {
      console.warn("[adminInbox] push notify failed:", e);
    }
  }

  return { id: row.id };
}

/** Fire-and-forget inbox + push so API handlers stay fast and never fail the user request. */
export function queueAdminInboundNotification(input: RecordAdminInboxInput): void {
  void recordAdminInboxAndNotify(input).catch((err) => {
    console.error("[adminInbox] queueAdminInboundNotification failed:", err);
  });
}

async function sendFormInboundPushToAdmins(opts: {
  title: string;
  body: string;
  tag: string;
  url: string;
}): Promise<void> {
  if (!pushNotificationService.getPublicKey()) return;

  const subs = await db
    .select({
      userId: pushSubscriptions.userId,
      endpoint: pushSubscriptions.endpoint,
      keys: pushSubscriptions.keys,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(pushSubscriptions.userId, users.id))
    .where(
      and(eq(users.isAdmin, true), eq(users.adminApproved, true)),
    );

  const payloads: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }[] = [];

  for (const s of subs) {
    const settings = await storage.getAdminSettings(s.userId);
    if (settings?.pushNotificationsEnabled === false) continue;
    if (
      !s.keys ||
      typeof s.keys !== "object" ||
      !("p256dh" in s.keys) ||
      !("auth" in s.keys)
    ) {
      continue;
    }
    payloads.push({
      endpoint: s.endpoint,
      keys: s.keys as { p256dh: string; auth: string },
    });
  }

  if (payloads.length === 0) return;

  await pushNotificationService.sendToSubscriptions(payloads, {
    title: opts.title,
    body: opts.body || "New inbound activity",
    tag: opts.tag,
    requireInteraction: false,
    data: { url: opts.url },
  });
}

export async function getAdminInboxUnreadCount(userId: number): Promise<number> {
  const settings = await storage.getAdminSettings(userId);
  if (settings?.inAppNotifications === false) return 0;

  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(adminInboxItems)
    .leftJoin(
      adminInboxReads,
      and(
        eq(adminInboxReads.itemId, adminInboxItems.id),
        eq(adminInboxReads.userId, userId),
      ),
    )
    .where(isNull(adminInboxReads.readAt));

  return r?.c ?? 0;
}

/** List inbox items with isRead for the given user (newest first). */
export async function listAdminInboxForUser(
  userId: number,
  opts?: { limit?: number; offset?: number },
): Promise<
  Array<
    (typeof adminInboxItems.$inferSelect) & {
      isRead: boolean;
    }
  >
> {
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 200);
  const offset = Math.max(opts?.offset ?? 0, 0);

  const rows = await db
    .select({
      id: adminInboxItems.id,
      kind: adminInboxItems.kind,
      title: adminInboxItems.title,
      body: adminInboxItems.body,
      linkUrl: adminInboxItems.linkUrl,
      relatedType: adminInboxItems.relatedType,
      relatedId: adminInboxItems.relatedId,
      metadata: adminInboxItems.metadata,
      createdAt: adminInboxItems.createdAt,
      readAt: adminInboxReads.readAt,
    })
    .from(adminInboxItems)
    .leftJoin(
      adminInboxReads,
      and(
        eq(adminInboxReads.itemId, adminInboxItems.id),
        eq(adminInboxReads.userId, userId),
      ),
    )
    .orderBy(desc(adminInboxItems.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    linkUrl: r.linkUrl,
    relatedType: r.relatedType,
    relatedId: r.relatedId,
    metadata: r.metadata,
    createdAt: r.createdAt,
    isRead: r.readAt != null,
  }));
}

export async function markAdminInboxRead(
  userId: number,
  itemId: number,
): Promise<void> {
  await db
    .insert(adminInboxReads)
    .values({ userId, itemId, readAt: new Date() })
    .onConflictDoNothing({
      target: [adminInboxReads.userId, adminInboxReads.itemId],
    });
}

/** Fetch one inbox row (global feed; any approved admin may open). */
export async function getAdminInboxItemById(
  itemId: number,
): Promise<(typeof adminInboxItems.$inferSelect) | undefined> {
  const [row] = await db
    .select()
    .from(adminInboxItems)
    .where(eq(adminInboxItems.id, itemId))
    .limit(1);
  return row;
}

export async function markAllAdminInboxRead(userId: number): Promise<void> {
  const unread = await db
    .select({ id: adminInboxItems.id })
    .from(adminInboxItems)
    .leftJoin(
      adminInboxReads,
      and(
        eq(adminInboxReads.itemId, adminInboxItems.id),
        eq(adminInboxReads.userId, userId),
      ),
    )
    .where(isNull(adminInboxReads.readAt));

  const ids = unread.map((u) => u.id);
  if (ids.length === 0) return;

  await db
    .insert(adminInboxReads)
    .values(
      ids.map((itemId) => ({
        userId,
        itemId,
        readAt: new Date(),
      })),
    )
    .onConflictDoNothing({
      target: [adminInboxReads.userId, adminInboxReads.itemId],
    });
}
