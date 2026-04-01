/**
 * Batch friction heuristics from behavior_events (click density, form funnel proxy).
 */
import { db } from "@server/db";
import { behaviorEvents, behaviorFrictionReports } from "@shared/schema";
import { desc, gte } from "drizzle-orm";

function pageFromMetadata(m: Record<string, unknown> | null | undefined): string {
  if (!m) return "";
  const u = m.url;
  if (typeof u === "string" && u.length > 0) return u.slice(0, 2048);
  const p = m.page;
  if (typeof p === "string") return p.slice(0, 2048);
  return "";
}

export async function runBehaviorFrictionSweep(since: Date): Promise<number> {
  const rows = await db
    .select({
      type: behaviorEvents.type,
      metadata: behaviorEvents.metadata,
      sessionId: behaviorEvents.sessionId,
      clientTs: behaviorEvents.clientTs,
      timestamp: behaviorEvents.timestamp,
    })
    .from(behaviorEvents)
    .where(gte(behaviorEvents.timestamp, since));

  type Agg = { clicks: number; rageHint: number; deadClicks: number; formStarts: number; formSubmits: number };
  const byPage = new Map<string, Agg>();

  const bump = (page: string, fn: (a: Agg) => void) => {
    if (!page) return;
    const agg = byPage.get(page) ?? { clicks: 0, rageHint: 0, deadClicks: 0, formStarts: 0, formSubmits: 0 };
    fn(agg);
    byPage.set(page, agg);
  };

  /** clicks per session for simple burst detection */
  const clicksBySession = new Map<string, { page: string; times: number[] }[]>();

  for (const row of rows) {
    const meta = row.metadata as Record<string, unknown> | undefined;
    const page = pageFromMetadata(meta);
    const t = row.type;

    if (t === "click") {
      bump(page, (a) => {
        a.clicks += 1;
        if (meta?.dead === true || meta?.deadClick === true) a.deadClicks += 1;
      });
      const ts = (row.clientTs ?? row.timestamp.getTime()) as number;
      const list = clicksBySession.get(row.sessionId) ?? [];
      let bucket = list.find((b) => b.page === page);
      if (!bucket) {
        bucket = { page, times: [] };
        list.push(bucket);
      }
      bucket.times.push(ts);
      clicksBySession.set(row.sessionId, list);
    }

    if (t === "form_start" || t === "form_started" || t === "form_abandon") {
      bump(page, (a) => {
        a.formStarts += 1;
      });
    }
    if (t === "form_submit" || t === "form_completed") {
      bump(page, (a) => {
        a.formSubmits += 1;
      });
    }
  }

  for (const [, buckets] of clicksBySession) {
    for (const b of buckets) {
      const sorted = [...b.times].sort((x, y) => x - y);
      let bursts = 0;
      for (let i = 0; i < sorted.length; i++) {
        let j = i;
        while (j < sorted.length && sorted[j]! - sorted[i]! <= 1500) j++;
        const n = j - i;
        if (n >= 5) bursts += 1;
        i = j - 1;
      }
      if (bursts > 0) {
        bump(b.page, (a) => {
          a.rageHint += bursts;
        });
      }
    }
  }

  let inserted = 0;
  for (const [page, agg] of byPage) {
    if (agg.clicks === 0 && agg.formStarts === 0 && agg.formSubmits === 0) continue;
    const drop =
      agg.formStarts > 0 ? Math.min(1, Math.max(0, 1 - agg.formSubmits / Math.max(1, agg.formStarts))) : null;
    const parts: string[] = [];
    if (agg.rageHint > 0) parts.push(`Burst clicking patterns suggest friction (${agg.rageHint} window(s)).`);
    if (agg.deadClicks > 0) parts.push(`${agg.deadClicks} clicks logged without clear follow-through.`);
    if (drop != null && drop >= 0.35) parts.push(`Form completion looks weak (~${Math.round(drop * 100)}% abandonment signal).`);
    if (parts.length === 0) parts.push("No strong friction pattern in this window.");
    await db.insert(behaviorFrictionReports).values({
      businessId: null,
      page,
      rageClicks: agg.rageHint,
      deadClicks: agg.deadClicks,
      dropOffRate: drop,
      summary: parts.join(" "),
    });
    inserted++;
  }

  return inserted;
}

export async function listRecentFriction(limit: number): Promise<(typeof behaviorFrictionReports.$inferSelect)[]> {
  return db
    .select()
    .from(behaviorFrictionReports)
    .orderBy(desc(behaviorFrictionReports.createdAt))
    .limit(Math.min(100, limit));
}
