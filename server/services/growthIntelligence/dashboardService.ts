import { db } from "@server/db";
import {
  crmContacts,
  crmDeals,
  crmTasks,
  blogPosts,
  internalCmsDocuments,
  internalEditorialCalendarEntries,
  internalContentCampaigns,
  internalAuditRuns,
  internalAuditRecommendations,
} from "@shared/schema";
import {
  sql,
  eq,
  and,
  gte,
  lte,
  desc,
  lt,
  isNotNull,
  isNull,
  inArray,
  or,
  notInArray,
} from "drizzle-orm";
import { countPendingSuggestionsForProject } from "./contentInsightService";

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d = new Date()) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  return e;
}

export async function getLeadGenerationDashboard(projectKey: string) {
  const bySource = await db
    .select({
      source: sql<string>`coalesce(${crmContacts.source}, 'unknown')`,
      n: sql<number>`count(*)::int`,
    })
    .from(crmContacts)
    .groupBy(sql`coalesce(${crmContacts.source}, 'unknown')`);

  const byCampaign = await db
    .select({
      campaign: sql<string>`coalesce(${crmDeals.campaign}, 'unknown')`,
      n: sql<number>`count(*)::int`,
    })
    .from(crmDeals)
    .groupBy(sql`coalesce(${crmDeals.campaign}, 'unknown')`);

  const byOffer = await db
    .select({
      serviceInterest: sql<string>`coalesce(${crmDeals.serviceInterest}, 'unknown')`,
      n: sql<number>`count(*)::int`,
    })
    .from(crmDeals)
    .groupBy(sql`coalesce(${crmDeals.serviceInterest}, 'unknown')`);

  const tasksTotal = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(crmTasks)
    .then((r) => r[0]?.n ?? 0);
  const tasksDone = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(crmTasks)
    .where(eq(crmTasks.status, "completed"))
    .then((r) => r[0]?.n ?? 0);

  return {
    projectKey,
    leadsBySource: bySource,
    leadsByCampaign: byCampaign,
    leadsByContentItem: [] as { contentItem: string; n: number }[],
    conversionByOffer: byOffer,
    conversionByCta: [] as { cta: string; n: number }[],
    followUpCompletionRate: tasksTotal === 0 ? null : Math.round((tasksDone / tasksTotal) * 1000) / 1000,
  };
}

export async function getContentPerformanceDashboard(projectKey: string) {
  const topPosts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      viewCount: blogPosts.viewCount,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.isPublished, true))
    .orderBy(desc(blogPosts.viewCount))
    .limit(12);

  const hookTypes = await db
    .select({
      contentType: internalCmsDocuments.contentType,
      n: sql<number>`count(*)::int`,
    })
    .from(internalCmsDocuments)
    .where(eq(internalCmsDocuments.projectKey, projectKey))
    .groupBy(internalCmsDocuments.contentType);

  const funnelMix = await db
    .select({
      funnelStage: sql<string>`coalesce(${internalCmsDocuments.funnelStage}, 'unset')`,
      n: sql<number>`count(*)::int`,
    })
    .from(internalCmsDocuments)
    .where(eq(internalCmsDocuments.projectKey, projectKey))
    .groupBy(sql`coalesce(${internalCmsDocuments.funnelStage}, 'unset')`);

  const calRows = await db
    .select({ scheduledAt: internalEditorialCalendarEntries.scheduledAt })
    .from(internalEditorialCalendarEntries)
    .where(eq(internalEditorialCalendarEntries.projectKey, projectKey));
  const hourMap = new Map<number, number>();
  for (const r of calRows) {
    if (!r.scheduledAt) continue;
    const h = new Date(r.scheduledAt).getUTCHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }
  const bestPostingWindows = [...hourMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hour, n]) => ({ hour, n }));

  return {
    projectKey,
    topPosts,
    topHeadlines: [] as { title: string; n: number }[],
    topHookTypes: hookTypes,
    topCtaPatterns: [] as { pattern: string; n: number }[],
    bestPostingWindows,
    personaEngagementTrends: [] as { persona: string; trend: string }[],
    funnelStageContentMix: funnelMix,
  };
}

export async function getOperationalDashboard(projectKey: string) {
  const now = new Date();
  const ws = startOfWeek(now);
  const we = endOfWeek(now);

  const scheduledThisWeek = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(internalEditorialCalendarEntries)
    .where(
      and(
        eq(internalEditorialCalendarEntries.projectKey, projectKey),
        gte(internalEditorialCalendarEntries.scheduledAt, ws),
        lte(internalEditorialCalendarEntries.scheduledAt, we),
        inArray(internalEditorialCalendarEntries.calendarStatus, ["scheduled", "draft"]),
      ),
    )
    .then((r) => r[0]?.n ?? 0);

  const missedSchedules = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(internalEditorialCalendarEntries)
    .where(
      and(
        eq(internalEditorialCalendarEntries.projectKey, projectKey),
        lt(internalEditorialCalendarEntries.scheduledAt, now),
        eq(internalEditorialCalendarEntries.calendarStatus, "scheduled"),
      ),
    )
    .then((r) => r[0]?.n ?? 0);

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - 21);
  const staleDrafts = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(internalCmsDocuments)
    .where(
      and(
        eq(internalCmsDocuments.projectKey, projectKey),
        eq(internalCmsDocuments.workflowStatus, "draft"),
        lt(internalCmsDocuments.updatedAt, staleCutoff),
      ),
    )
    .then((r) => r[0]?.n ?? 0);

  const staleCampaigns = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(internalContentCampaigns)
    .where(
      and(
        eq(internalContentCampaigns.projectKey, projectKey),
        eq(internalContentCampaigns.status, "draft"),
        lt(internalContentCampaigns.updatedAt, staleCutoff),
      ),
    )
    .then((r) => r[0]?.n ?? 0);

  const unreviewedAiSuggestions = await countPendingSuggestionsForProject(projectKey);

  const [latestAudit] = await db
    .select()
    .from(internalAuditRuns)
    .where(and(eq(internalAuditRuns.projectKey, projectKey), eq(internalAuditRuns.status, "completed")))
    .orderBy(desc(internalAuditRuns.completedAt))
    .limit(1);

  let auditOpenRecommendations = 0;
  if (latestAudit) {
    auditOpenRecommendations = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(internalAuditRecommendations)
      .where(eq(internalAuditRecommendations.runId, latestAudit.id))
      .then((r) => r[0]?.n ?? 0);
  }

  const followUpGaps = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(crmContacts)
    .where(
      and(
        isNotNull(crmContacts.nextFollowUpAt),
        lt(crmContacts.nextFollowUpAt, now),
        or(isNull(crmContacts.status), notInArray(crmContacts.status, ["won", "lost"])),
      ),
    )
    .then((r) => r[0]?.n ?? 0);

  return {
    projectKey,
    scheduledPostsThisWeek: scheduledThisWeek,
    missedSchedules,
    staleDrafts,
    staleCampaigns,
    unreviewedAiSuggestions,
    auditIssuesUnresolved: auditOpenRecommendations,
    followUpGaps,
    latestAuditRunId: latestAudit?.id ?? null,
  };
}
