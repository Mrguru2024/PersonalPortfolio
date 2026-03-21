import { NextRequest, NextResponse } from "next/server";
import { listCaseStudies, ensureSeedCaseStudies } from "@server/services/caseStudyService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await ensureSeedCaseStudies();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const persona = searchParams.get("persona") ?? undefined;
    const system = searchParams.get("system") ?? undefined;
    const preview = searchParams.get("preview") === "1";
    const statesRaw = searchParams.get("states");
    const states = statesRaw
      ? statesRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined;

    const rows = await listCaseStudies({
      search,
      persona,
      system,
      includeNonPublished: preview,
      states,
    });

    const featured = rows.filter((row) => row.featured).slice(0, 3);
    return NextResponse.json({ caseStudies: rows, featured });
  } catch (error) {
    console.error("GET /api/case-studies error:", error);
    return NextResponse.json({ error: "Failed to list case studies" }, { status: 500 });
  }
}
