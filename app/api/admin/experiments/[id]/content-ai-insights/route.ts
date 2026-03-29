import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canAccessExperimentationEngine } from "@/lib/auth-helpers";
import { getAeeExperimentById } from "@server/services/experimentation/aeeExperimentService";
import { generateAeeContentExperimentInsights } from "@server/services/experimentation/aeeContentAiInsightsService";
import { recommendationsFromRollups, rollupVariantMetrics } from "@server/services/experimentation/aeeInsightEngine";
import { computeAeeExperimentScore0to100 } from "@server/services/experimentation/aeeScores";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  workspaceKey: z.string().max(128).optional(),
  goal: z.string().max(4000).optional(),
  primaryChannel: z.enum(["web", "newsletter", "social", "paid", "mixed"]).optional(),
  channelMetrics: z
    .object({
      openRate: z.number().optional(),
      clickRate: z.number().optional(),
      sendCount: z.number().int().min(0).optional(),
      notes: z.string().max(2000).optional(),
    })
    .optional(),
});

function normalizeRate(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  if (value > 1 && value <= 100) return Math.min(1, value / 100);
  if (value > 100) return 1;
  if (value < 0) return 0;
  return value;
}

/** POST — model-backed content/campaign insights from AEE rollups + admin context. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }

  const { id: idStr } = await params;
  const id = Number.parseInt(idStr, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const workspaceKey = parsed.data.workspaceKey?.trim() || "ascendra_main";

  try {
    const detail = await getAeeExperimentById(id, workspaceKey);
    if (!detail) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const rollups = await rollupVariantMetrics(id, workspaceKey);
    const recommendations = recommendationsFromRollups(rollups);
    const experimentScore = computeAeeExperimentScore0to100(rollups);
    const exp = detail.experiment;

    const cm = parsed.data.channelMetrics;
    const channelMetrics =
      cm === undefined
        ? undefined
        : {
            openRate: normalizeRate(cm.openRate),
            clickRate: normalizeRate(cm.clickRate),
            sendCount: cm.sendCount,
            notes: cm.notes?.trim() || undefined,
          };

    const result = await generateAeeContentExperimentInsights({
      experiment: {
        name: exp.name,
        key: exp.key,
        hypothesis: exp.hypothesis,
        funnelStage: exp.funnelStage,
        offerType: exp.offerType,
        status: exp.status,
        experimentTemplateKey: exp.experimentTemplateKey,
      },
      variants: detail.variants.map((v) => ({
        key: v.key,
        name: v.name,
        isControl: v.isControl,
        allocationWeight: v.allocationWeight,
      })),
      rollups,
      recommendations,
      experimentScore,
      goal: parsed.data.goal,
      primaryChannel: parsed.data.primaryChannel,
      channelMetrics,
    });

    if (!result.ok) {
      return NextResponse.json({ message: result.error }, { status: 503 });
    }

    return NextResponse.json({ insights: result.data });
  } catch (e) {
    console.error("content-ai-insights", e);
    return NextResponse.json({ message: "Failed to generate insights" }, { status: 500 });
  }
}
