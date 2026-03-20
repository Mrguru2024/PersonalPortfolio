import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { listCampaigns, createCampaign } from "@server/services/internalStudio/cmsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  goal: z.string().optional().nullable(),
  projectKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const campaigns = await listCampaigns(searchParams.get("projectKey") ?? undefined);
    return NextResponse.json({ campaigns });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const row = await createCampaign(parsed.data);
    return NextResponse.json({ campaign: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
