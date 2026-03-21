import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listLeadIntakeItems } from "@server/services/leadIntakeCrmService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/lead-intake
 * Unified list: growth diagnosis reports, funnel quiz leads, project assessments.
 * Query: limitPerSource (default 45, max 80)
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const limitPerSource = Math.min(
      Math.max(parseInt(searchParams.get("limitPerSource") ?? "45", 10) || 45, 5),
      80
    );
    const items = await listLeadIntakeItems(limitPerSource);
    const aiConfigured = !!process.env.OPENAI_API_KEY;
    return NextResponse.json({ items, aiConfigured });
  } catch (e) {
    console.error("GET /api/admin/lead-intake:", e);
    return NextResponse.json({ message: "Failed to load lead intake" }, { status: 500 });
  }
}
