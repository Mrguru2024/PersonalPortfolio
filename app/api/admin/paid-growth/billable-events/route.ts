import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/** GET /api/admin/paid-growth/billable-events — filtered billable queue (performance / hybrid invoicing). */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(10, Number(sp.get("limit")) || 60));
    const status = sp.get("status")?.trim() || undefined;
    const crmContactIdRaw = sp.get("crmContactId");
    const ppcCampaignIdRaw = sp.get("ppcCampaignId");
    const crmContactId =
      crmContactIdRaw && Number.isFinite(Number(crmContactIdRaw)) ? Number(crmContactIdRaw) : undefined;
    const ppcCampaignId =
      ppcCampaignIdRaw && Number.isFinite(Number(ppcCampaignIdRaw)) ? Number(ppcCampaignIdRaw) : undefined;

    const rows = await storage.listPpcBillableEventsAdmin({
      status,
      crmContactId,
      ppcCampaignId,
      limit,
    });

    const events = await Promise.all(
      rows.map(async (r) => ({
        ...r,
        contact: (await storage.getCrmContactById(r.crmContactId)) ?? null,
      })),
    );

    return NextResponse.json({ events });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
