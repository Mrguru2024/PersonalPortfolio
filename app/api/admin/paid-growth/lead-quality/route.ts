import { NextRequest, NextResponse } from "next/server";
import { isAdmin, getSessionUser } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { maybeQueueBillableEventForVerifiedLead } from "@server/services/paid-growth/ppcBillableAfterVerification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const limit = Math.min(100, Math.max(10, Number(req.nextUrl.searchParams.get("limit")) || 40));
    const verificationStatus = req.nextUrl.searchParams.get("verificationStatus")?.trim();
    if (verificationStatus) {
      return NextResponse.json(await storage.listPpcLeadQualityByVerificationStatus(verificationStatus, limit));
    }
    return NextResponse.json(await storage.listPpcLeadQuality(limit));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const crmContactId = Number(body.crmContactId);
    if (!crmContactId) return NextResponse.json({ error: "crmContactId required" }, { status: 400 });

    const existing = await storage.getPpcLeadQualityByContact(crmContactId);
    const verificationStatus =
      typeof body.verificationStatus === "string" && body.verificationStatus.trim()
        ? body.verificationStatus.trim()
        : undefined;

    let verifiedAt: Date | undefined;
    let verifiedByUserId: number | null | undefined;
    if (
      verificationStatus?.startsWith("verified_") &&
      existing?.verificationStatus !== verificationStatus
    ) {
      verifiedAt = new Date();
      verifiedByUserId = user?.id ?? null;
    }

    let billableStatus: string | undefined =
      typeof body.billableStatus === "string" && body.billableStatus.trim()
        ? body.billableStatus.trim()
        : undefined;
    if (verificationStatus === "verified_qualified" && billableStatus === undefined) {
      billableStatus = "eligible";
    }

    const row = await storage.upsertPpcLeadQuality(crmContactId, {
      crmContactId,
      ppcCampaignId: body.ppcCampaignId != null ? Number(body.ppcCampaignId) : undefined,
      attributionSessionId:
        body.attributionSessionId != null ? Number(body.attributionSessionId) : undefined,
      leadValid: body.leadValid,
      fitScore: body.fitScore != null ? Number(body.fitScore) : undefined,
      spamFlag: body.spamFlag,
      bookedCall: body.bookedCall,
      sold: body.sold,
      verificationStatus,
      billableStatus,
      verificationNotes: typeof body.verificationNotes === "string" ? body.verificationNotes : undefined,
      ...(verifiedAt ? { verifiedAt } : {}),
      ...(verifiedByUserId !== undefined ? { verifiedByUserId } : {}),
      notes: typeof body.notes === "string" ? body.notes : undefined,
      createdBy: user?.id ?? null,
    });

    await maybeQueueBillableEventForVerifiedLead(storage, existing, row, user?.id ?? null).catch((err) =>
      console.warn("[lead-quality] billable queue:", err),
    );

    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
