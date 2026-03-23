import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import {
  getOfferValuationAccessSettings,
  updateOfferValuationAccessSettings,
  offerValuationSettingsPatchSchema,
} from "@modules/offer-valuation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/offer-valuation/settings */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const settings = await getOfferValuationAccessSettings();
    return NextResponse.json(settings);
  } catch (e) {
    console.error("[GET /api/admin/offer-valuation/settings]", e);
    return NextResponse.json(
      { error: "Failed to load Offer Valuation settings" },
      { status: 500 },
    );
  }
}

/** PATCH /api/admin/offer-valuation/settings */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = offerValuationSettingsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await getSessionUser(req);
    const settings = await updateOfferValuationAccessSettings({
      ...parsed.data,
      updatedByUserId: user?.id ?? null,
    });
    return NextResponse.json(settings);
  } catch (e) {
    console.error("[PATCH /api/admin/offer-valuation/settings]", e);
    return NextResponse.json(
      { error: "Failed to update Offer Valuation settings" },
      { status: 500 },
    );
  }
}
