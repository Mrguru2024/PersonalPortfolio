import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { listDocuments, createDocument } from "@server/services/internalStudio/cmsService";
import { INTERNAL_CMS_CONTENT_TYPES } from "@/lib/content-studio/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONTENT_TYPE_ENUM = INTERNAL_CMS_CONTENT_TYPES as unknown as [string, ...string[]];

const postSchema = z.object({
  contentType: z.enum(CONTENT_TYPE_ENUM),
  title: z.string().min(1).max(500),
  bodyHtml: z.string().optional(),
  bodyMarkdown: z.string().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  personaTags: z.array(z.string()).optional(),
  funnelStage: z.string().optional().nullable(),
  offerSlug: z.string().optional().nullable(),
  leadMagnetSlug: z.string().optional().nullable(),
  campaignId: z.number().int().optional().nullable(),
  projectKey: z.string().optional(),
  platformTargets: z.array(z.string()).optional(),
  workflowStatus: z.string().optional(),
  visibility: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const docs = await listDocuments({
      projectKey: searchParams.get("projectKey") ?? undefined,
      contentType: searchParams.get("contentType") ?? undefined,
      workflowStatus: searchParams.get("workflowStatus") ?? undefined,
      campaignId: searchParams.get("campaignId")
        ? parseInt(searchParams.get("campaignId")!, 10)
        : undefined,
      search: searchParams.get("search") ?? undefined,
      limit: parseInt(searchParams.get("limit") ?? "60", 10) || 60,
    });
    return NextResponse.json({ documents: docs });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    const row = await createDocument({
      contentType: parsed.data.contentType,
      title: parsed.data.title,
      bodyHtml: parsed.data.bodyHtml ?? "",
      bodyMarkdown: parsed.data.bodyMarkdown ?? null,
      excerpt: parsed.data.excerpt ?? null,
      tags: parsed.data.tags ?? [],
      categories: parsed.data.categories ?? [],
      personaTags: parsed.data.personaTags ?? [],
      funnelStage: parsed.data.funnelStage ?? null,
      offerSlug: parsed.data.offerSlug ?? null,
      leadMagnetSlug: parsed.data.leadMagnetSlug ?? null,
      campaignId: parsed.data.campaignId ?? null,
      projectKey: parsed.data.projectKey ?? "ascendra_main",
      platformTargets: parsed.data.platformTargets ?? [],
      workflowStatus: parsed.data.workflowStatus ?? "draft",
      visibility: parsed.data.visibility ?? "internal_only",
      lastEditedByUserId: user?.id ?? null,
    });
    return NextResponse.json({ document: row });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
