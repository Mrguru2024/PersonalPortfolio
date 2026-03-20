import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createAttribution, listAttributions } from "@server/services/growthIntelligence/attributionService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  projectKey: z.string().default("ascendra_main"),
  contactId: z.number().int().positive(),
  dealId: z.number().int().positive().optional().nullable(),
  documentId: z.number().int().positive().optional().nullable(),
  blogPostId: z.number().int().positive().optional().nullable(),
  calendarEntryId: z.number().int().positive().optional().nullable(),
  channel: z.string().max(64).optional(),
  attributionLabel: z.string().max(500).optional().nullable(),
  metadataJson: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const projectKey = searchParams.get("projectKey") ?? undefined;
    const contactId = searchParams.get("contactId")
      ? parseInt(searchParams.get("contactId")!, 10)
      : undefined;
    const rows = await listAttributions({ projectKey, contactId, limit: 100 });
    return NextResponse.json({ attributions: rows });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const row = await createAttribution({
      ...parsed.data,
      createdByUserId: user?.id ?? null,
    });
    if (!row) return NextResponse.json({ error: "Failed" }, { status: 500 });
    return NextResponse.json({ attribution: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
