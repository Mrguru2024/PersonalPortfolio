import { db } from "@server/db";
import { internalEditorialCalendarEntries, internalCmsDocuments } from "@shared/schema";
import { eq, and, gte, lte, asc, ne } from "drizzle-orm";

export function computeEntryWarnings(entry: {
  title: string;
  ctaObjective: string | null;
  personaTags: string[] | null;
  platformTargets: string[] | null;
  scheduledAt: Date;
}): string[] {
  const w: string[] = [];
  if (!entry.ctaObjective?.trim()) w.push("missing_cta");
  if (!entry.personaTags?.length) w.push("missing_persona");
  if (entry.title.trim().length < 8) w.push("weak_headline");
  return w;
}

export async function findSchedulingConflicts(
  scheduledAt: Date,
  excludeId: number | null,
  platformTargets: string[],
): Promise<string[]> {
  const start = new Date(scheduledAt.getTime() - 2 * 60 * 1000);
  const end = new Date(scheduledAt.getTime() + 2 * 60 * 1000);
  const timeWindow = and(
    gte(internalEditorialCalendarEntries.scheduledAt, start),
    lte(internalEditorialCalendarEntries.scheduledAt, end),
  );
  const rows = await db
    .select()
    .from(internalEditorialCalendarEntries)
    .where(
      excludeId != null
        ? and(timeWindow, ne(internalEditorialCalendarEntries.id, excludeId))
        : timeWindow,
    );

  const warnings: string[] = [];
  for (const r of rows) {
    const shared = (r.platformTargets as string[]).some((p) => platformTargets.includes(p));
    if (shared) warnings.push(`scheduling_conflict:${r.id}`);
  }
  return warnings;
}

export async function listCalendarEntries(filters: {
  projectKey?: string;
  from?: Date;
  to?: Date;
  campaignId?: number;
}) {
  const conditions = [];
  if (filters.projectKey)
    conditions.push(eq(internalEditorialCalendarEntries.projectKey, filters.projectKey));
  if (filters.from) conditions.push(gte(internalEditorialCalendarEntries.scheduledAt, filters.from));
  if (filters.to) conditions.push(lte(internalEditorialCalendarEntries.scheduledAt, filters.to));
  if (filters.campaignId != null)
    conditions.push(eq(internalEditorialCalendarEntries.campaignId, filters.campaignId));

  const base = db
    .select()
    .from(internalEditorialCalendarEntries)
    .orderBy(asc(internalEditorialCalendarEntries.scheduledAt), asc(internalEditorialCalendarEntries.sortOrder));

  if (conditions.length === 0) return base;
  return db
    .select()
    .from(internalEditorialCalendarEntries)
    .where(and(...conditions))
    .orderBy(asc(internalEditorialCalendarEntries.scheduledAt), asc(internalEditorialCalendarEntries.sortOrder));
}

export async function getCalendarEntry(id: number) {
  const [row] = await db
    .select()
    .from(internalEditorialCalendarEntries)
    .where(eq(internalEditorialCalendarEntries.id, id))
    .limit(1);
  return row ?? null;
}

export async function createCalendarEntry(data: typeof internalEditorialCalendarEntries.$inferInsert) {
  const warnings = computeEntryWarnings({
    title: data.title,
    ctaObjective: data.ctaObjective ?? null,
    personaTags: (data.personaTags as string[]) ?? [],
    platformTargets: (data.platformTargets as string[]) ?? [],
    scheduledAt: data.scheduledAt instanceof Date ? data.scheduledAt : new Date(String(data.scheduledAt)),
  });
  const conflict = await findSchedulingConflicts(
    data.scheduledAt instanceof Date ? data.scheduledAt : new Date(String(data.scheduledAt)),
    null,
    (data.platformTargets as string[]) ?? [],
  );
  const [row] = await db
    .insert(internalEditorialCalendarEntries)
    .values({
      ...data,
      warningsJson: [...warnings, ...conflict],
    })
    .returning();
  return row;
}

export async function updateCalendarEntry(
  id: number,
  patch: Partial<typeof internalEditorialCalendarEntries.$inferInsert>,
) {
  const merged = { ...patch } as typeof patch;
  if (patch.scheduledAt || patch.title || patch.ctaObjective || patch.personaTags || patch.platformTargets) {
    const current = await getCalendarEntry(id);
    if (current) {
      const title = (patch.title ?? current.title) as string;
      const cta = (patch.ctaObjective ?? current.ctaObjective) as string | null;
      const personas = (patch.personaTags ?? current.personaTags) as string[];
      const platforms = (patch.platformTargets ?? current.platformTargets) as string[];
      const at =
        patch.scheduledAt != null
          ? patch.scheduledAt instanceof Date
            ? patch.scheduledAt
            : new Date(String(patch.scheduledAt))
          : new Date(current.scheduledAt!);
      const warnings = computeEntryWarnings({
        title,
        ctaObjective: cta,
        personaTags: personas,
        platformTargets: platforms,
        scheduledAt: at,
      });
      const conflict = await findSchedulingConflicts(at, id, platforms ?? []);
      merged.warningsJson = [...warnings, ...conflict];
    }
  }

  const [row] = await db
    .update(internalEditorialCalendarEntries)
    .set({ ...merged, updatedAt: new Date() })
    .where(eq(internalEditorialCalendarEntries.id, id))
    .returning();
  return row ?? null;
}

export async function duplicateCalendarEntry(id: number) {
  const cur = await getCalendarEntry(id);
  if (!cur) return null;
  const nextTime = new Date(new Date(cur.scheduledAt!).getTime() + 24 * 60 * 60 * 1000);
  return createCalendarEntry({
    documentId: cur.documentId,
    title: `${cur.title} (copy)`,
    scheduledAt: nextTime,
    endAt: cur.endAt,
    timezone: cur.timezone,
    calendarStatus: "draft",
    platformTargets: cur.platformTargets ?? [],
    personaTags: cur.personaTags ?? [],
    ctaObjective: cur.ctaObjective,
    funnelStage: cur.funnelStage,
    campaignId: cur.campaignId,
    projectKey: cur.projectKey,
    sortOrder: 0,
  });
}

export async function reorderCalendarEntries(orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(internalEditorialCalendarEntries)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(internalEditorialCalendarEntries.id, orderedIds[i]));
  }
}

/** Transition document workflow when calendar entry moves to published. */
export async function syncDocumentWorkflowFromCalendar(documentId: number, calendarStatus: string) {
  if (!documentId) return;
  if (calendarStatus === "published") {
    await db
      .update(internalCmsDocuments)
      .set({
        workflowStatus: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(internalCmsDocuments.id, documentId));
  }
  if (calendarStatus === "scheduled") {
    await db
      .update(internalCmsDocuments)
      .set({ workflowStatus: "scheduled", updatedAt: new Date() })
      .where(eq(internalCmsDocuments.id, documentId));
  }
}
