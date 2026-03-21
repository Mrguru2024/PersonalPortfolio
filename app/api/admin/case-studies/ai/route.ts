import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import { runCaseStudyAiAction } from "@server/services/caseStudyService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  action: z.enum([
    "generate_draft",
    "improve_section",
    "rewrite_sales",
    "generate_social",
    "generate_email",
    "generate_proposal",
    "generate_formats",
  ]),
  title: z.string().min(1),
  summary: z.string().optional(),
  persona: z.string().optional(),
  system: z.string().optional(),
  sectionKey: z
    .enum([
      "hero",
      "overview",
      "problem",
      "diagnosis",
      "solution",
      "results",
      "visualProof",
      "takeaways",
      "cta",
    ])
    .optional(),
  sectionContent: z.string().optional(),
  sections: z.record(z.string(), z.unknown()).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const output = runCaseStudyAiAction(parsed.data);
    return NextResponse.json({ output });
  } catch (error) {
    console.error("POST /api/admin/case-studies/ai error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
