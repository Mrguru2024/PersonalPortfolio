import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { db } from "@server/db";
import {
  behaviorSessions,
  behaviorEvents,
  behaviorReplaySegments,
  behaviorHeatmapEvents,
  behaviorFrictionReports,
  behaviorSurveys,
} from "@shared/schema";
import { count, desc, gte } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [sessionCount] = await db
    .select({ c: count() })
    .from(behaviorSessions)
    .where(gte(behaviorSessions.startTime, since));

  const [eventCount] = await db
    .select({ c: count() })
    .from(behaviorEvents)
    .where(gte(behaviorEvents.timestamp, since));

  const [replayCount] = await db
    .select({ c: count() })
    .from(behaviorReplaySegments)
    .where(gte(behaviorReplaySegments.createdAt, since));

  const [heatmapCount] = await db
    .select({ c: count() })
    .from(behaviorHeatmapEvents)
    .where(gte(behaviorHeatmapEvents.createdAt, since));

  const latestFriction = await db
    .select()
    .from(behaviorFrictionReports)
    .orderBy(desc(behaviorFrictionReports.createdAt))
    .limit(5);

  const [surveyCount] = await db.select({ c: count() }).from(behaviorSurveys);

  return NextResponse.json({
    since: since.toISOString(),
    sessions7d: Number(sessionCount?.c ?? 0),
    events7d: Number(eventCount?.c ?? 0),
    replaySegments7d: Number(replayCount?.c ?? 0),
    heatmapPoints7d: Number(heatmapCount?.c ?? 0),
    surveysTotal: Number(surveyCount?.c ?? 0),
    latestFriction,
    note: "Tied to visitor_activity + CRM via optional ingest bridge (visitorId) and crmContactId on sessions.",
  });
}
