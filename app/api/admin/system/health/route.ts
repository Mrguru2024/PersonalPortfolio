import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { getLogStats } from "@/lib/systemMonitor";

export const dynamic = "force-dynamic";

const CONFIG_KEYS = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "ADMIN_EMAIL",
  "BREVO_API_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
  "TRACKING_SIGNATURE_SECRET",
];

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

    let db: "ok" | "error" = "ok";
    let counts: Record<string, number> = {};
    let errorMessage: string | undefined;

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
      // Optional: visitor activity count would require a new storage method; skip for now
    } catch (e) {
      db = "error";
      errorMessage = e instanceof Error ? e.message : String(e);
    }

    const config: Record<string, boolean> = {};
    for (const key of CONFIG_KEYS) {
      const val = process.env[key];
      config[key] = !!val && val.length > 0;
    }

    const logStats = getLogStats();

    return NextResponse.json({
      db,
      errorMessage,
      counts,
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
