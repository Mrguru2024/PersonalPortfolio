import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { storage } from "@server/storage";
import { logActivity } from "@server/services/crmFoundationService";
import { getMergedRevenueOpsConfig } from "@server/services/revenueOpsService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verifyContactToken(token: string): number | null {
  const secret = process.env.REVENUE_OPS_BOOKING_LINK_SECRET?.trim();
  if (!secret) return null;
  const decoded = decodeURIComponent(token);
  const dot = decoded.indexOf(".");
  if (dot < 1) return null;
  const idStr = decoded.slice(0, dot);
  const sig = decoded.slice(dot + 1);
  const id = Number(idStr);
  if (!Number.isFinite(id) || id < 1) return null;
  const expected = crypto.createHmac("sha256", secret).update(String(id)).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const token = (await params).token;
  const contactId = verifyContactToken(token);
  if (contactId != null) {
    await logActivity(storage, {
      contactId,
      type: "revenue_ops_booking_link_click",
      title: "Booking link opened",
      metadata: { via: "tracked_redirect" },
    }).catch(() => {});
  }

  const cfg = await getMergedRevenueOpsConfig(storage);
  const target =
    cfg.defaultBookingUrl?.trim() || process.env.DEFAULT_BOOKING_URL?.trim() || "";
  if (!target) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.redirect(target, 302);
}
