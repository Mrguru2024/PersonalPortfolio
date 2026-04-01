import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { db } from "@server/db";
import { marketingPersonas } from "@shared/schema";
import { commCampaigns } from "@shared/communicationsSchema";
import { desc } from "drizzle-orm";
import { listOfferTemplates, listLeadMagnetTemplates } from "@server/services/offerEngineService";

export const dynamic = "force-dynamic";

/** Offers, funnel slugs, personas, comm campaigns — for PPC builder pickers */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const [offers, funnels, personas, comms, offerTemplates, leadMagnetTemplates] = await Promise.all([
      storage.listSiteOffers(),
      storage.listFunnelContentPages(),
      db.select().from(marketingPersonas),
      db
        .select({ id: commCampaigns.id, name: commCampaigns.name })
        .from(commCampaigns)
        .orderBy(desc(commCampaigns.updatedAt)),
      listOfferTemplates(),
      listLeadMagnetTemplates(),
    ]);
    return NextResponse.json({
      offers: offers.map((o) => ({ slug: o.slug, name: o.name })),
      funnelSlugs: funnels.map((f) => ({ slug: f.slug })),
      personas: personas.map((p) => ({ id: p.id, displayName: p.displayName })),
      commCampaigns: comms.slice(0, 100),
      offerTemplates: offerTemplates.map((offer) => ({
        id: offer.id,
        slug: offer.slug,
        name: offer.name,
        overallScore:
          typeof offer.scoreCacheJson?.overall === "number" ? offer.scoreCacheJson.overall : null,
        readinessStatus:
          typeof offer.scoreCacheJson?.offerGrade?.readinessStatus === "string"
            ? offer.scoreCacheJson.offerGrade.readinessStatus
            : null,
      })),
      leadMagnetTemplates: leadMagnetTemplates.map((leadMagnet) => ({
        id: leadMagnet.id,
        slug: leadMagnet.slug,
        name: leadMagnet.name,
        overallScore:
          typeof leadMagnet.scoreCacheJson?.overall === "number"
            ? leadMagnet.scoreCacheJson.overall
            : null,
        grade:
          typeof leadMagnet.scoreCacheJson?.leadMagnetGrade?.grade === "string"
            ? leadMagnet.scoreCacheJson.leadMagnetGrade.grade
            : null,
        relatedOfferTemplateId: leadMagnet.relatedOfferTemplateId ?? null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Context load failed" }, { status: 500 });
  }
}
