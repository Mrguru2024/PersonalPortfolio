import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { runAutomationJob } from "@server/services/growthIntelligence/automationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  jobType: z.enum([
    "content_insight_save",
    "content_insight_schedule",
    "audit_recommendation_engine",
    "weekly_research_digest",
    "editorial_gap_detection",
    "stale_content_detection",
    "headline_hook_variants",
    "repurposing_suggestions",
    "stale_followup_detection",
  ]),
  projectKey: z.string().default("ascendra_main"),
  documentId: z.number().int().optional(),
  calendarEntryId: z.number().int().optional(),
  payload: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const out = await runAutomationJob(parsed.data.jobType, {
      projectKey: parsed.data.projectKey,
      documentId: parsed.data.documentId,
      calendarEntryId: parsed.data.calendarEntryId,
      userId: user?.id ?? null,
      payload: parsed.data.payload,
    });
    return NextResponse.json(out);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
