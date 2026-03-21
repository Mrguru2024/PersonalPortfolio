import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { db } from "@server/db";
import { userActivityLog, users } from "@shared/schema";
import { desc, eq, lt, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

/**
 * GET /api/admin/system/activity-log
 * Returns login/user activity log (logins, failures, logout, errors). Super user only.
 * Query: ?limit=100&before=id&eventType=login_failure
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const beforeId = url.searchParams.get("before");
    const before = beforeId ? parseInt(beforeId, 10) : null;
    const eventType = url.searchParams.get("eventType")?.trim() || null;

    const conditions = [];
    if (before != null && !Number.isNaN(before)) {
      conditions.push(lt(userActivityLog.id, before));
    }
    if (eventType) {
      conditions.push(eq(userActivityLog.eventType, eventType));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const baseQuery = db
      .select({
        id: userActivityLog.id,
        userId: userActivityLog.userId,
        eventType: userActivityLog.eventType,
        success: userActivityLog.success,
        message: userActivityLog.message,
        identifier: userActivityLog.identifier,
        ipAddress: userActivityLog.ipAddress,
        userAgent: userActivityLog.userAgent,
        metadata: userActivityLog.metadata,
        createdAt: userActivityLog.createdAt,
        username: users.username,
      })
      .from(userActivityLog)
      .leftJoin(users, eq(userActivityLog.userId, users.id));

    const rows = await (whereClause
      ? baseQuery.where(whereClause).orderBy(desc(userActivityLog.id)).limit(limit)
      : baseQuery.orderBy(desc(userActivityLog.id)).limit(limit));

    const entries = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.username ?? null,
      eventType: r.eventType,
      success: r.success,
      message: r.message ?? null,
      identifier: r.identifier ?? null,
      ipAddress: r.ipAddress ?? null,
      userAgent: r.userAgent ?? null,
      metadata: r.metadata ?? null,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ entries });
  } catch (error: unknown) {
    console.error("Activity log GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}
