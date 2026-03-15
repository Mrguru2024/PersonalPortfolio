import { NextRequest, NextResponse } from "next/server";
import { isSuperUser, hasPermission } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { FUNNEL_SLUGS } from "@/lib/funnelContent";

const SLUGS = new Set(FUNNEL_SLUGS);

function allowSlug(slug: string): boolean {
  return SLUGS.has(slug as (typeof FUNNEL_SLUGS)[number]);
}

/**
 * GET /api/admin/funnel/[slug]
 * Get funnel content for editing (admin with funnel permission or super user).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const isSuper = await isSuperUser(req);
    const canFunnel = await hasPermission(req, "funnel");
    if (!isSuper && !canFunnel) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { slug } = await params;
    if (!allowSlug(slug)) {
      return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
    }
    const row = await storage.getFunnelContent(slug);
    return NextResponse.json({ data: row?.data ?? null, slug });
  } catch (e) {
    console.error("GET admin funnel:", e);
    return NextResponse.json({ message: "Error loading content" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/funnel/[slug]
 * Update funnel content (admin with funnel permission or super user).
 * Body: { data: Record<string, unknown> }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const isSuper = await isSuperUser(req);
    const canFunnel = await hasPermission(req, "funnel");
    if (!isSuper && !canFunnel) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { slug } = await params;
    if (!allowSlug(slug)) {
      return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
    }
    const body = await req.json();
    const data = body?.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ message: "Valid data object required" }, { status: 400 });
    }
    const row = await storage.setFunnelContent(slug, data);
    return NextResponse.json({ data: row.data, slug: row.slug, updated_at: row.updated_at });
  } catch (e) {
    console.error("PATCH admin funnel:", e);
    return NextResponse.json({ message: "Error saving content" }, { status: 500 });
  }
}
