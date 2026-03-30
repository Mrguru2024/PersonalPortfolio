import { NextRequest, NextResponse } from "next/server";
import { signClientServiceAgreement } from "@server/services/serviceAgreementService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const token = (await params).token?.trim();
    if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const legalName = String(body.legalName ?? "");
    const acceptTerms = Boolean(body.acceptTerms);
    const acceptEngagement = Boolean(body.acceptEngagement);
    const signatureImageBase64 =
      typeof body.signatureImageBase64 === "string" ? body.signatureImageBase64 : null;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    const result = await signClientServiceAgreement(token, {
      legalName,
      acceptTerms,
      acceptEngagement,
      signatureImageBase64,
      requestIp: ip,
      userAgent,
    });

    if (!result.ok) {
      const map: Record<string, number> = {
        not_found: 404,
        already_signed: 409,
        cancelled: 410,
        invalid_name: 400,
        consent_required: 400,
      };
      return NextResponse.json({ error: result.error }, { status: map[result.error] ?? 400 });
    }
    return NextResponse.json({ ok: true, auditDigest: result.auditDigest });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
