import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import { adminSignAgreementById } from "@server/services/serviceAgreementService";

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
    const legalName = String(body.legalName ?? "");
    const acceptTerms = Boolean(body.acceptTerms);
    const acceptEngagement = Boolean(body.acceptEngagement);
    const signatureImageBase64 =
      typeof body.signatureImageBase64 === "string" ? body.signatureImageBase64 : null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    const result = await adminSignAgreementById(id, {
      legalName,
      acceptTerms,
      acceptEngagement,
      signatureImageBase64,
      requestIp: ip,
      userAgent,
    });
    if (!result.ok) {
      const status =
        result.error === "agreement_not_found" ? 404
        : result.error === "invalid_name" ? 400
        : result.error === "consent_required" ? 400
        : 409;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, auditDigest: result.auditDigest });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
