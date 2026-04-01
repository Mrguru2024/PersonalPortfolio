import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth-helpers";
import {
  createWatchTarget,
  listWatchTargetsForAdmin,
} from "@server/services/behavior/behaviorWatchService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createBody = z
  .object({
    name: z.string().min(1).max(256),
    scopeType: z.enum(["path_prefix", "full_url", "aos_agency_project"]).optional(),
    pathPattern: z.string().max(2048).optional(),
    fullUrlPrefix: z.string().max(2048).nullable().optional(),
    aosAgencyProjectId: z.number().int().positive().nullable().optional(),
    metadataJson: z.record(z.unknown()).nullable().optional(),
    businessId: z.string().max(128).nullable().optional(),
    active: z.boolean().optional(),
    recordReplay: z.boolean().optional(),
    recordHeatmap: z.boolean().optional(),
    maxSessionRecordingMinutes: z.number().int().min(1).max(240).nullable().optional(),
    collectFrom: z.string().min(4).nullable().optional(),
    collectUntil: z.string().min(4).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    const scope = val.scopeType ?? "path_prefix";
    if (scope === "path_prefix" && !(val.pathPattern?.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pathPattern is required for path_prefix scope", path: ["pathPattern"] });
    }
    if (scope === "full_url" && !(val.fullUrlPrefix?.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "fullUrlPrefix is required for full_url scope", path: ["fullUrlPrefix"] });
    }
    if (scope === "aos_agency_project" && (val.aosAgencyProjectId == null || val.aosAgencyProjectId < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "aosAgencyProjectId is required for aos_agency_project scope",
        path: ["aosAgencyProjectId"],
      });
    }
  });

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const businessId = req.nextUrl.searchParams.get("businessId")?.trim() || undefined;
  const rows = await listWatchTargetsForAdmin(businessId);
  return NextResponse.json({ targets: rows });
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
  try {
    const row = await createWatchTarget({
      name: b.name,
      scopeType: b.scopeType,
      pathPattern: b.pathPattern?.trim() || "/",
      fullUrlPrefix: b.fullUrlPrefix ?? null,
      aosAgencyProjectId: b.aosAgencyProjectId ?? null,
      metadataJson: b.metadataJson ?? null,
      businessId: b.businessId ?? null,
      active: b.active,
      recordReplay: b.recordReplay,
      recordHeatmap: b.recordHeatmap,
      maxSessionRecordingMinutes: b.maxSessionRecordingMinutes ?? null,
      collectFrom: b.collectFrom?.trim() ? new Date(b.collectFrom) : null,
      collectUntil: b.collectUntil?.trim() ? new Date(b.collectUntil) : null,
    });
    return NextResponse.json({ target: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not create watch target";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
