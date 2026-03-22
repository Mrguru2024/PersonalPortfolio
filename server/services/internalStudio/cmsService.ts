import { db } from "@server/db";
import {
  internalCmsDocuments,
  internalContentCampaigns,
  internalContentTemplates,
  internalContentEditHistory,
} from "@shared/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";

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

export async function listDocuments(filters: {
  projectKey?: string;
  contentType?: string;
  workflowStatus?: string;
  campaignId?: number;
  search?: string;
  limit?: number;
}) {
  const lim = Math.min(filters.limit ?? 60, 200);
  const conditions = [];
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
    );
    if (searchCond) conditions.push(searchCond);
  }

  const base = db.select().from(internalCmsDocuments).orderBy(desc(internalCmsDocuments.updatedAt)).limit(lim);
  if (conditions.length === 0) return base;
  return db
    .select()
    .from(internalCmsDocuments)
    .where(and(...conditions))
    .orderBy(desc(internalCmsDocuments.updatedAt))
    .limit(lim);
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
