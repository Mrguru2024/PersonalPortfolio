import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import type { RevenueOpsSettingsConfig } from "@shared/crmSchema";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const operatingLineSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(400),
  monthlyCents: z.number().int(),
  notes: z.string().max(500).optional(),
});

const ledgerEntrySchema = z.object({
  id: z.string().min(1).max(120),
  occurredAt: z.string().min(4).max(40),
  kind: z.enum(["revenue", "cost"]),
  source: z.enum(["manual", "bank_import", "stripe_report"]),
  amountCents: z.number().int(),
  label: z.string().min(1).max(400),
  userId: z.number().int().optional(),
  quoteId: z.number().int().optional(),
  notes: z.string().max(2000).optional(),
});

const financeSchema = z.object({
  reportingPeriodDays: z.number().int().min(7).max(366).optional(),
  operatingCostLines: z.array(operatingLineSchema).max(40).optional(),
  ledgerEntries: z.array(ledgerEntrySchema).max(500).optional(),
  targetGrossMarginPercent: z.number().min(0).max(100).optional(),
  bankDataNote: z.string().max(4000).optional(),
});

const bodySchema = z.object({
  welcomeSmsEnabled: z.boolean().optional(),
  welcomeSmsTemplate: z.string().max(1600).optional(),
  missedCallSmsEnabled: z.boolean().optional(),
  missedCallSmsTemplate: z.string().max(1600).optional(),
  defaultBookingUrl: z.string().max(2000).optional(),
  finance: financeSchema.optional(),
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
