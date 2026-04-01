import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { storage } from "@server/storage";
import { isSmsConfigured } from "@server/services/smsService";
import { isStripeConfigured } from "@server/services/stripeInvoiceService";
import { computeRevenueOpsFinanceSnapshot } from "@server/services/revenueOpsFinanceService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const [metrics, settingsRow] = await Promise.all([
    storage.getRevenueOpsDashboardMetrics(),
    storage.getRevenueOpsSettings(),
  ]);
  const finance = await computeRevenueOpsFinanceSnapshot(settingsRow.config);
  return NextResponse.json({
    ...metrics,
    twilioSmsReady: isSmsConfigured(),
    stripeReady: isStripeConfigured(),
    stripeWebhookReady: !!process.env.STRIPE_WEBHOOK_SECRET?.trim(),
    bookingLinkSecretReady: !!process.env.REVENUE_OPS_BOOKING_LINK_SECRET?.trim(),
    finance,
  });
}
