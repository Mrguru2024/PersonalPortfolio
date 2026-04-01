import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  canAccessOfferValuationEngine,
  getOfferValuationAccessSettings,
} from "@modules/offer-valuation";
import { listMarketingPersonas } from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/offer-valuation/personas */
export async function GET(req: NextRequest) {
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

    const personas = await listMarketingPersonas();
    return NextResponse.json({
      personas: personas.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        segment: p.segment,
        summary: p.summary,
      })),
    });
  } catch (e) {
    console.error("[GET /api/offer-valuation/personas]", e);
    return NextResponse.json(
      { error: "Failed to load personas" },
      { status: 500 },
    );
  }
}
