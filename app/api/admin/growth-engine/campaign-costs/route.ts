import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { insertGrowthCampaignCost, listGrowthCampaignCosts } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  label: z.string().min(1).max(200),
  channel: z.string().min(1).max(120),
  amountCents: z.number().int(),
  currency: z.string().max(8).optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  note: z.string().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const rows = await listGrowthCampaignCosts(80);
  return NextResponse.json({ costs: rows });
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
  const row = await insertGrowthCampaignCost({
    label: parsed.data.label,
    channel: parsed.data.channel,
    amountCents: parsed.data.amountCents,
    currency: parsed.data.currency ?? "usd",
    periodStart: new Date(parsed.data.periodStart),
    periodEnd: new Date(parsed.data.periodEnd),
    note: parsed.data.note ?? null,
    createdByUserId: Number.isFinite(uid!) ? uid! : null,
  });
  return NextResponse.json({ cost: row });
}
