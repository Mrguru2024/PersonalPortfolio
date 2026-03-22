import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { listAuditRuns, executeAuditRun } from "@server/services/internalStudio/auditService";
import { PublicHttpsOriginError, assertPublicHttpsOriginForAudit } from "@/lib/internal-audit/publicHttpsOrigin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  projectKey: z.string().min(1).max(120).optional(),
  label: z.string().max(200).optional(),
  /** https URL or hostname of a client site to crawl (optional). Omit to audit this Ascendra deployment (repo + DB). */
  targetSiteUrl: z.string().max(2048).optional(),
  execute: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const runs = await listAuditRuns({
      projectKey: searchParams.get("projectKey") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: parseInt(searchParams.get("limit") ?? "40", 10) || 40,
    });
    return NextResponse.json({ runs });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
    }
    if (!parsed.data.execute) {
      return NextResponse.json({ error: "Run audits with execute: true (default)." }, { status: 400 });
    }

    let targetNormalized: string | null = null;
    const rawTarget = parsed.data.targetSiteUrl?.trim();
    if (rawTarget) {
      try {
        targetNormalized = assertPublicHttpsOriginForAudit(rawTarget);
      } catch (e) {
        if (e instanceof PublicHttpsOriginError) {
          return NextResponse.json({ error: e.message }, { status: 400 });
        }
        throw e;
      }
    }

    const detail = await executeAuditRun({
      projectKey: parsed.data.projectKey ?? "ascendra_main",
      label: parsed.data.label,
      triggeredByUserId: user?.id ?? null,
      targetSiteUrl: targetNormalized,
    });
    return NextResponse.json({ detail });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
