import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { getAfnResourceBySlug, recordAfnResourceView } from "@server/afnStorage";

export const dynamic = "force-dynamic";

/** POST /api/community/resources/[slug]/view — record a view (authenticated). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getSessionUser(_req);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }
    const resource = await getAfnResourceBySlug(slug);
    if (!resource || !resource.isPublished) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    await recordAfnResourceView(Number(user.id), resource.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST community resource view error:", e);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
