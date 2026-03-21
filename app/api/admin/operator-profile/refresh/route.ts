import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { refreshOperatorIntelligence } from "@server/services/adminOperatorProfileService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statsSchema = z
  .object({
    pendingAssessments: z.number().int().min(0).optional(),
    totalContacts: z.number().int().min(0).optional(),
    unaccessedResume: z.number().int().min(0).optional(),
  })
  .strict();

/** POST /api/admin/operator-profile/refresh — regenerate daily/weekly tasks + tips (OpenAI or fallback) */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const sessionUser = await getSessionUser(req);
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const parsed = statsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const s = parsed.data;
    const profile = await refreshOperatorIntelligence(sessionUser.id, {
      pendingAssessments: s.pendingAssessments ?? 0,
      totalContacts: s.totalContacts ?? 0,
      unaccessedResume: s.unaccessedResume ?? 0,
    });
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[POST admin/operator-profile/refresh]", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("admin_operator_profiles") && /does not exist|relation/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database table admin_operator_profiles is missing. Apply the schema (e.g. npm run db:push), then try again.",
          code: "operator_profile_schema_missing",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to refresh intelligence plan" }, { status: 500 });
  }
}
