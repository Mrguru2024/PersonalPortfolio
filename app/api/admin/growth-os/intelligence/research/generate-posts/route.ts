import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { createDraftPostsFromKeyword } from "@server/services/growthIntelligence/researchIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  projectKey: z.string().default("ascendra_main"),
  phrase: z.string().min(1).max(2000),
  count: z.number().int().min(1).max(5).default(2),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const out = await createDraftPostsFromKeyword({
      projectKey: parsed.data.projectKey,
      phrase: parsed.data.phrase,
      count: parsed.data.count,
      createdByUserId: user?.id ?? null,
    });
    return NextResponse.json(out);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
