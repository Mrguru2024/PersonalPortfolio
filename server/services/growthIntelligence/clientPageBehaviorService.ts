/**
 * Single-page behavior summary for client portal (no raw heatmap coordinates).
 */
import { db } from "@server/db";
import {
  behaviorEvents,
  behaviorFrictionReports,
  behaviorHeatmapEvents,
  behaviorSessions,
} from "@shared/schema";
import type { ClientPageBehaviorDetail } from "@shared/clientGrowthCapabilities";
import { and, count, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getClientGrowthScopeForUser } from "./clientGrowthScope";

function normPagePath(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  try {
    if (s.startsWith("http")) return new URL(s).pathname || s;
  } catch {
    /* ignore */
  }
  return s.split("?")[0] ?? s;
}

function pageExpr() {
  return sql<string>`nullif(trim(both from coalesce(${behaviorEvents.metadata}->>'page', '')), '')`;
}

export async function buildClientPageBehaviorDetail(
  userId: number,
  rawPath: string,
  days: number,
): Promise<ClientPageBehaviorDetail | null> {
  const path = normPagePath(rawPath);
  if (!path.startsWith("/")) {
    return null;
  }

  const periodDays = Math.min(90, Math.max(7, Math.floor(days)));
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();
  const lastUpdatedIso = new Date().toISOString();

  const scope = await getClientGrowthScopeForUser(userId);
  if (scope.contactIds.length < 1) {
    return null;
  }

  const linkedWhere = and(
    gte(behaviorSessions.startTime, since),
    isNull(behaviorSessions.softDeletedAt),
    inArray(behaviorSessions.crmContactId, scope.contactIds),
  );

  const linkedSessionRows = await db
    .select({ id: behaviorSessions.id, sessionKey: behaviorSessions.sessionId })
    .from(behaviorSessions)
    .where(linkedWhere);

  const linkedIds = linkedSessionRows.map((r) => r.id);
  const sessionKeys = linkedSessionRows.map((r) => r.sessionKey);

  if (linkedIds.length < 1) {
    return {
      path,
      periodDays,
      sinceIso,
      lastUpdatedIso,
      linkedSessionsInWindow: 0,
      sessionsTouchingPage: 0,
      behaviorEventsOnPage: 0,
      heatmapClicksOnPage: 0,
      hasFrictionFlag: false,
      frictionSummary: null,
      narratives: [
        "No linked sessions in this window yet — check back after Ascendra connects tracking to your CRM profile.",
      ],
    };
  }

  const [[sessWindow]] = await Promise.all([db.select({ c: count() }).from(behaviorSessions).where(linkedWhere)]);

  const linkedSessionsInWindow = Number(sessWindow?.c ?? 0);

  const pex = pageExpr();
  const [touchingRow] = await db
    .select({
      c: sql<number>`count(distinct ${behaviorEvents.behaviorSessionId})`.mapWith(Number),
    })
    .from(behaviorEvents)
    .where(
      and(
        gte(behaviorEvents.timestamp, since),
        inArray(behaviorEvents.behaviorSessionId, linkedIds),
        sql`${pex} = ${path}`,
      ),
    );

  const [evRow] = await db
    .select({ c: count() })
    .from(behaviorEvents)
    .where(
      and(
        gte(behaviorEvents.timestamp, since),
        inArray(behaviorEvents.behaviorSessionId, linkedIds),
        sql`${pex} = ${path}`,
      ),
    );

  const heatmapClicksOnPage =
    sessionKeys.length > 0 ?
      await db
        .select({ c: count() })
        .from(behaviorHeatmapEvents)
        .where(
          and(
            gte(behaviorHeatmapEvents.createdAt, since),
            inArray(behaviorHeatmapEvents.sessionId, sessionKeys),
            eq(behaviorHeatmapEvents.page, path),
          ),
        )
        .then(([r]) => Number(r?.c ?? 0))
    : 0;

  const frictionOnPageRows = await db
    .select()
    .from(behaviorFrictionReports)
    .where(and(gte(behaviorFrictionReports.createdAt, since), eq(behaviorFrictionReports.page, path)))
    .orderBy(desc(behaviorFrictionReports.createdAt))
    .limit(1);

  const frictionOnPage = frictionOnPageRows[0];
  const hasFrictionFlag = !!frictionOnPage && ((frictionOnPage.deadClicks ?? 0) + (frictionOnPage.rageClicks ?? 0) > 0);

  const sessionsTouchingPage = Number(touchingRow?.c ?? 0);
  const behaviorEventsOnPage = Number(evRow?.c ?? 0);

  const narratives: string[] = [];
  if (heatmapClicksOnPage > 0) {
    narratives.push(
      `Visitors recorded ${heatmapClicksOnPage.toLocaleString()} tap/click points on this path — attention is measurable here.`,
    );
  }
  if (sessionsTouchingPage > 0 && behaviorEventsOnPage > 0) {
    narratives.push(
      `${sessionsTouchingPage} linked session(s) touched this page with ${behaviorEventsOnPage.toLocaleString()} logged interactions in this window.`,
    );
  }
  if (hasFrictionFlag && frictionOnPage) {
    narratives.push(
      frictionOnPage.summary ??
        "Friction signals suggest visitors may be confused or blocked — your Ascendra team can pair this with a guided review.",
    );
  }
  if (narratives.length === 0 && linkedSessionsInWindow > 0) {
    narratives.push(
      "This page saw little linked activity in the selected window — it may be a secondary path or still ramping on instrumentation.",
    );
  }

  return {
    path,
    periodDays,
    sinceIso,
    lastUpdatedIso,
    linkedSessionsInWindow,
    sessionsTouchingPage,
    behaviorEventsOnPage,
    heatmapClicksOnPage,
    hasFrictionFlag,
    frictionSummary: frictionOnPage?.summary ?? null,
    narratives,
  };
}
