import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";
import { FUNNEL_SLUGS } from "@/lib/funnelContent";

const SLUGS = new Set(FUNNEL_SLUGS);

/**
 * GET /api/funnel/[slug]
 * Public: get funnel content by slug (for use by public pages).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug || !SLUGS.has(slug as (typeof FUNNEL_SLUGS)[number])) {
      return NextResponse.json({ data: null }, { status: 200 });
    }
    const row = await storage.getFunnelContent(slug);
    return NextResponse.json({ data: row?.data ?? null });
  } catch (e) {
    console.error("GET funnel:", e);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
