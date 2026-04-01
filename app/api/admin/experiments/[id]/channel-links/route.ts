import { NextRequest, NextResponse } from "next/server";
import { canAccessExperimentationEngine, getSessionUser } from "@/lib/auth-helpers";
import { createAeeChannelLink, listAeeChannelLinksForExperiment } from "@server/services/experimentation/aeeChannelLinkService";
import { getAeeExperimentById } from "@server/services/experimentation/aeeExperimentService";

export const dynamic = "force-dynamic";

const CHANNEL_TYPES = ["web", "google_ads", "meta", "email", "social_organic", "other"] as const;

/** GET /api/admin/experiments/[id]/channel-links */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const experimentId = Number.parseInt(idStr, 10);
  if (!Number.isFinite(experimentId)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const workspaceKey = searchParams.get("workspace") ?? "ascendra_main";
  const detail = await getAeeExperimentById(experimentId, workspaceKey);
  if (!detail) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const links = await listAeeChannelLinksForExperiment(experimentId);
  return NextResponse.json({ links });
}

/** POST /api/admin/experiments/[id]/channel-links */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const experimentId = Number.parseInt(idStr, 10);
  if (!Number.isFinite(experimentId)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const workspaceKey = searchParams.get("workspace") ?? "ascendra_main";
  const detail = await getAeeExperimentById(experimentId, workspaceKey);
  if (!detail) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const user = await getSessionUser(req);
  const body = await req.json().catch(() => ({}));
  const channelType = typeof body.channelType === "string" ? body.channelType.trim() : "";
  if (!CHANNEL_TYPES.includes(channelType as (typeof CHANNEL_TYPES)[number])) {
    return NextResponse.json(
      { message: `channelType must be one of: ${CHANNEL_TYPES.join(", ")}` },
      { status: 400 },
    );
  }
  const variantId = body.variantId != null ? Number.parseInt(String(body.variantId), 10) : null;
  if (variantId != null && !detail.variants.some((v) => v.id === variantId)) {
    return NextResponse.json({ message: "Invalid variantId" }, { status: 400 });
  }
  const ppcCampaignId = body.ppcCampaignId != null ? Number.parseInt(String(body.ppcCampaignId), 10) : null;
  const commCampaignId = body.commCampaignId != null ? Number.parseInt(String(body.commCampaignId), 10) : null;

  if ((channelType === "google_ads" || channelType === "meta") && !Number.isFinite(ppcCampaignId as number)) {
    return NextResponse.json({ message: "ppcCampaignId required for google_ads / meta" }, { status: 400 });
  }

  const created = await createAeeChannelLink({
    experimentId,
    variantId: Number.isFinite(variantId as number) ? variantId : null,
    channelType,
    landingPath: typeof body.landingPath === "string" ? body.landingPath : null,
    ppcCampaignId: Number.isFinite(ppcCampaignId as number) ? ppcCampaignId : null,
    commCampaignId: Number.isFinite(commCampaignId as number) ? commCampaignId : null,
    utmSnapshotJson:
      body.utmSnapshotJson && typeof body.utmSnapshotJson === "object" ? (body.utmSnapshotJson as Record<string, string>) : {},
    notes: typeof body.notes === "string" ? body.notes : null,
    actorUserId: user?.id ?? null,
  });
  return NextResponse.json(created);
}
