import { NextRequest, NextResponse } from "next/server";
import { canAccessExperimentationEngine, getSessionUser } from "@/lib/auth-helpers";
import { listAeeExperiments, createAeeExperiment } from "@server/services/experimentation/aeeExperimentService";

export const dynamic = "force-dynamic";

/** GET /api/admin/experiments — list experiments (AEE). */
export async function GET(req: NextRequest) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const workspaceKey = searchParams.get("workspace") ?? "ascendra_main";
    const rows = await listAeeExperiments(workspaceKey);
    return NextResponse.json({ experiments: rows });
  } catch (e) {
    console.error("experiments list", e);
    return NextResponse.json({ message: "Failed to list experiments" }, { status: 500 });
  }
}

/** POST /api/admin/experiments — create experiment + variants. */
export async function POST(req: NextRequest) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  try {
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const key = typeof body.key === "string" ? body.key.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!key || !name) {
      return NextResponse.json({ message: "key and name required" }, { status: 400 });
    }
    const variants = Array.isArray(body.variants) ? body.variants : [];
    type VarIn = {
      key: string;
      name: string;
      config?: Record<string, unknown>;
      allocationWeight?: number;
      isControl?: boolean;
    };
    const normalized: VarIn[] = [];
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v || typeof v !== "object") continue;
      const o = v as Record<string, unknown>;
      const vk = typeof o.key === "string" ? o.key.trim() : "";
      const vn = typeof o.name === "string" ? o.name.trim() : "";
      if (!vk || !vn) continue;
      normalized.push({
        key: vk,
        name: vn,
        config: typeof o.config === "object" && o.config !== null ? (o.config as Record<string, unknown>) : {},
        allocationWeight: typeof o.allocationWeight === "number" ? o.allocationWeight : undefined,
        isControl: typeof o.isControl === "boolean" ? o.isControl : i === 0,
      });
    }

    const created = await createAeeExperiment({
      workspaceKey: typeof body.workspaceKey === "string" ? body.workspaceKey : undefined,
      key,
      name,
      description: typeof body.description === "string" ? body.description : null,
      hypothesis: typeof body.hypothesis === "string" ? body.hypothesis : null,
      funnelStage: typeof body.funnelStage === "string" ? body.funnelStage : null,
      primaryPersonaKey: typeof body.primaryPersonaKey === "string" ? body.primaryPersonaKey : null,
      offerType: typeof body.offerType === "string" ? body.offerType : null,
      channels: Array.isArray(body.channels) ? body.channels.filter((c: unknown) => typeof c === "string") : [],
      experimentTemplateKey: typeof body.experimentTemplateKey === "string" ? body.experimentTemplateKey : null,
      status: typeof body.status === "string" ? body.status : "draft",
      createdByUserId: user?.id ?? null,
      variants:
        normalized.length > 0
          ? normalized
          : [
              { key: "control", name: "Control", isControl: true },
              { key: "variant_a", name: "Variant A", isControl: false },
            ],
    });
    return NextResponse.json({ id: created.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ message: "Experiment key already exists" }, { status: 409 });
    }
    console.error("experiments create", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
