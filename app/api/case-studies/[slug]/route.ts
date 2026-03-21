import { NextRequest, NextResponse } from "next/server";
import { getCaseStudyBySlug, listCaseStudies } from "@server/services/caseStudyService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const preview = new URL(req.url).searchParams.get("preview") === "1";
    const caseStudy = await getCaseStudyBySlug(slug, { includePreview: preview });
    if (!caseStudy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const relatedCandidates = await listCaseStudies({
      includeNonPublished: preview,
      persona: caseStudy.persona,
    });
    const related = relatedCandidates
      .filter((entry) => entry.slug !== caseStudy.slug)
      .slice(0, 3);

    return NextResponse.json({ caseStudy, related });
  } catch (error) {
    console.error("GET /api/case-studies/[slug] error:", error);
    return NextResponse.json({ error: "Failed to load case study" }, { status: 500 });
  }
}
