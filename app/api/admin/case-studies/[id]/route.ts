import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { getCaseStudyById, updateCaseStudy } from "@server/services/caseStudyService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(5).optional(),
  slug: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  summary: z.string().optional(),
  persona: z.string().optional(),
  recommendedSystem: z.string().optional(),
  publishState: z.string().optional(),
  featured: z.boolean().optional(),
  sections: z.record(z.string(), z.unknown()).optional(),
  blocks: z.array(z.record(z.string(), z.unknown())).optional(),
  formats: z.record(z.string(), z.unknown()).optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaHref: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const caseStudyId = Number.parseInt(id, 10);
    if (Number.isNaN(caseStudyId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const row = await getCaseStudyById(caseStudyId);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ caseStudy: row });
  } catch (error) {
    console.error("GET /api/admin/case-studies/[id] error:", error);
    return NextResponse.json({ error: "Failed to load case study" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const { id } = await params;
    const caseStudyId = Number.parseInt(id, 10);
    if (Number.isNaN(caseStudyId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const row = await updateCaseStudy(caseStudyId, {
      ...parsed.data,
      updatedByUserId: user?.id ?? null,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ caseStudy: row });
  } catch (error) {
    console.error("PATCH /api/admin/case-studies/[id] error:", error);
    return NextResponse.json({ error: "Failed to update case study" }, { status: 500 });
  }
}
