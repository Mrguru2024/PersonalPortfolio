import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { LEAD_MAGNET_TYPES } from "@shared/schema";
import { createLeadMagnet, listLeadMagnets } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const magnetTypeZ = z.enum(LEAD_MAGNET_TYPES as unknown as [string, ...string[]]);

const postSchema = z
  .object({
    magnetType: magnetTypeZ,
    title: z.string().min(1),
    hook: z.string().nullable().optional(),
    bodyMd: z.string().nullable().optional(),
    primaryAssetId: z.number().int().positive().nullable().optional(),
    personaIds: z.array(z.string()).optional(),
    status: z.enum(["draft", "approved", "published"]).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const magnets = await listLeadMagnets();
    return NextResponse.json({ magnets });
  } catch (e) {
    console.error("[GET ascendra-intelligence/lead-magnets]", e);
    return NextResponse.json({ error: "Failed to list lead magnets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const magnet = await createLeadMagnet({
      magnetType: d.magnetType,
      title: d.title,
      hook: d.hook ?? undefined,
      bodyMd: d.bodyMd ?? undefined,
      primaryAssetId: d.primaryAssetId != null ? d.primaryAssetId : undefined,
      personaIds: d.personaIds,
      status: d.status,
    });
    return NextResponse.json({ magnet }, { status: 201 });
  } catch (e) {
    console.error("[POST ascendra-intelligence/lead-magnets]", e);
    return NextResponse.json({ error: "Failed to create lead magnet" }, { status: 500 });
  }
}
