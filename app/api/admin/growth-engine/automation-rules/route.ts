import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { insertAutomationRule, listAutomationRules } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  triggerType: z.enum([
    "form_abandon",
    "pricing_view",
    "booking_view",
    "high_intent",
    "repeat_visit",
    "cta_spike",
  ]),
  delayMinutes: z.number().int().min(0).max(10080).optional(),
  conditionsJson: z.record(z.unknown()).optional(),
  actionsJson: z.record(z.unknown()),
  enabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const rules = await listAutomationRules();
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
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
  const row = await insertAutomationRule({
    name: parsed.data.name,
    triggerType: parsed.data.triggerType,
    delayMinutes: parsed.data.delayMinutes ?? 0,
    conditionsJson: parsed.data.conditionsJson ?? {},
    actionsJson: parsed.data.actionsJson,
    enabled: parsed.data.enabled ?? true,
  });
  return NextResponse.json({ rule: row });
}
