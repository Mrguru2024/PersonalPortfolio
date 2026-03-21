import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { createCaseStudy, ensureSeedCaseStudies, listCaseStudies } from "@server/services/caseStudyService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().min(5),
  slug: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  summary: z.string().optional().default(""),
  persona: z.string().optional().default("operators"),
  recommendedSystem: z.string().optional().default("revenue_system"),
  publishState: z.string().optional().default("draft"),
  featured: z.boolean().optional().default(false),
  sections: z.record(z.string(), z.unknown()).optional(),
  blocks: z.array(z.record(z.string(), z.unknown())).optional(),
  ctaLabel: z.string().optional().nullable(),
  ctaHref: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  noIndex: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await ensureSeedCaseStudies();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const persona = searchParams.get("persona") ?? undefined;
    const system = searchParams.get("system") ?? undefined;
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
      states,
      includeNonPublished: true,
    });
    return NextResponse.json({ caseStudies: rows });
  } catch (error) {
    console.error("GET /api/admin/case-studies error:", error);
    return NextResponse.json({ error: "Failed to list case studies" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const row = await createCaseStudy({
      ...parsed.data,
      createdByUserId: user?.id ?? null,
    });
    return NextResponse.json({ caseStudy: row });
  } catch (error) {
    console.error("POST /api/admin/case-studies error:", error);
    return NextResponse.json({ error: "Failed to create case study" }, { status: 500 });
  }
}
