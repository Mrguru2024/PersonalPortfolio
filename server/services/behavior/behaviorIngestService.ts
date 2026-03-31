import { visitorAliasFromSessionId, visitorSubtitleFromDevice } from "@/lib/behaviorVisitorAlias";
import { db } from "@server/db";
import {
  behaviorSessions,
  behaviorEvents,
  behaviorReplaySegments,
  behaviorHeatmapEvents,
  behaviorSurveyResponses,
} from "@shared/schema";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, like, lte, sql } from "drizzle-orm";

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

const VISITOR_ONLINE_MS = 3 * 60 * 1000;

export type BehaviorVisitorHubRow = {
  id: number;
  sessionId: string;
  startTime: string /** ISO */;
  endTime: string | null;
  device: string | null;
  converted: boolean;
  pageViews: number;
  clickEvents: number;
  durationLabel: string;
  hasReplay: boolean;
  hasHeatmap: boolean;
  samplePage: string | null;
  isOnline: boolean;
  alias: string;
  locationLabel: string;
  retentionImportant: boolean;
  retentionArchived: boolean;
};

export type BehaviorVisitorHubResponse = {
  since: string;
  until: string | null;
  summary: {
    visitsToday: number;
    onlineNow: number;
    totalInRange: number;
  };
  sessions: BehaviorVisitorHubRow[];
};

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function formatDurationMs(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

/** Visitor hub list: aggregates heatmap/replay, online heuristic, friendly alias. */
export async function listBehaviorSessionsVisitorHub(input: {
  since: Date;
  until?: Date | null;
  search?: string | null;
  onlineOnly?: boolean;
  limit: number;
  offset: number;
}): Promise<BehaviorVisitorHubResponse> {
  const since = input.since;
  const until = input.until ?? null;
  const q = input.search?.trim().replace(/[%_\\]/g, "") ?? "";
  const onlineCutoff = new Date(Date.now() - VISITOR_ONLINE_MS);
  const todayStart = startOfUtcDay(new Date());

  const conditions = [
    eq(behaviorSessions.optOut, false),
    isNull(behaviorSessions.softDeletedAt),
    gte(behaviorSessions.startTime, since),
  ];
  if (until) conditions.push(lte(behaviorSessions.startTime, until));
  if (q.length > 0) conditions.push(like(behaviorSessions.sessionId, `%${q}%`));
  if (input.onlineOnly) {
    conditions.push(isNotNull(behaviorSessions.endTime));
    conditions.push(gte(behaviorSessions.endTime, onlineCutoff));
  }

  const [visitTodayRow] = await db
    .select({ c: count() })
    .from(behaviorSessions)
    .where(
      and(eq(behaviorSessions.optOut, false), gte(behaviorSessions.startTime, todayStart)),
    );

  const [onlineRow] = await db
    .select({ c: count() })
    .from(behaviorSessions)
    .where(
      and(
        eq(behaviorSessions.optOut, false),
        isNull(behaviorSessions.softDeletedAt),
        isNotNull(behaviorSessions.endTime),
        gte(behaviorSessions.endTime, onlineCutoff),
      ),
    );

  const [totalRow] = await db.select({ c: count() }).from(behaviorSessions).where(and(...conditions));

  const rows = await db
    .select()
    .from(behaviorSessions)
    .where(and(...conditions))
    .orderBy(desc(behaviorSessions.startTime))
    .limit(Math.min(100, Math.max(1, input.limit)))
    .offset(Math.max(0, input.offset));

  if (rows.length === 0) {
    return {
      since: since.toISOString(),
      until: until?.toISOString() ?? null,
      summary: {
        visitsToday: Number(visitTodayRow?.c ?? 0),
        onlineNow: Number(onlineRow?.c ?? 0),
        totalInRange: Number(totalRow?.c ?? 0),
      },
      sessions: [],
    };
  }

  const ids = rows.map((r) => r.sessionId);

  const heatPageCounts = await db
    .select({
      sessionId: behaviorHeatmapEvents.sessionId,
      c: sql<number>`count(distinct ${behaviorHeatmapEvents.page})::int`,
    })
    .from(behaviorHeatmapEvents)
    .where(
      and(
        inArray(behaviorHeatmapEvents.sessionId, ids),
        gte(behaviorHeatmapEvents.createdAt, since),
        ...(until ? [lte(behaviorHeatmapEvents.createdAt, until)] : []),
      ),
    )
    .groupBy(behaviorHeatmapEvents.sessionId);

  const heatClickCounts = await db
    .select({
      sessionId: behaviorHeatmapEvents.sessionId,
      c: count(),
    })
    .from(behaviorHeatmapEvents)
    .where(
      and(
        inArray(behaviorHeatmapEvents.sessionId, ids),
        gte(behaviorHeatmapEvents.createdAt, since),
        ...(until ? [lte(behaviorHeatmapEvents.createdAt, until)] : []),
      ),
    )
    .groupBy(behaviorHeatmapEvents.sessionId);

  const samplePages = await db
    .select({
      sessionId: behaviorHeatmapEvents.sessionId,
      page: sql<string>`(array_agg(${behaviorHeatmapEvents.page} order by ${behaviorHeatmapEvents.createdAt} desc))[1]`,
    })
    .from(behaviorHeatmapEvents)
    .where(inArray(behaviorHeatmapEvents.sessionId, ids))
    .groupBy(behaviorHeatmapEvents.sessionId);

  const replayDistinct = await db
    .selectDistinct({ sessionId: behaviorReplaySegments.sessionId })
    .from(behaviorReplaySegments)
    .where(inArray(behaviorReplaySegments.sessionId, ids));

  const pageMap = new Map(heatPageCounts.map((r) => [r.sessionId, Number(r.c)]));
  const clickMap = new Map(heatClickCounts.map((r) => [r.sessionId, Number(r.c)]));
  const sampleMap = new Map(samplePages.map((r) => [r.sessionId, r.page]));
  const replaySet = new Set(replayDistinct.map((r) => r.sessionId));

  const sessions: BehaviorVisitorHubRow[] = rows.map((r) => {
    const end = r.endTime;
    const durMs = end ? end.getTime() - r.startTime.getTime() : 0;
    const isOnline = !!(end && end >= onlineCutoff);
    return {
      id: r.id,
      sessionId: r.sessionId,
      startTime: r.startTime.toISOString(),
      endTime: end?.toISOString() ?? null,
      device: r.device,
      converted: r.converted,
      pageViews: pageMap.get(r.sessionId) ?? 0,
      clickEvents: clickMap.get(r.sessionId) ?? 0,
      durationLabel: formatDurationMs(durMs),
      hasReplay: replaySet.has(r.sessionId),
      hasHeatmap: (clickMap.get(r.sessionId) ?? 0) > 0 || (pageMap.get(r.sessionId) ?? 0) > 0,
      samplePage: sampleMap.get(r.sessionId) ?? null,
      isOnline,
      alias: visitorAliasFromSessionId(r.sessionId),
      locationLabel: visitorSubtitleFromDevice(r.device),
      retentionImportant: r.retentionImportant,
      retentionArchived: r.retentionArchived,
    };
  });

  return {
    since: since.toISOString(),
    until: until?.toISOString() ?? null,
    summary: {
      visitsToday: Number(visitTodayRow?.c ?? 0),
      onlineNow: Number(onlineRow?.c ?? 0),
      totalInRange: Number(totalRow?.c ?? 0),
    },
    sessions,
  };
}

export type BehaviorReplayPlaybackMeta = {
  maxSeq: number;
  segmentCount: number;
  sessionEndTime: string | null;
  recordingActive: boolean;
  unavailableReason?: "soft_deleted" | "not_found";
};

export async function getReplayPayloadForSession(sessionId: string): Promise<{
  events: unknown[];
  playback: BehaviorReplayPlaybackMeta;
}> {
  const sid = sessionId.slice(0, 128);
  const [sess] = await db.select().from(behaviorSessions).where(eq(behaviorSessions.sessionId, sid)).limit(1);
  if (!sess) {
    return {
      events: [],
      playback: {
        maxSeq: 0,
        segmentCount: 0,
        sessionEndTime: null,
        recordingActive: false,
        unavailableReason: "not_found",
      },
    };
  }
  if (sess.softDeletedAt) {
    return {
      events: [],
      playback: {
        maxSeq: 0,
        segmentCount: 0,
        sessionEndTime: sess.endTime?.toISOString() ?? null,
        recordingActive: false,
        unavailableReason: "soft_deleted",
      },
    };
  }
  const rows = await db
    .select()
    .from(behaviorReplaySegments)
    .where(eq(behaviorReplaySegments.sessionId, sid))
    .orderBy(behaviorReplaySegments.seq);
  const out: unknown[] = [];
  let maxSeq = -1;
  for (const r of rows) {
    if (Array.isArray(r.payloadJson)) out.push(...r.payloadJson);
    if (r.seq > maxSeq) maxSeq = r.seq;
  }
  const end = sess.endTime;
  const onlineCutoff = new Date(Date.now() - VISITOR_ONLINE_MS);
  const recordingActive = !!(end && end >= onlineCutoff);
  return {
    events: out,
    playback: {
      maxSeq: Math.max(0, maxSeq),
      segmentCount: rows.length,
      sessionEndTime: end?.toISOString() ?? null,
      recordingActive,
    },
  };
}

export async function getReplayEventsForSession(sessionId: string): Promise<unknown[]> {
  const { events } = await getReplayPayloadForSession(sessionId);
  return events;
}

export async function updateBehaviorSessionRetention(
  sessionId: string,
  input: { retentionImportant?: boolean; retentionArchived?: boolean },
): Promise<boolean> {
  const sid = sessionId.slice(0, 128);
  const patch: Partial<{
    retentionImportant: boolean;
    retentionArchived: boolean;
  }> = {};
  if (typeof input.retentionImportant === "boolean") patch.retentionImportant = input.retentionImportant;
  if (typeof input.retentionArchived === "boolean") patch.retentionArchived = input.retentionArchived;
  if (Object.keys(patch).length === 0) return false;
  const rows = await db
    .update(behaviorSessions)
    .set(patch)
    .where(eq(behaviorSessions.sessionId, sid))
    .returning({ id: behaviorSessions.id });
  return rows.length > 0;
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
