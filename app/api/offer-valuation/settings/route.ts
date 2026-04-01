import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { OFFER_VALUATION_MODES } from "@shared/offerValuation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema = z.object({
  accessMode: z.enum(OFFER_VALUATION_MODES).optional(),
  clientAccessEnabled: z.boolean().optional(),
  publicAccessEnabled: z.boolean().optional(),
  paidModeEnabled: z.boolean().optional(),
  aiDefaultEnabled: z.boolean().optional(),
  requireLeadCapture: z.boolean().optional(),
});

function shapeResponse(row: Awaited<ReturnType<typeof storage.getOfferValuationSettings>>) {
  return {
    accessMode: row.accessMode,
    clientAccessEnabled: row.clientAccessEnabled,
    publicAccessEnabled: row.publicAccessEnabled,
    paidModeEnabled: row.paidModeEnabled,
    aiDefaultEnabled: row.aiDefaultEnabled,
    requireLeadCapture: row.requireLeadCapture,
    updatedAt: row.updatedAt,
  };
}

export async function GET() {
  try {
    const row = await storage.getOfferValuationSettings();
    return NextResponse.json(shapeResponse(row));
  } catch (error) {
    console.error("GET /api/offer-valuation/settings:", error);
    return NextResponse.json(
      { message: "Failed to load offer valuation settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 },
      );
    }
    const json = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid settings payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const updated = await storage.upsertOfferValuationSettings(parsed.data);
    return NextResponse.json(shapeResponse(updated));
  } catch (error) {
    console.error("PATCH /api/offer-valuation/settings:", error);
    return NextResponse.json(
      { message: "Failed to update offer valuation settings" },
      { status: 500 },
    );
  }
}

