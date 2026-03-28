import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import {
  canAccessOfferValuationEngine,
  getOfferValuationAccessSettings,
  isApprovedAdminUser,
} from "@modules/offer-valuation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/offer-valuation/access */
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
    const isAdmin = isApprovedAdminUser(user);
    const canAccess = canAccessOfferValuationEngine(user, settings);

    return NextResponse.json({
      canAccess,
      isAdmin,
      makeAvailableToClient: settings.makeAvailableToClient,
      visibility: settings.visibility,
      clientExperienceMode: settings.clientExperienceMode,
    });
  } catch (e) {
    console.error("[GET /api/offer-valuation/access]", e);
    return NextResponse.json(
      { error: "Failed to resolve Offer Valuation access" },
      { status: 500 },
    );
  }
}
