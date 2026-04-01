import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { createStripeInvoiceForMilestone } from "@server/services/serviceAgreementService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const milestoneId = Number(body.milestoneId);
    if (!Number.isFinite(milestoneId)) {
      return NextResponse.json({ error: "milestoneId required" }, { status: 400 });
    }
    const result = await createStripeInvoiceForMilestone(id, milestoneId);
    if (!result.ok) {
      const status = result.error === "stripe_not_configured" ? 503 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({
      stripeInvoiceId: result.stripeInvoiceId,
      hostInvoiceUrl: result.hostInvoiceUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
