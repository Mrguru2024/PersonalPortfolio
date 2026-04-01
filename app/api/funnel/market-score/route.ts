import { NextRequest, NextResponse } from "next/server";
import { marketScoreFunnelBodySchema } from "@/lib/market-score/requestSchema";
import { processMarketScoreSubmission } from "@server/services/marketScoreFunnelService";
import { getPublicSiteUrlFromRequest } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function clientIp(req: NextRequest): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

/** Public Market Score funnel — CRM, AMIE preview, Brevo + nurture queue. */
export async function POST(req: NextRequest) {
  try {
    const parsed = marketScoreFunnelBodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const origin = getPublicSiteUrlFromRequest(req);
    const result = await processMarketScoreSubmission(parsed.data, {
      siteOrigin: origin,
      clientIp: clientIp(req),
    });

    if (!result.ok) {
      if (result.code === "spam") {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      preview: result.preview,
      emailSent: result.emailSent,
      ...(result.emailError ? { emailError: result.emailError } : {}),
    });
  } catch (e) {
    console.error("POST /api/funnel/market-score:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
