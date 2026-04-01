import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { invalidateAdminAgentContextCache } from "@server/services/adminAgentContextBuilder";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/agent/refresh-context — rebuild in-memory admin agent CONTEXT from disk.
 * Lets the assistant pick up new routes/metadata without waiting for the TTL.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    invalidateAdminAgentContextCache();
    return NextResponse.json({ ok: true, message: "Assistant site context will rebuild on the next message." });
  } catch (e) {
    console.error("POST /api/admin/agent/refresh-context", e);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
