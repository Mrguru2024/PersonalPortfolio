import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { listAuditRuns, executeAuditRun } from "@server/services/internalStudio/auditService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  projectKey: z.string().min(1).max(120).optional(),
  label: z.string().max(200).optional(),
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
    const detail = await executeAuditRun({
      projectKey: parsed.data.projectKey ?? "ascendra_main",
      label: parsed.data.label,
      triggeredByUserId: user?.id ?? null,
    });
    return NextResponse.json({ detail });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
