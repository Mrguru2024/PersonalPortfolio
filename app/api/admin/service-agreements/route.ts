import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-helpers";
import {
  createClientServiceAgreement,
  listClientServiceAgreementsEnrichedForAdmin,
} from "@server/services/serviceAgreementService";
import { normalizeDocumentType } from "@shared/documentSigningEngine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const rows = await listClientServiceAgreementsEnrichedForAdmin(100);
    return NextResponse.json({ agreements: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const clientName = String(body.clientName ?? "").trim();
    const clientEmail = String(body.clientEmail ?? "").trim();
    if (!clientName || !clientEmail) {
      return NextResponse.json({ error: "clientName and clientEmail required" }, { status: 400 });
    }
    const scopeLines = String(body.scopeBullets ?? "").split("\n");
    const milestonesRaw = Array.isArray(body.milestones) ? body.milestones : [];
    const documentType = normalizeDocumentType(body.documentType);
    const milestones = milestonesRaw.map((m: unknown) => {
      const o = m as Record<string, unknown>;
      const cents =
        o.amountCents != null
          ? Math.round(Number(o.amountCents))
          : o.amountDollars != null
            ? Math.round(Number(o.amountDollars) * 100)
            : 0;
      return {
        label: String(o.label ?? "Milestone"),
        amountCents: cents,
      };
    });
    const clauseSlugs =
      Array.isArray(body.clauseSlugs) ?
        body.clauseSlugs.map((s: unknown) => String(s ?? "").trim().toLowerCase()).filter(Boolean)
      : null;
    const bundle = await createClientServiceAgreement({
      clientName,
      clientEmail,
      documentType,
      companyLegalName: body.companyLegalName != null ? String(body.companyLegalName) : null,
      scopeBullets: scopeLines,
      pricingNarrative: String(body.pricingNarrative ?? ""),
      tierHint: body.tierHint != null ? String(body.tierHint) : null,
      additionalNotes: body.additionalNotes != null ? String(body.additionalNotes) : null,
      clauseSlugs: clauseSlugs?.length ? clauseSlugs : null,
      milestones: milestones.filter((m) => m.amountCents > 0),
      markSent: body.markSent !== false,
    });
    return NextResponse.json(bundle);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
