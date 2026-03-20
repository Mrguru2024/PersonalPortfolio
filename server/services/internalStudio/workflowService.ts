import { db } from "@server/db";
import { internalPublishLogs, internalPlatformAdapters } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

const DEFAULT_ADAPTERS = [
  { key: "manual", displayName: "Manual publish (log only)", config: {} },
  { key: "blog", displayName: "Ascendra blog (future)", config: { route: "/api/admin/blog" } },
  { key: "newsletter", displayName: "Newsletter send (future)", config: { route: "/api/admin/newsletters" } },
  { key: "social_placeholder", displayName: "Social API (placeholder)", config: {} },
] as const;

export async function ensureDefaultPlatformAdapters() {
  const existing = await db.select({ id: internalPlatformAdapters.id }).from(internalPlatformAdapters).limit(1);
  if (existing.length > 0) return;
  await db.insert(internalPlatformAdapters).values(
    DEFAULT_ADAPTERS.map((a) => ({
      key: a.key,
      displayName: a.displayName,
      config: { ...a.config },
      active: true,
    })),
  );
}

export async function listPlatformAdapters() {
  await ensureDefaultPlatformAdapters();
  return db.select().from(internalPlatformAdapters).orderBy(asc(internalPlatformAdapters.displayName));
}

export async function appendPublishLog(data: typeof internalPublishLogs.$inferInsert) {
  const [row] = await db.insert(internalPublishLogs).values(data).returning();
  return row;
}

export async function listPublishLogs(filters: { documentId?: number; limit?: number }) {
  const lim = Math.min(filters.limit ?? 50, 200);
  if (filters.documentId != null) {
    return db
      .select()
      .from(internalPublishLogs)
      .where(eq(internalPublishLogs.documentId, filters.documentId))
      .orderBy(desc(internalPublishLogs.createdAt))
      .limit(lim);
  }
  return db
    .select()
    .from(internalPublishLogs)
    .orderBy(desc(internalPublishLogs.createdAt))
    .limit(lim);
}

/**
 * Manual publish scaffold: logs intent only. Wire real adapters later.
 */
export async function manualPublishDocument(input: {
  documentId: number;
  calendarEntryId?: number | null;
  platform: string;
  userId: number | null;
}) {
  await appendPublishLog({
    documentId: input.documentId,
    calendarEntryId: input.calendarEntryId ?? null,
    platform: input.platform,
    status: "success",
    requestPayload: { triggeredBy: input.userId, mode: "manual_scaffold" },
    responsePayload: { ok: true, message: "Logged only — no external publish in phase 2 scaffold." },
    errorMessage: null,
  });
  return { ok: true as const };
}
