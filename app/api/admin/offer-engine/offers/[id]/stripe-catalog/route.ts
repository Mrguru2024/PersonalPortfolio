import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  isStripeOfferCatalogSyncEnabled,
  syncOfferTemplateStripeCatalog,
} from "@server/services/offerEngineStripeCatalogSync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const idParam = z.coerce.number().int().positive();

/** POST — create Stripe Product + USD Prices from computed suggested DFY amounts; put IDs into pricing package inputs. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const { id: raw } = await ctx.params;
    const id = idParam.safeParse(raw);
    if (!id.success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
    if (!isStripeOfferCatalogSyncEnabled()) {
      return NextResponse.json(
        {
          error:
            "Stripe catalog sync disabled. Set ASCENDRA_STRIPE_OFFER_SYNC=1 and STRIPE_SECRET_KEY.",
        },
        { status: 503 },
      );
    }
    void req; // reserved for future ?force=
    const result = await syncOfferTemplateStripeCatalog(id.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST offer-engine/stripe-catalog]", e);
    return NextResponse.json({ error: "Stripe sync failed" }, { status: 500 });
  }
}
