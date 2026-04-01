import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, isAdmin } from "@/lib/auth-helpers";
import { insertGrowthRevenueEvent, listGrowthRevenueEvents } from "@server/services/growthEngine/growthEngineStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const postSchema = z.object({
  amountCents: z.number().int(),
  currency: z.string().max(8).optional(),
  source: z.string().max(32),
  stripeInvoiceId: z.string().max(120).optional().nullable(),
  stripePaymentId: z.string().max(120).optional().nullable(),
  crmContactId: z.number().int().positive().optional().nullable(),
  behaviorSessionKey: z.string().max(200).optional().nullable(),
  pagePath: z.string().max(2048).optional().nullable(),
  funnelSlug: z.string().max(120).optional().nullable(),
  ctaKey: z.string().max(120).optional().nullable(),
  formId: z.string().max(120).optional().nullable(),
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(120).optional().nullable(),
  note: z.string().max(4000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "60") || 60));
  const rows = await listGrowthRevenueEvents(limit);
  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }
  const user = await getSessionUser(req);
  const uid = user?.id != null ? Number(user.id) : null;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const row = await insertGrowthRevenueEvent({
    amountCents: parsed.data.amountCents,
    currency: parsed.data.currency ?? "usd",
    source: parsed.data.source,
    stripeInvoiceId: parsed.data.stripeInvoiceId ?? null,
    stripePaymentId: parsed.data.stripePaymentId ?? null,
    crmContactId: parsed.data.crmContactId ?? null,
    behaviorSessionKey: parsed.data.behaviorSessionKey ?? null,
    pagePath: parsed.data.pagePath ?? null,
    funnelSlug: parsed.data.funnelSlug ?? null,
    ctaKey: parsed.data.ctaKey ?? null,
    formId: parsed.data.formId ?? null,
    utmSource: parsed.data.utmSource ?? null,
    utmMedium: parsed.data.utmMedium ?? null,
    utmCampaign: parsed.data.utmCampaign ?? null,
    note: parsed.data.note ?? null,
    createdByUserId: Number.isFinite(uid!) ? uid! : null,
  });
  return NextResponse.json({ event: row });
}
