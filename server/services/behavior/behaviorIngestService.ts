import { db } from "@server/db";
import {
  behaviorSessions,
  behaviorEvents,
  behaviorReplaySegments,
  behaviorHeatmapEvents,
  behaviorSurveyResponses,
} from "@shared/schema";
import { and, count, desc, eq, gte, like } from "drizzle-orm";

export type BehaviorIngestInput = {
  sessionId: string;
  userId?: string;
  businessId?: string;
  crmContactId?: number;
  device?: string;
  url?: string;
  utm?: Record<string, unknown>;
  converted?: boolean;
  optOut?: boolean;
  events: Array<{ eventType: string; eventData?: Record<string, unknown>; timestamp?: number }>;
  replaySegments?: Array<{ seq: number; events: unknown[] }>;
  heatmapPoints?: Array<{
    page: string;
    x: number;
    y: number;
    viewportW?: number;
    viewportH?: number;
    eventType: string;
  }>;
  surveyResponses?: Array<{ surveyId: number; response: string }>;
};

export async function ingestBehaviorPayload(input: BehaviorIngestInput): Promise<{ behaviorSessionId: number }> {
  const now = new Date();

  const [existing] = await db
    .select()
    .from(behaviorSessions)
    .where(eq(behaviorSessions.sessionId, input.sessionId))
    .limit(1);

  let behaviorSessionId: number;

  if (existing) {
    behaviorSessionId = existing.id;
    await db
      .update(behaviorSessions)
      .set({
        endTime: now,
        device: input.device ?? existing.device,
        sourceJson: input.utm ?? existing.sourceJson ?? undefined,
        userId: input.userId ?? existing.userId,
        businessId: input.businessId ?? existing.businessId,
        crmContactId: input.crmContactId ?? existing.crmContactId,
        converted: input.converted ?? existing.converted,
        optOut: input.optOut ?? existing.optOut,
      })
      .where(eq(behaviorSessions.id, existing.id));
  } else {
    const [inserted] = await db
      .insert(behaviorSessions)
      .values({
        sessionId: input.sessionId,
        businessId: input.businessId ?? null,
        userId: input.userId ?? null,
        crmContactId: input.crmContactId ?? null,
        startTime: now,
        endTime: now,
        device: input.device ?? null,
        sourceJson: input.utm ?? null,
        converted: input.converted ?? false,
        optOut: input.optOut ?? false,
      })
      .returning({ id: behaviorSessions.id });
    behaviorSessionId = inserted!.id;
  }

  if (input.optOut === true) {
    await db.update(behaviorSessions).set({ optOut: true }).where(eq(behaviorSessions.id, behaviorSessionId));
    return { behaviorSessionId };
  }

  const sid = input.sessionId;

  if (input.events.length > 0) {
    await db.insert(behaviorEvents).values(
      input.events.map((e) => ({
        sessionId: sid,
        behaviorSessionId,
        type: e.eventType.slice(0, 64),
        metadata: {
          ...(e.eventData ?? {}),
          ...(input.url ? { url: input.url } : {}),
        },
        clientTs: typeof e.timestamp === "number" ? Math.floor(e.timestamp) : null,
        timestamp: now,
      })),
    );
  }

  if (input.replaySegments?.length) {
    for (const seg of input.replaySegments) {
      const payload = Array.isArray(seg.events) ? seg.events.slice(0, 5000) : [];
      if (payload.length === 0) continue;
      await db
        .insert(behaviorReplaySegments)
        .values({
          sessionId: sid,
          behaviorSessionId,
          seq: seg.seq,
          payloadJson: payload,
        })
        .onConflictDoUpdate({
          target: [behaviorReplaySegments.sessionId, behaviorReplaySegments.seq],
          set: { payloadJson: payload, createdAt: now },
        });
    }
  }

  if (input.heatmapPoints?.length) {
    await db.insert(behaviorHeatmapEvents).values(
      input.heatmapPoints.map((h) => ({
        sessionId: sid,
        page: h.page.slice(0, 2048),
        x: h.x,
        y: h.y,
        viewportW: h.viewportW ?? null,
        viewportH: h.viewportH ?? null,
        eventType: h.eventType.slice(0, 32),
      })),
    );
  }

  if (input.surveyResponses?.length) {
    for (const r of input.surveyResponses) {
      await db.insert(behaviorSurveyResponses).values({
        surveyId: r.surveyId,
        sessionId: sid,
        response: r.response.slice(0, 4000),
      });
    }
  }

  return { behaviorSessionId };
}

export async function listBehaviorSessionsForAdmin(limit: number): Promise<(typeof behaviorSessions.$inferSelect)[]> {
  return db.select().from(behaviorSessions).orderBy(desc(behaviorSessions.startTime)).limit(Math.min(200, limit));
}

export async function getReplayEventsForSession(sessionId: string): Promise<unknown[]> {
  const rows = await db
    .select()
    .from(behaviorReplaySegments)
    .where(eq(behaviorReplaySegments.sessionId, sessionId))
    .orderBy(behaviorReplaySegments.seq);
  const out: unknown[] = [];
  for (const r of rows) {
    if (Array.isArray(r.payloadJson)) out.push(...r.payloadJson);
  }
  return out;
}

export async function countHeatmapByPage(
  pageLike: string,
  since: Date,
): Promise<{ page: string; count: number }[]> {
  const rows = await db
    .select({
      page: behaviorHeatmapEvents.page,
      c: count(),
    })
    .from(behaviorHeatmapEvents)
    .where(and(gte(behaviorHeatmapEvents.createdAt, since), like(behaviorHeatmapEvents.page, pageLike)))
    .groupBy(behaviorHeatmapEvents.page);

  return rows.map((r) => ({ page: r.page, count: Number(r.c) }));
}
