import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { insertKnowledgeEntry, listKnowledgeEntries } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(48_000),
  industry: z.string().max(120).optional().nullable(),
  personaKey: z.string().max(64).optional().nullable(),
  tags: z.array(z.string().max(64)).max(40).optional(),
  worksWell: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const entries = await listKnowledgeEntries(120);
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const uid = user?.id != null ? Number(user.id) : null;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const row = await insertKnowledgeEntry({
    title: parsed.data.title,
    body: parsed.data.body,
    industry: parsed.data.industry ?? null,
    personaKey: parsed.data.personaKey ?? null,
    tags: parsed.data.tags ?? [],
    worksWell: parsed.data.worksWell ?? true,
    createdByUserId: Number.isFinite(uid!) ? uid! : null,
  });
  return NextResponse.json({ entry: row });
}
