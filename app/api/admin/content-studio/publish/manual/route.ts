import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { manualPublishDocument } from "@server/services/internalStudio/workflowService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  documentId: z.number().int(),
  calendarEntryId: z.number().int().optional().nullable(),
  platform: z.string().min(1).max(80),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const out = await manualPublishDocument({
      documentId: parsed.data.documentId,
      calendarEntryId: parsed.data.calendarEntryId ?? null,
      platform: parsed.data.platform,
      userId: user?.id ?? null,
    });
    return NextResponse.json(out);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
