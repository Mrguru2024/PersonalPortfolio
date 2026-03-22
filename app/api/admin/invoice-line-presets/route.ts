import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  defaultAmountCents: z.number().int().nonnegative().optional().nullable(),
  defaultQuantity: z.number().int().positive().optional(),
  saleType: z.enum(["service", "product"]).optional(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const presets = await storage.listInvoiceLineItemPresets();
  return NextResponse.json({ presets });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const row = await storage.createInvoiceLineItemPreset({
    name: parsed.data.name,
    description: parsed.data.description,
    defaultAmountCents: parsed.data.defaultAmountCents ?? null,
    defaultQuantity: parsed.data.defaultQuantity ?? 1,
    saleType: parsed.data.saleType ?? "service",
  });
  return NextResponse.json(row, { status: 201 });
}
