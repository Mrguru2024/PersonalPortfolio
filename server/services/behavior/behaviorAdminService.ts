import { db } from "@server/db";
import {
  behaviorHeatmapEvents,
  behaviorSurveyResponses,
  behaviorSurveys,
  behaviorUserTestCampaigns,
  behaviorUserTestObservations,
} from "@shared/schema";
import { and, count, desc, eq, gte } from "drizzle-orm";

export async function listHeatmapPagesSummary(
  since: Date,
  limit: number,
): Promise<{ page: string; count: number }[]> {
  const rows = await db
    .select({
      page: behaviorHeatmapEvents.page,
      c: count(),
    })
    .from(behaviorHeatmapEvents)
    .where(gte(behaviorHeatmapEvents.createdAt, since))
    .groupBy(behaviorHeatmapEvents.page)
    .limit(Math.min(500, limit));

  return rows
    .map((r) => ({ page: r.page, count: Number(r.c) }))
    .sort((a, b) => b.count - a.count);
}

export async function listHeatmapPointsForPage(
  page: string,
  since: Date,
  maxPoints: number,
): Promise<(typeof behaviorHeatmapEvents.$inferSelect)[]> {
  return db
    .select()
    .from(behaviorHeatmapEvents)
    .where(and(eq(behaviorHeatmapEvents.page, page), gte(behaviorHeatmapEvents.createdAt, since)))
    .orderBy(desc(behaviorHeatmapEvents.createdAt))
    .limit(Math.min(20_000, maxPoints));
}

const SURVEY_TRIGGERS = new Set(["exit_intent", "time_based", "scroll_based", "form_abandon"]);

export function normalizeSurveyTrigger(raw: string): string {
  const t = raw?.trim() || "time_based";
  return SURVEY_TRIGGERS.has(t) ? t : "time_based";
}

export async function listSurveysForAdmin() {
  return db.select().from(behaviorSurveys).orderBy(desc(behaviorSurveys.createdAt));
}

export async function createSurvey(input: {
  question: string;
  triggerType: string;
  businessId?: string | null;
  active?: boolean;
}) {
  const [row] = await db
    .insert(behaviorSurveys)
    .values({
      question: input.question.slice(0, 4000),
      triggerType: normalizeSurveyTrigger(input.triggerType),
      businessId: input.businessId?.trim() || null,
      active: input.active !== false,
    })
    .returning();
  return row;
}

export async function listSurveyResponses(surveyId: number, limit: number) {
  return db
    .select()
    .from(behaviorSurveyResponses)
    .where(eq(behaviorSurveyResponses.surveyId, surveyId))
    .orderBy(desc(behaviorSurveyResponses.createdAt))
    .limit(Math.min(500, limit));
}

export async function listUserTestCampaigns() {
  return db.select().from(behaviorUserTestCampaigns).orderBy(desc(behaviorUserTestCampaigns.createdAt));
}

export async function createUserTestCampaign(input: {
  name: string;
  hypothesis?: string | null;
  businessId?: string | null;
  active?: boolean;
}) {
  const [row] = await db
    .insert(behaviorUserTestCampaigns)
    .values({
      name: input.name.slice(0, 500),
      hypothesis: input.hypothesis?.slice(0, 8000) ?? null,
      businessId: input.businessId?.trim() || null,
      active: input.active !== false,
    })
    .returning();
  return row;
}

export async function listObservationsForCampaign(campaignId: number, limit: number) {
  return db
    .select()
    .from(behaviorUserTestObservations)
    .where(eq(behaviorUserTestObservations.campaignId, campaignId))
    .orderBy(desc(behaviorUserTestObservations.createdAt))
    .limit(Math.min(200, limit));
}

export async function createUserTestObservation(input: {
  campaignId: number;
  sessionId?: string | null;
  notes: string;
  crmContactId?: number | null;
}) {
  const [row] = await db
    .insert(behaviorUserTestObservations)
    .values({
      campaignId: input.campaignId,
      sessionId: input.sessionId?.trim() || null,
      notes: input.notes.slice(0, 16_000),
      crmContactId: input.crmContactId ?? null,
    })
    .returning();
  return row;
}
