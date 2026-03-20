import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { updateSuggestionReview } from "@server/services/growthIntelligence/contentInsightService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  reviewStatus: z.enum(["pending", "accepted", "rejected", "edited", "dismissed"]).optional(),
  editedBody: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const { id } = await params;
    const sid = parseInt(id, 10);
    if (Number.isNaN(sid)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const row = await updateSuggestionReview(sid, {
      ...parsed.data,
      reviewedByUserId: user?.id ?? null,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ suggestion: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
