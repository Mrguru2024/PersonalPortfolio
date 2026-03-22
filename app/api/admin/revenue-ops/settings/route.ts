import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { RevenueOpsSettingsConfig } from "@shared/crmSchema";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  welcomeSmsEnabled: z.boolean().optional(),
  welcomeSmsTemplate: z.string().max(1600).optional(),
  missedCallSmsEnabled: z.boolean().optional(),
  missedCallSmsTemplate: z.string().max(1600).optional(),
  defaultBookingUrl: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const row = await storage.getRevenueOpsSettings();
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const patch = parsed.data as RevenueOpsSettingsConfig;
  const row = await storage.upsertRevenueOpsSettings(patch);
  return NextResponse.json(row);
}
