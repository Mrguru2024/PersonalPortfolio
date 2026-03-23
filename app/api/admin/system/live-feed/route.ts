import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { isSuperUser } from "@/lib/auth-helpers";
import { getLogs } from "@/lib/systemMonitor";
import { db } from "@server/db";
import { storage } from "@server/storage";
import { userActivityLog } from "@shared/schema";
import type { LiveFeedItem, LiveFeedSeverity } from "@/lib/adminLiveFeedTypes";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system/live-feed
 * Super user only. Merges in-memory monitor, persisted user_activity_log, and visitor_activity (recent).
 * Query: limit (default 80, max 200), afterMs (only events newer than this client timestamp).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 },
      );
    }

    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 80, 200);
    const afterMs = Math.max(0, Number(req.nextUrl.searchParams.get("afterMs")) || 0);
    const perSource = Math.min(Math.max(limit * 2, 100), 250);

    const [memoryEntries, auditRows, visitors] = await Promise.all([
      Promise.resolve(getLogs(perSource)),
      db
        .select()
        .from(userActivityLog)
        .orderBy(desc(userActivityLog.createdAt))
        .limit(perSource),
      storage.getVisitorActivityRecent(undefined, perSource),
    ]);

    const items: { id: string; kind: string; atMs: number; title: string; subtitle?: string; severity: LiveFeedSeverity }[] = [];

    for (const e of memoryEntries) {
      const atMs = e.timestamp;
      if (afterMs > 0 && atMs <= afterMs) continue;
      const parts = [e.route, e.method, e.userId].filter(Boolean);
      items.push({
        id: `m-${e.id}`,
        kind: e.type === "error" ? "error" : "runtime",
        atMs,
        title: e.message.slice(0, 220),
        subtitle: parts.length ? parts.join(" · ") : undefined,
        severity: e.type === "error" ? "error" : "info",
      });
    }

    for (const r of auditRows) {
      const atMs = new Date(r.createdAt as Date).getTime();
      if (afterMs > 0 && atMs <= afterMs) continue;
      const sub = [r.identifier, r.message].filter(Boolean).join(" · ").slice(0, 320);
      items.push({
        id: `a-${r.id}`,
        kind: "audit",
        atMs,
        title: `${r.eventType}${r.success ? "" : " · failed"}`,
        subtitle: sub || undefined,
        severity: r.success ? "info" : "warn",
      });
    }

    for (const v of visitors) {
      const atMs = new Date(v.createdAt as Date).getTime();
      if (afterMs > 0 && atMs <= afterMs) continue;
      const page = v.pageVisited ?? "";
      const vid = typeof v.visitorId === "string" ? v.visitorId.slice(0, 12) : "";
      const sub = [v.country, v.region, v.deviceType, vid].filter(Boolean).join(" · ");
      items.push({
        id: `v-${v.id}`,
        kind: "visitor",
        atMs,
        title: `${v.eventType}${page ? ` · ${page.slice(0, 120)}` : ""}`,
        subtitle: sub || undefined,
        severity: "info",
      });
    }

    items.sort((a, b) => b.atMs - a.atMs);
    const sliced = items.slice(0, limit);

    const body: { items: LiveFeedItem[]; serverTime: number } = {
      items: sliced.map(({ atMs, ...rest }) => ({
        ...rest,
        at: new Date(atMs).toISOString(),
      })),
      serverTime: Date.now(),
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("Live feed error:", error);
    return NextResponse.json({ message: "Failed to load live feed" }, { status: 500 });
  }
}
