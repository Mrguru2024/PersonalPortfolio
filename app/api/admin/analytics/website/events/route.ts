import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/analytics/website/events — raw visitor activity for event log. Admin only. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const sinceParam = req.nextUrl.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : undefined;
    const limitParam = req.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(500, Math.max(1, Number.parseInt(limitParam, 10) || 100)) : 100;

    const events = await storage.getVisitorActivityRecent(since, limit);
    const list = Array.isArray(events) ? events : [];
    return NextResponse.json(list);
  } catch (error: unknown) {
    console.error("Website analytics events error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
