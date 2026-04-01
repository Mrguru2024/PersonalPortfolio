import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { listLegalClausesForAdmin, upsertLegalClause } from "@server/services/legalClauseService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const clauses = await listLegalClausesForAdmin();
    return NextResponse.json({ clauses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const slug = String(body.slug ?? "").trim();
    const category = String(body.category ?? "").trim();
    const title = String(body.title ?? "").trim();
    const bodyHtml = String(body.bodyHtml ?? "");
    if (!slug || !category || !title) {
      return NextResponse.json({ error: "slug, category, and title required" }, { status: 400 });
    }
    const row = await upsertLegalClause({
      slug,
      category,
      title,
      bodyHtml,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : undefined,
      isActive: body.isActive != null ? Boolean(body.isActive) : undefined,
      lawyerReviewedAt:
        body.lawyerReviewedAt != null ? new Date(String(body.lawyerReviewedAt)) : undefined,
      lawyerReviewerName:
        body.lawyerReviewerName != null ? String(body.lawyerReviewerName) : undefined,
      lawyerFirmName: body.lawyerFirmName != null ? String(body.lawyerFirmName) : undefined,
      reviewNotes: body.reviewNotes != null ? String(body.reviewNotes) : undefined,
    });
    return NextResponse.json({ clause: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
