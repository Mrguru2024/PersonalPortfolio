import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { getLogStats } from "@/lib/systemMonitor";
import { db } from "@server/db";
import {
  userActivityLog,
  contacts,
  crmContacts,
  blogPosts,
  projectAssessments,
} from "@shared/schema";
import { count, isNull } from "drizzle-orm";
import { SYSTEM_ENV_KEYS } from "@shared/system-env-checklist";

export const dynamic = "force-dynamic";

function isMissingDeletedAtColumn(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return msg.includes("deleted_at") || (msg.includes("column") && msg.includes("does not exist"));
}

/**
 * GET /api/admin/system/health
 * Super user only. DB status, SQL row counts (no full table scans), config presence, log stats, deploy hints.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json({ message: "Super user access required" }, { status: 403 });
    }

    let dbStatus: "ok" | "error" = "ok";
    let counts: Record<string, number> = { contacts: 0, assessments: 0, crmContacts: 0, blogPosts: 0 };
    let errorMessage: string | undefined;
    let userActivityLogCount: number | null = null;

    try {
      const contactTask = db.select({ n: count() }).from(contacts);
      const crmTask = db.select({ n: count() }).from(crmContacts);
      const blogTask = db.select({ n: count() }).from(blogPosts);

      const assessmentCountTask = (async () => {
        try {
          const [row] = await db
            .select({ n: count() })
            .from(projectAssessments)
            .where(isNull(projectAssessments.deletedAt));
          return row?.n ?? 0;
        } catch (e) {
          if (!isMissingDeletedAtColumn(e)) throw e;
          const [row] = await db.select({ n: count() }).from(projectAssessments);
          return row?.n ?? 0;
        }
      })();

      const [[contactRow], [crmRow], [blogRow], assessmentN] = await Promise.all([
        contactTask,
        crmTask,
        blogTask,
        assessmentCountTask,
      ]);

      counts = {
        contacts: contactRow?.n ?? 0,
        assessments: assessmentN,
        crmContacts: crmRow?.n ?? 0,
        blogPosts: blogRow?.n ?? 0,
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
      /** Hosting / deploy hints (no secrets): */
      deploy: {
        vercelEnv: process.env.VERCEL_ENV ?? null,
        region: process.env.VERCEL_REGION ?? null,
        gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
      },
    });
  } catch (error) {
    console.error("System health error:", error);
    return NextResponse.json({ message: "Failed to get health" }, { status: 500 });
  }
}
