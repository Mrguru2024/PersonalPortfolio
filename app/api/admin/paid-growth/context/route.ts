import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { db } from "@server/db";
import { marketingPersonas } from "@shared/schema";
import { commCampaigns } from "@shared/communicationsSchema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Offers, funnel slugs, personas, comm campaigns — for PPC builder pickers */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const [offers, funnels, personas, comms] = await Promise.all([
      storage.listSiteOffers(),
      storage.listFunnelContentPages(),
      db.select().from(marketingPersonas),
      db
        .select({ id: commCampaigns.id, name: commCampaigns.name })
        .from(commCampaigns)
        .orderBy(desc(commCampaigns.updatedAt)),
    ]);
    return NextResponse.json({
      offers: offers.map((o) => ({ slug: o.slug, name: o.name })),
      funnelSlugs: funnels.map((f) => ({ slug: f.slug })),
      personas: personas.map((p) => ({ id: p.id, displayName: p.displayName })),
      commCampaigns: comms.slice(0, 100),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Context load failed" }, { status: 500 });
  }
}
