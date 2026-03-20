import { db } from "@server/db";
import {
  gosLeadContentAttributions,
  crmContacts,
  internalCmsDocuments,
  blogPosts,
  internalEditorialCalendarEntries,
} from "@shared/schema";
import { eq, desc, sql, and, isNotNull } from "drizzle-orm";

export async function createAttribution(input: {
  projectKey: string;
  contactId: number;
  dealId?: number | null;
  documentId?: number | null;
  blogPostId?: number | null;
  calendarEntryId?: number | null;
  channel?: string;
  attributionLabel?: string | null;
  metadataJson?: Record<string, unknown>;
  createdByUserId?: number | null;
}) {
  const [row] = await db
    .insert(gosLeadContentAttributions)
    .values({
      projectKey: input.projectKey,
      contactId: input.contactId,
      dealId: input.dealId ?? null,
      documentId: input.documentId ?? null,
      blogPostId: input.blogPostId ?? null,
      calendarEntryId: input.calendarEntryId ?? null,
      channel: input.channel ?? "manual",
      attributionLabel: input.attributionLabel ?? null,
      metadataJson: input.metadataJson ?? {},
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();
  return row ?? null;
}

export async function listAttributions(filters: { projectKey?: string; contactId?: number; limit?: number }) {
  const lim = Math.min(filters.limit ?? 80, 200);
  const cond = [];
  if (filters.projectKey) cond.push(eq(gosLeadContentAttributions.projectKey, filters.projectKey));
  if (filters.contactId != null) cond.push(eq(gosLeadContentAttributions.contactId, filters.contactId));
  const q = db
    .select()
    .from(gosLeadContentAttributions)
    .orderBy(desc(gosLeadContentAttributions.createdAt))
    .limit(lim);
  if (cond.length === 0) return q;
  return db
    .select()
    .from(gosLeadContentAttributions)
    .where(and(...cond))
    .orderBy(desc(gosLeadContentAttributions.createdAt))
    .limit(lim);
}

/** Aggregated lead counts per internal document (explicit attributions). */
export async function leadsByInternalDocument(projectKey: string) {
  return db
    .select({
      documentId: gosLeadContentAttributions.documentId,
      title: internalCmsDocuments.title,
      n: sql<number>`count(*)::int`,
    })
    .from(gosLeadContentAttributions)
    .innerJoin(
      internalCmsDocuments,
      eq(gosLeadContentAttributions.documentId, internalCmsDocuments.id),
    )
    .where(
      and(eq(gosLeadContentAttributions.projectKey, projectKey), isNotNull(gosLeadContentAttributions.documentId)),
    )
    .groupBy(gosLeadContentAttributions.documentId, internalCmsDocuments.title);
}

/** Aggregated lead counts per blog post (explicit attributions). */
export async function leadsByBlogPost(projectKey: string) {
  return db
    .select({
      blogPostId: gosLeadContentAttributions.blogPostId,
      title: blogPosts.title,
      slug: blogPosts.slug,
      n: sql<number>`count(*)::int`,
    })
    .from(gosLeadContentAttributions)
    .innerJoin(blogPosts, eq(gosLeadContentAttributions.blogPostId, blogPosts.id))
    .where(
      and(
        eq(gosLeadContentAttributions.projectKey, projectKey),
        sql`${gosLeadContentAttributions.blogPostId} is not null`,
      ),
    )
    .groupBy(gosLeadContentAttributions.blogPostId, blogPosts.title, blogPosts.slug);
}

/** Aggregated lead counts per calendar entry. */
export async function leadsByCalendarEntry(projectKey: string) {
  return db
    .select({
      calendarEntryId: gosLeadContentAttributions.calendarEntryId,
      title: internalEditorialCalendarEntries.title,
      n: sql<number>`count(*)::int`,
    })
    .from(gosLeadContentAttributions)
    .innerJoin(
      internalEditorialCalendarEntries,
      eq(gosLeadContentAttributions.calendarEntryId, internalEditorialCalendarEntries.id),
    )
    .where(
      and(
        eq(gosLeadContentAttributions.projectKey, projectKey),
        isNotNull(gosLeadContentAttributions.calendarEntryId),
      ),
    )
    .groupBy(gosLeadContentAttributions.calendarEntryId, internalEditorialCalendarEntries.title);
}

/**
 * Inferred signal from CRM UTM (no gos_lead_content_attributions rows).
 */
export async function inferredLeadsByUtmCampaign() {
  return db
    .select({
      utmCampaign: sql<string>`coalesce(${crmContacts.utmCampaign}, '(none)')`,
      n: sql<number>`count(*)::int`,
    })
    .from(crmContacts)
    .groupBy(sql`coalesce(${crmContacts.utmCampaign}, '(none)')`);
}
