import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  listCalendarEntries,
  createCalendarEntry,
  getCalendarLinkedDocumentMeta,
} from "@server/services/internalStudio/calendarService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  documentId: z.number().int().optional().nullable(),
  title: z.string().min(1).max(500),
  scheduledAt: z.string().min(1),
  endAt: z.string().optional().nullable(),
  timezone: z.string().optional(),
  calendarStatus: z.string().optional(),
  platformTargets: z.array(z.string()).optional(),
  personaTags: z.array(z.string()).optional(),
  ctaObjective: z.string().optional().nullable(),
  funnelStage: z.string().optional().nullable(),
  campaignId: z.number().int().optional().nullable(),
  projectKey: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const entries = await listCalendarEntries({
      projectKey: searchParams.get("projectKey") ?? undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      campaignId: searchParams.get("campaignId")
        ? parseInt(searchParams.get("campaignId")!, 10)
        : undefined,
    });
    const docIds = entries.map((e) => e.documentId).filter((id): id is number => id != null && id > 0);
    const docMeta = await getCalendarLinkedDocumentMeta(docIds);
    const enriched = entries.map((e) => {
      const m = e.documentId ? docMeta.get(e.documentId) : undefined;
      return {
        ...e,
        documentApprovalStatus: m?.approvalStatus ?? null,
        documentWorkflowStatus: m?.workflowStatus ?? null,
      };
    });
    return NextResponse.json({ entries: enriched });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const at = new Date(parsed.data.scheduledAt);
    if (Number.isNaN(at.getTime())) {
      return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
    }
    const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;
    if (endAt && Number.isNaN(endAt.getTime())) {
      return NextResponse.json({ error: "Invalid endAt" }, { status: 400 });
    }
    const row = await createCalendarEntry({
      documentId: parsed.data.documentId ?? null,
      title: parsed.data.title,
      scheduledAt: at,
      endAt,
      timezone: parsed.data.timezone ?? "UTC",
      calendarStatus: parsed.data.calendarStatus ?? "draft",
      platformTargets: parsed.data.platformTargets ?? [],
      personaTags: parsed.data.personaTags ?? [],
      ctaObjective: parsed.data.ctaObjective ?? null,
      funnelStage: parsed.data.funnelStage ?? null,
      campaignId: parsed.data.campaignId ?? null,
      projectKey: parsed.data.projectKey ?? "ascendra_main",
    });
    return NextResponse.json({ entry: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
