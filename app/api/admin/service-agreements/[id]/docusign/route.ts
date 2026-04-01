import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { sendAgreementViaDocuSign } from "@server/services/serviceAgreementService";

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
    const result = await sendAgreementViaDocuSign(id);
    if (!result.ok) {
      const status =
        result.error === "docusign_not_configured" ? 503
        : result.error === "agreement_not_found" ? 404
        : result.error === "envelope_exists" ? 409
        : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ envelopeId: result.envelopeId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
