import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import {
  countLeadMagnets,
  countScripts,
  listMarketingPersonas,
} from "@server/services/ascendraIntelligenceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/admin/ascendra-intelligence/summary — hub dashboard counts. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const [personas, offers, scriptCount, magnetCount] = await Promise.all([
      listMarketingPersonas(),
      storage.listSiteOffers(),
      countScripts(),
      countLeadMagnets(),
    ]);
    return NextResponse.json({
      personaCount: personas.length,
      siteOfferCount: offers.length,
      scriptCount,
      leadMagnetCount: magnetCount,
    });
  } catch (e) {
    console.error("[GET ascendra-intelligence/summary]", e);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }
}
