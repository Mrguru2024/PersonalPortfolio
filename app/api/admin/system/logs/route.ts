import { NextRequest, NextResponse } from "next/server";
import { isSuperUser } from "@/lib/auth-helpers";
import { getLogs, clearLogs, parseStackForFix, captureApiError, type LogEntry } from "@/lib/systemMonitor";

/**
 * GET /api/admin/system/logs
 * Returns recent error/activity logs for super admin (5epmgllc@gmail.com / developer).
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 200, 500);
    const entries = getLogs(limit);
    const withFix = entries.map((e: LogEntry) => ({
      ...e,
      fixHint: e.type === "error" && e.stack ? parseStackForFix(e.stack) : undefined,
    }));
    return NextResponse.json({ logs: withFix });
  } catch (error) {
    console.error("System logs GET error:", error);
    return NextResponse.json(
      { message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/system/logs
 * Body: { "action": "clear" } — clears in-memory logs. Super user only.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isSuperUser(req))) {
      return NextResponse.json(
        { message: "Super user access required" },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    if (body?.action === "clear") {
      clearLogs();
      return NextResponse.json({ ok: true, message: "Logs cleared" });
    }
    return NextResponse.json(
      { message: "Invalid action. Use { \"action\": \"clear\" }" },
      { status: 400 }
    );
  } catch (error) {
    captureApiError(error, req);
    console.error("System logs POST error:", error);
    return NextResponse.json(
      { message: "Failed to clear logs" },
      { status: 500 }
    );
  }
}
