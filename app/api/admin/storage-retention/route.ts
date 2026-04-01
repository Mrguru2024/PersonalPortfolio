import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  getAscendraRetentionDays,
  getAscendraRetentionPurgeGraceDays,
  listTrashedBehaviorSessions,
  listTrashedFunnelAssets,
  restoreBehaviorSessionBySessionId,
  restoreFunnelAssetById,
  runAscendraStorageRetentionSweep,
} from "@server/services/ascendraStorageRetention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const restoreBody = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("behavior_session"), sessionId: z.string().min(8).max(128) }),
  z.object({ kind: z.literal("funnel_asset"), id: z.number().int().positive() }),
]);

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const run = req.nextUrl.searchParams.get("run") === "1";
  const sweep = run ? await runAscendraStorageRetentionSweep() : null;
  const [behaviorTrash, funnelTrash] = await Promise.all([
    listTrashedBehaviorSessions(80),
    listTrashedFunnelAssets(80),
  ]);
  return NextResponse.json({
    policy: {
      retentionDays: getAscendraRetentionDays(),
      purgeGraceDays: getAscendraRetentionPurgeGraceDays(),
    },
    behaviorTrash: behaviorTrash.map((r) => ({
      ...r,
      startTime: r.startTime.toISOString(),
      softDeletedAt: r.softDeletedAt?.toISOString() ?? null,
    })),
    funnelTrash: funnelTrash.map((r) => ({
      ...r,
      softDeletedAt: r.softDeletedAt?.toISOString() ?? null,
    })),
    sweep,
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = restoreBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.kind === "behavior_session") {
    const ok = await restoreBehaviorSessionBySessionId(parsed.data.sessionId);
    if (!ok) return NextResponse.json({ error: "Not found or not in trash" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  const ok = await restoreFunnelAssetById(parsed.data.id);
  if (!ok) return NextResponse.json({ error: "Not found or not in trash" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
