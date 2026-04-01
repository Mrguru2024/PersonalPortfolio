import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { insertGrowthCallEvent, listGrowthCallEvents } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  source: z.string().min(1).max(120),
  durationSeconds: z.number().int().min(0).optional().nullable(),
  verificationTag: z.enum(["qualified", "not_qualified", "missed", "spam"]).optional().nullable(),
  crmContactId: z.number().int().positive().optional().nullable(),
  behaviorSessionKey: z.string().max(200).optional().nullable(),
  pagePath: z.string().max(2048).optional().nullable(),
  trackingNumber: z.string().max(80).optional().nullable(),
  note: z.string().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const calls = await listGrowthCallEvents(80);
  return NextResponse.json({ calls });
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
  const row = await insertGrowthCallEvent({
    ...parsed.data,
    createdByUserId: Number.isFinite(uid!) ? uid! : null,
  });
  return NextResponse.json({ call: row });
}
