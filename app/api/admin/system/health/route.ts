import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getLogStats } from "@/lib/systemMonitor";
import { db } from "@server/db";
import { userActivityLog } from "@shared/schema";
import { count } from "drizzle-orm";
import { SYSTEM_ENV_KEYS } from "@shared/system-env-checklist";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/system/health
 * Super user only. Returns DB status, entity counts, config presence, and log stats.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }

    let dbStatus: "ok" | "error" = "ok";
    let counts: Record<string, number> = {};
    let errorMessage: string | undefined;
    let userActivityLogCount: number | null = null;

    try {
      const [contacts, assessments, crmContacts, blogPosts] = await Promise.all([
        storage.getAllContacts(),
        storage.getAllAssessments(),
        storage.getCrmContacts(),
        storage.getBlogPosts(),
      ]);
      counts = {
        contacts: contacts.length,
        assessments: assessments.length,
        crmContacts: crmContacts.length,
        blogPosts: blogPosts.length,
      };
    } catch (e) {
      dbStatus = "error";
      errorMessage = e instanceof Error ? e.message : String(e);
    }

    try {
      const [row] = await db.select({ n: count() }).from(userActivityLog);
      userActivityLogCount = row?.n ?? 0;
    } catch {
      userActivityLogCount = null;
    }

    const config: Record<string, boolean> = {};
    for (const key of SYSTEM_ENV_KEYS) {
      const val = process.env[key];
      config[key] = !!val && val.length > 0;
    }

    const logStats = getLogStats();

    return NextResponse.json({
      db: dbStatus,
      errorMessage,
      counts,
      userActivityLogCount,
      config,
      logStats,
      nodeEnv: process.env.NODE_ENV ?? "development",
    });
  } catch (error) {
    console.error("System health error:", error);
    return NextResponse.json(
      { message: "Failed to get health" },
      { status: 500 }
    );
  }
}
