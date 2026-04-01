import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/paid-growth/tracked-calls — call verification queue. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const sp = req.nextUrl.searchParams;
    const limitRaw = sp.get("limit");
    const limit = Math.min(
      200,
      Math.max(10, limitRaw != null && Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 80),
    );
    const verificationStatus = sp.get("verificationStatus")?.trim() || undefined;

    const rows = await storage.listPpcTrackedCallsAdmin({ verificationStatus, limit });

    const calls = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        contact: r.crmContactId != null ? (await storage.getCrmContactById(r.crmContactId)) ?? null : null,
      })),
    );

    return NextResponse.json({ calls });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** POST — manual log / import stub until telephony webhooks exist. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));

    const crmContactId = body.crmContactId != null ? Number(body.crmContactId) : null;
    const attributionSessionId = body.attributionSessionId != null ? Number(body.attributionSessionId) : null;
    const ppcCampaignId = body.ppcCampaignId != null ? Number(body.ppcCampaignId) : null;

    const direction = typeof body.direction === "string" && body.direction.trim() ? body.direction.trim() : "inbound";
    const callerNumber = typeof body.callerNumber === "string" ? body.callerNumber.trim() || null : null;
    const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() || null : null;

    let startedAt: Date | null = null;
    if (typeof body.startedAt === "string" && body.startedAt.trim()) {
      const d = new Date(body.startedAt);
      if (!Number.isNaN(d.getTime())) startedAt = d;
    }
    let endedAt: Date | null = null;
    if (typeof body.endedAt === "string" && body.endedAt.trim()) {
      const d = new Date(body.endedAt);
      if (!Number.isNaN(d.getTime())) endedAt = d;
    }

    const durationSeconds =
      body.durationSeconds != null && body.durationSeconds !== ""
        ? Math.max(0, Math.round(Number(body.durationSeconds)))
        : null;

    const answeredByClient =
      typeof body.answeredByClient === "boolean" ? body.answeredByClient : null;

    const disposition = typeof body.disposition === "string" ? body.disposition.trim() || null : null;
    const verificationStatus =
      typeof body.verificationStatus === "string" && body.verificationStatus.trim()
        ? body.verificationStatus.trim()
        : "pending";
    const billableStatus =
      typeof body.billableStatus === "string" && body.billableStatus.trim()
        ? body.billableStatus.trim()
        : "pending";

    const metadataJson =
      body.metadataJson && typeof body.metadataJson === "object" && !Array.isArray(body.metadataJson)
        ? (body.metadataJson as Record<string, unknown>)
        : body.internalNotes
          ? { internalNotes: String(body.internalNotes) }
          : {};

    const row = await storage.createPpcTrackedCall({
      workspaceKey: typeof body.workspaceKey === "string" ? body.workspaceKey : "ascendra_main",
      crmContactId: crmContactId && Number.isFinite(crmContactId) ? crmContactId : null,
      attributionSessionId: attributionSessionId && Number.isFinite(attributionSessionId) ? attributionSessionId : null,
      ppcCampaignId: ppcCampaignId && Number.isFinite(ppcCampaignId) ? ppcCampaignId : null,
      direction,
      callerNumber,
      trackingNumber,
      startedAt,
      endedAt,
      durationSeconds,
      answeredByClient,
      disposition,
      verificationStatus,
      billableStatus,
      metadataJson,
    });

    return NextResponse.json({
      call: {
        ...row,
        contact:
          row.crmContactId != null ? (await storage.getCrmContactById(row.crmContactId)) ?? null : null,
      },
      loggedByUserId: user?.id ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
