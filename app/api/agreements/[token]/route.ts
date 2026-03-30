import { NextRequest, NextResponse } from "next/server";
import { getClientServiceAgreementByToken } from "@server/services/serviceAgreementService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public: agreement preview for signing (no auth). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = (await params).token?.trim();
    if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const bundle = await getClientServiceAgreementByToken(token);
    if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { agreement, milestones } = bundle;
    return NextResponse.json({
      publicToken: agreement.publicToken,
      status: agreement.status,
      clientName: agreement.clientName,
      htmlBody: agreement.htmlBody,
      milestones: milestones.map((m) => ({
        id: m.id,
        label: m.label,
        amountCents: m.amountCents,
        status: m.status,
      })),
      signedAt: agreement.signedAt?.toISOString() ?? null,
      signerLegalName: agreement.signerLegalName,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
