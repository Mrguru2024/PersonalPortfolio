import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  computeMultiProjectWatchReport,
  computeWatchReportSummary,
  createWatchReportRow,
  getWatchTargetById,
  listWatchReportsForAdmin,
  materializeWatchTargetRow,
  normalizePathPattern,
} from "@server/services/behavior/behaviorWatchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createBody = z
  .object({
    title: z.string().min(1).max(512),
    targetId: z.number().int().positive().nullable().optional(),
    targetIds: z.array(z.number().int().positive()).max(30).optional(),
    pathPattern: z.string().min(1).max(2048).optional(),
    periodStart: z.string().min(4),
    periodEnd: z.string().min(4),
  })
  .superRefine((val, ctx) => {
    const multi = val.targetIds && val.targetIds.length > 0;
    if (multi) return;
    if (val.targetId != null) return;
    if (val.pathPattern?.trim()) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide targetIds (multi), targetId, or pathPattern",
    });
  });

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 50));
  const reports = await listWatchReportsForAdmin(limit);
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const raw = await req.json().catch(() => null);
  const parsed = createBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  const periodStart = new Date(b.periodStart);
  const periodEnd = new Date(b.periodEnd);
  if (periodEnd <= periodStart) {
    return NextResponse.json({ error: "periodEnd must be after periodStart" }, { status: 400 });
  }

  if (b.targetIds && b.targetIds.length > 0) {
    const summaryJson = await computeMultiProjectWatchReport({
      targetIds: b.targetIds,
      periodStart,
      periodEnd,
    });
    const report = await createWatchReportRow({
      targetId: null,
      title: b.title,
      periodStart,
      periodEnd,
      summaryJson,
    });
    return NextResponse.json({ report });
  }

  let pathPattern = "/";
  let targetId: number | null = b.targetId ?? null;
  if (targetId != null) {
    const target = await getWatchTargetById(targetId);
    if (!target) return NextResponse.json({ error: "Target not found" }, { status: 404 });
    const mat = await materializeWatchTargetRow(target);
    pathPattern = mat.pathPattern;
  } else if (b.pathPattern) {
    pathPattern = normalizePathPattern(b.pathPattern);
  }

  const summaryJson = await computeWatchReportSummary({ pathPattern, periodStart, periodEnd });
  const report = await createWatchReportRow({
    targetId,
    title: b.title,
    periodStart,
    periodEnd,
    summaryJson,
  });
  return NextResponse.json({ report });
}
