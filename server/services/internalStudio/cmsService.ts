import { db } from "@server/db";
import {
  internalCmsDocuments,
  internalContentCampaigns,
  internalContentTemplates,
  internalContentEditHistory,
} from "@shared/schema";
import { eq, and, desc, ilike, or, count, type SQL } from "drizzle-orm";

export async function listCampaigns(projectKey?: string) {
  if (projectKey) {
    return db
      .select()
      .from(internalContentCampaigns)
      .where(eq(internalContentCampaigns.projectKey, projectKey))
      .orderBy(desc(internalContentCampaigns.updatedAt));
  }
  return db.select().from(internalContentCampaigns).orderBy(desc(internalContentCampaigns.updatedAt));
}

export async function createCampaign(data: {
  name: string;
  /** Omitted or undefined → SQL NULL (API: `description: d.description ?? undefined`). */
  description?: string;
  goal?: string;
  projectKey?: string;
}) {
  const [row] = await db
    .insert(internalContentCampaigns)
    .values({
      name: data.name,
      description: data.description ?? null,
      goal: data.goal ?? null,
      projectKey: data.projectKey ?? "ascendra_main",
    })
    .returning();
  return row;
}

export async function listTemplates() {
  return db.select().from(internalContentTemplates).orderBy(internalContentTemplates.name);
}

/** Filters shared by {@link listDocuments} and {@link countDocuments} (no pagination). */
export type ListInternalDocumentsFilters = {
  projectKey?: string;
  contentType?: string;
  workflowStatus?: string;
  campaignId?: number;
  /** Case-insensitive match on title, excerpt, content type, workflow status, or visibility. */
  search?: string;
};

function buildInternalDocumentsWhere(filters: ListInternalDocumentsFilters): SQL | undefined {
  const conditions: SQL[] = [];
  if (filters.projectKey) conditions.push(eq(internalCmsDocuments.projectKey, filters.projectKey));
  if (filters.contentType) conditions.push(eq(internalCmsDocuments.contentType, filters.contentType));
  if (filters.workflowStatus)
    conditions.push(eq(internalCmsDocuments.workflowStatus, filters.workflowStatus));
  if (filters.campaignId != null)
    conditions.push(eq(internalCmsDocuments.campaignId, filters.campaignId));
  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    const searchCond = or(
      ilike(internalCmsDocuments.title, q),
      ilike(internalCmsDocuments.excerpt, q),
      ilike(internalCmsDocuments.contentType, q),
      ilike(internalCmsDocuments.workflowStatus, q),
      ilike(internalCmsDocuments.visibility, q),
    );
    if (searchCond) conditions.push(searchCond);
  }
  if (conditions.length === 0) return undefined;
  return and(...conditions);
}

export async function countDocuments(filters: ListInternalDocumentsFilters): Promise<number> {
  const whereClause = buildInternalDocumentsWhere(filters);
  if (whereClause) {
    const rows = await db
      .select({ total: count() })
      .from(internalCmsDocuments)
      .where(whereClause);
    return Number(rows[0]?.total ?? 0);
  }
  const rows = await db.select({ total: count() }).from(internalCmsDocuments);
  return Number(rows[0]?.total ?? 0);
}

export async function listDocuments(
  filters: ListInternalDocumentsFilters & { limit?: number; offset?: number },
) {
  const lim = Math.min(Math.max(filters.limit ?? 25, 1), 100);
  const off = Math.max(filters.offset ?? 0, 0);
  const whereClause = buildInternalDocumentsWhere(filters);
  if (whereClause) {
    return db
      .select()
      .from(internalCmsDocuments)
      .where(whereClause)
      .orderBy(desc(internalCmsDocuments.updatedAt))
      .limit(lim)
      .offset(off);
  }
  return db
    .select()
    .from(internalCmsDocuments)
    .orderBy(desc(internalCmsDocuments.updatedAt))
    .limit(lim)
    .offset(off);
}

export async function getDocument(id: number) {
  const [row] = await db.select().from(internalCmsDocuments).where(eq(internalCmsDocuments.id, id)).limit(1);
  return row ?? null;
}

export async function createDocument(data: typeof internalCmsDocuments.$inferInsert) {
  const [row] = await db.insert(internalCmsDocuments).values(data).returning();
  return row;
}

export async function updateDocument(
  id: number,
  patch: Partial<typeof internalCmsDocuments.$inferInsert>,
  editorUserId: number | null,
) {
  const existing = await getDocument(id);
  if (!existing) return null;

  if (editorUserId != null) {
    await db.insert(internalContentEditHistory).values({
      documentId: id,
      editorUserId,
      snapshotJson: existing as unknown as Record<string, unknown>,
      note: "auto snapshot before update",
    });
  }

  const [row] = await db
    .update(internalCmsDocuments)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(internalCmsDocuments.id, id))
    .returning();
  return row;
}

export async function listEditHistory(documentId: number) {
  return db
    .select()
    .from(internalContentEditHistory)
    .where(eq(internalContentEditHistory.documentId, documentId))
    .orderBy(desc(internalContentEditHistory.createdAt))
    .limit(50);
}
