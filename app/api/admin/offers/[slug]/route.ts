import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/offers/[slug] — get one offer (admin). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const slug = (await params).slug;
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
    const offer = await storage.getSiteOffer(slug);
    if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(offer);
  } catch (error: unknown) {
    console.error("Offer GET error:", error);
    return NextResponse.json({ error: "Failed to load offer" }, { status: 500 });
  }
}

/** PATCH /api/admin/offers/[slug] — update offer. Body: { name?, metaTitle?, metaDescription?, sections? }. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const slug = (await params).slug;
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const existing = await storage.getSiteOffer(slug);
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : (existing?.name ?? slug);
    const metaTitle = body.metaTitle !== undefined ? (body.metaTitle === null || body.metaTitle === "" ? null : String(body.metaTitle)) : existing?.metaTitle ?? null;
    const metaDescription = body.metaDescription !== undefined ? (body.metaDescription === null || body.metaDescription === "" ? null : String(body.metaDescription)) : existing?.metaDescription ?? null;
    const sections = body.sections != null && typeof body.sections === "object" ? body.sections as Record<string, unknown> : (existing?.sections ?? {});
    const updated = await storage.setSiteOffer(slug, { name, metaTitle, metaDescription, sections });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("Offer PATCH error:", error);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}
