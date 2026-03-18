import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { gradeOfferContent } from "@/lib/contentGrading";
import type { OfferContentGrading } from "@shared/schema";

export const dynamic = "force-dynamic";

/** POST /api/admin/offers/[slug]/grade — run content grading and save to offer. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const offer = await storage.getSiteOffer(slug);
    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    const sections = (offer.sections ?? {}) as Record<string, unknown>;
    const result = gradeOfferContent({
      metaTitle: offer.metaTitle,
      metaDescription: offer.metaDescription,
      sections: {
        hero: sections.hero as { title?: string; subtitle?: string; imageUrl?: string },
        bullets: sections.bullets as string[],
        cta: sections.cta as { buttonText?: string; buttonHref?: string; footnote?: string },
        deliverables: sections.deliverables as { title?: string; desc?: string }[],
      },
    });

    const grading: OfferContentGrading = {
      seoScore: result.seoScore,
      designScore: result.designScore,
      copyScore: result.copyScore,
      overallGrade: result.overallGrade,
      gradedAt: new Date().toISOString(),
      feedback: result.feedback,
    };

    await storage.updateSiteOfferGrading(slug, grading);
    return NextResponse.json({ grading: result });
  } catch (e) {
    console.error("Offer grade error:", e);
    return NextResponse.json({ error: "Failed to grade offer" }, { status: 500 });
  }
}
