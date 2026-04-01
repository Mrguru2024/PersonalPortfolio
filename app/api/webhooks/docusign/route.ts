import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyDocuSignEnvelopeStatus } from "@server/services/serviceAgreementService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verifyConnectSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const hmac = createHmac("sha256", secret);
  hmac.update(Buffer.from(rawBody, "utf8"));
  const digest = hmac.digest("base64");
  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(digest));
  } catch {
    return false;
  }
}

function parseEnvelopeFromConnectBody(raw: string): { envelopeId: string; status: string } | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      const data = j.data as Record<string, unknown> | undefined;
      const summary = data?.envelopeSummary as Record<string, unknown> | undefined;
      const envId =
        (typeof data?.envelopeId === "string" ? data.envelopeId : null) ||
        (typeof summary?.envelopeId === "string" ? summary.envelopeId : null) ||
        (typeof j.envelopeId === "string" ? j.envelopeId : null);
      let status = typeof summary?.status === "string" ? summary.status : "";
      const event = String(j.event ?? "").toLowerCase();
      if (!status) {
        if (event.includes("completed")) status = "completed";
        else if (event.includes("declined")) status = "declined";
        else if (event.includes("voided")) status = "voided";
        else if (event.includes("sent")) status = "sent";
      }
      if (envId && status) return { envelopeId: envId, status };
    } catch {
      /* fall through */
    }
  }
  const idMatch = trimmed.match(/<EnvelopeId>([^<]+)<\/EnvelopeId>/i);
  const stMatch = trimmed.match(/<Status>([^<]+)<\/Status>/i);
  if (idMatch?.[1] && stMatch?.[1]) {
    return { envelopeId: idMatch[1].trim(), status: stMatch[1].trim() };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.DOCUSIGN_CONNECT_HMAC_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "DOCUSIGN_CONNECT_HMAC_SECRET not configured" }, { status: 503 });
  }
  const raw = await req.text();
  const sig =
    req.headers.get("x-docusign-signature-1") ||
    req.headers.get("X-DocuSign-Signature-1");
  if (!verifyConnectSignature(raw, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  try {
    const parsed = parseEnvelopeFromConnectBody(raw);
    if (!parsed) {
      return NextResponse.json({ received: true, ignored: true });
    }
    await applyDocuSignEnvelopeStatus(parsed.envelopeId, parsed.status);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[docusign webhook]", e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}
