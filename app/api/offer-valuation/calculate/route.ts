import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  canAccessOfferValuationEngine,
  calculateOfferValuation,
  getOfferValuationAccessSettings,
  offerValuationInputSchema,
} from "@modules/offer-valuation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/offer-valuation/calculate */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const settings = await getOfferValuationAccessSettings();
    if (!canAccessOfferValuationEngine(user, settings)) {
      return NextResponse.json(
        { error: "Offer Valuation is not available for your account" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = offerValuationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = calculateOfferValuation(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/offer-valuation/calculate]", e);
    return NextResponse.json(
      { error: "Failed to calculate offer valuation" },
      { status: 500 },
    );
  }
}
