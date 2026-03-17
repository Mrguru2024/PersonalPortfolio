import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/offers — list all site offers (admin). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const list = await storage.listSiteOffers();
    return NextResponse.json({ offers: list });
  } catch (error: unknown) {
    console.error("Offers list error:", error);
    return NextResponse.json({ error: "Failed to load offers" }, { status: 500 });
  }
}

/** POST /api/admin/offers — create offer. Body: { slug, name, metaTitle?, metaDescription?, sections? }. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : "";
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : slug;
    const metaTitle = body.metaTitle ?? null;
    const metaDescription = body.metaDescription ?? null;
    const sections = body.sections != null && typeof body.sections === "object" ? body.sections as Record<string, unknown> : {};
    const offer = await storage.setSiteOffer(slug, { name, metaTitle, metaDescription, sections });
    return NextResponse.json(offer);
  } catch (error: unknown) {
    console.error("Offers POST error:", error);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
