import { db } from "@server/db";
import { legalClauseLibrary } from "@shared/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

export async function listLegalClausesForAdmin() {
  return db.select().from(legalClauseLibrary).orderBy(asc(legalClauseLibrary.category), asc(legalClauseLibrary.sortOrder));
}

export async function listActiveClausesOrderedBySlugs(slugs: string[]) {
  const normalized = slugs.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!normalized.length) return [];
  const rows = await db
    .select()
    .from(legalClauseLibrary)
    .where(and(eq(legalClauseLibrary.isActive, true), inArray(legalClauseLibrary.slug, normalized)));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return normalized.map((s) => bySlug.get(s)).filter(Boolean) as typeof rows;
}

export async function upsertLegalClause(input: {
  slug: string;
  category: string;
  title: string;
  bodyHtml: string;
  sortOrder?: number;
  isActive?: boolean;
  lawyerReviewedAt?: Date | null;
  lawyerReviewerName?: string | null;
  lawyerFirmName?: string | null;
  reviewNotes?: string | null;
}) {
  const slug = input.slug.trim().toLowerCase();
  const existing = await db.select().from(legalClauseLibrary).where(eq(legalClauseLibrary.slug, slug)).limit(1);
  if (existing[0]) {
    const [row] = await db
      .update(legalClauseLibrary)
      .set({
        category: input.category.trim(),
        title: input.title.trim(),
        bodyHtml: input.bodyHtml,
        sortOrder: input.sortOrder ?? existing[0].sortOrder,
        isActive: input.isActive ?? existing[0].isActive,
        lawyerReviewedAt: input.lawyerReviewedAt ?? existing[0].lawyerReviewedAt,
        lawyerReviewerName: input.lawyerReviewerName ?? existing[0].lawyerReviewerName,
        lawyerFirmName: input.lawyerFirmName ?? existing[0].lawyerFirmName,
        reviewNotes: input.reviewNotes ?? existing[0].reviewNotes,
        updatedAt: new Date(),
      })
      .where(eq(legalClauseLibrary.id, existing[0].id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(legalClauseLibrary)
    .values({
      slug,
      category: input.category.trim(),
      title: input.title.trim(),
      bodyHtml: input.bodyHtml,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive !== false,
      lawyerReviewedAt: input.lawyerReviewedAt ?? null,
      lawyerReviewerName: input.lawyerReviewerName ?? null,
      lawyerFirmName: input.lawyerFirmName ?? null,
      reviewNotes: input.reviewNotes ?? null,
    })
    .returning();
  return row;
}

export const DEFAULT_AGREEMENT_CLAUSE_SLUGS = [
  "no-guarantee",
  "client-cooperation",
  "ad-spend-platforms",
  "third-party-risk",
  "payment-terms",
  "scope-revisions-termination",
] as const;
