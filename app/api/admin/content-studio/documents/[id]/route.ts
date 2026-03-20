import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { getDocument, updateDocument, listEditHistory } from "@server/services/internalStudio/cmsService";
import { shouldAutoRunContentInsightOnSave } from "@server/services/growthIntelligence/growthIntelligenceConfig";
import { triggerContentInsightAsync } from "@server/services/growthIntelligence/automationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
    triggerContentInsight: z.boolean().optional(),
    title: z.string().min(1).max(500).optional(),
    bodyHtml: z.string().optional(),
    bodyMarkdown: z.string().nullable().optional(),
    excerpt: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    personaTags: z.array(z.string()).optional(),
    funnelStage: z.string().nullable().optional(),
    offerSlug: z.string().nullable().optional(),
    leadMagnetSlug: z.string().nullable().optional(),
    campaignId: z.number().int().nullable().optional(),
    platformTargets: z.array(z.string()).optional(),
    workflowStatus: z.string().optional(),
    visibility: z.string().optional(),
    approvalStatus: z.string().optional(),
    scheduledPublishAt: z.string().nullable().optional(),
    contentType: z.string().optional(),
  });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;
    const docId = parseInt(id, 10);
    if (Number.isNaN(docId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const doc = await getDocument(docId);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const history = await listEditHistory(docId);
    return NextResponse.json({ document: doc, history });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const { id } = await params;
    const docId = parseInt(id, 10);
    if (Number.isNaN(docId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const { triggerContentInsight, ...rest } = parsed.data;
    const patch = { ...rest } as Record<string, unknown>;
    if (parsed.data.scheduledPublishAt !== undefined) {
      patch.scheduledPublishAt = parsed.data.scheduledPublishAt
        ? new Date(parsed.data.scheduledPublishAt)
        : null;
    }
    const row = await updateDocument(docId, patch as never, user?.id ?? null);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (triggerContentInsight === true || shouldAutoRunContentInsightOnSave()) {
      triggerContentInsightAsync({
        documentId: docId,
        trigger: "on_save",
        userId: user?.id ?? null,
      });
    }
    return NextResponse.json({ document: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
