import { NextRequest, NextResponse } from "next/server";
import { canAccessExperimentationEngine, getSessionUser } from "@/lib/auth-helpers";
import { deleteAeeChannelLink } from "@server/services/experimentation/aeeChannelLinkService";
import { getAeeExperimentById } from "@server/services/experimentation/aeeExperimentService";

export const dynamic = "force-dynamic";

/** DELETE /api/admin/experiments/[id]/channel-links/[linkId] */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; linkId: string }> }) {
  if (!(await canAccessExperimentationEngine(req))) {
    return NextResponse.json({ message: "Experiments access required" }, { status: 403 });
  }
  const { id: idStr, linkId: linkStr } = await params;
  const experimentId = Number.parseInt(idStr, 10);
  const linkId = Number.parseInt(linkStr, 10);
  if (!Number.isFinite(experimentId) || !Number.isFinite(linkId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }
  const { searchParams } = new URL(req.url);
  const workspaceKey = searchParams.get("workspace") ?? "ascendra_main";
  const detail = await getAeeExperimentById(experimentId, workspaceKey);
  if (!detail) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const user = await getSessionUser(req);
  const ok = await deleteAeeChannelLink(linkId, experimentId, user?.id ?? null);
  if (!ok) return NextResponse.json({ message: "Link not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
