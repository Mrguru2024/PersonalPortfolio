import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listPpcCampaignModelOptions } from "@shared/ppcCampaignModel";
import { ASCENDRA_OFFER_STACK } from "@shared/ascendraOfferStack";
import { listGrowthPersonaOfferPricing } from "@server/services/growthPersonaPricingService";
import { mergeOfferStackWithPersona } from "@server/services/growthOfferStackMerge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — admin: offer stack (optional persona merge) + persona pricing rows + PPC models. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const personaKey = req.nextUrl.searchParams.get("persona")?.trim().toLowerCase() || null;
    const personaPricing = await listGrowthPersonaOfferPricing();
    const personaRow = personaKey ? personaPricing.find((p) => p.personaKey === personaKey) ?? null : null;
    const offerStack = mergeOfferStackWithPersona(personaRow);
    return NextResponse.json({
      offerStack,
      offerStackBase: ASCENDRA_OFFER_STACK,
      offerStackPersonaKey: personaRow?.personaKey ?? null,
      personaPricing,
      ppcCampaignModels: listPpcCampaignModelOptions(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
