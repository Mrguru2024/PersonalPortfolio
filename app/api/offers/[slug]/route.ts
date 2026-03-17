import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/offers/[slug] — public: get offer content for rendering (no auth). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await params).slug;
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
    const offer = await storage.getSiteOffer(slug);
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      slug: offer.slug,
      name: offer.name,
      metaTitle: offer.metaTitle,
      metaDescription: offer.metaDescription,
      sections: offer.sections,
      updatedAt: offer.updatedAt,
    });
  } catch (error: unknown) {
    console.error("Offer public GET error:", error);
    return NextResponse.json({ error: "Failed to load offer" }, { status: 500 });
  }
}
