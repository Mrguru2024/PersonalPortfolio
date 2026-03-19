import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/growth-intelligence/attribution — aggregate leads/deals by UTM. Admin only. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");
    const untilParam = searchParams.get("until");

    const since = sinceParam ? new Date(sinceParam) : undefined;
    const until = untilParam ? new Date(untilParam) : undefined;

    const rows = await storage.getAttributionAggregate({ since, until });

    return NextResponse.json({
      filters: { since: since?.toISOString() ?? null, until: until?.toISOString() ?? null },
      attribution: rows,
    });
  } catch (error: unknown) {
    console.error("Growth Intelligence attribution error:", error);
    return NextResponse.json(
      { error: "Failed to load attribution data" },
      { status: 500 }
    );
  }
}
