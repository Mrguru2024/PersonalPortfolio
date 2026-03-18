import { NextRequest, NextResponse } from "next/server";
import { getAfnResourceBySlug } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** GET /api/community/resources/[slug] — get resource by slug. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }
    const resource = await getAfnResourceBySlug(slug);
    if (!resource || !resource.isPublished) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    return NextResponse.json(resource);
  } catch (e) {
    console.error("GET community resource error:", e);
    return NextResponse.json({ error: "Failed to load resource" }, { status: 500 });
  }
}
