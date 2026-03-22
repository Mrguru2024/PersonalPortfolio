import { NextRequest, NextResponse } from "next/server";
import { verifyEmailTrackingToken } from "@/lib/track-email";
import { storage } from "@server/storage";
import { parseUnsubCommCampaignId } from "@server/services/communications/trackingSideEffects";

export const dynamic = "force-dynamic";

const PAGE = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#222}</style>
</head><body><h1>${title}</h1><p>${body}</p></body></html>`;

/** GET /api/track/email/unsubscribe?token=... — Ascendra communications one-click unsubscribe (sets CRM do-not-contact). */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return new NextResponse(PAGE("Unsubscribe", "Missing token."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const parsed = verifyEmailTrackingToken(token);
    if (!parsed) {
      return new NextResponse(PAGE("Unsubscribe", "This link is invalid or expired."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const campaignId = parseUnsubCommCampaignId(parsed.emailId);
    if (campaignId == null) {
      return new NextResponse(PAGE("Unsubscribe", "This link is not valid for list unsubscribe."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    const contact = await storage.getCrmContactById(parsed.leadId);
    if (!contact) {
      return new NextResponse(PAGE("Unsubscribe", "We could not find your record."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    await storage.updateCrmContact(parsed.leadId, { doNotContact: true });
    await storage.createCrmActivityLog({
      contactId: parsed.leadId,
      type: "comm_unsubscribed",
      title: "Unsubscribed from marketing email",
      content: `Campaign #${campaignId}`,
      metadata: { commCampaignId: campaignId },
    });
    return new NextResponse(
      PAGE(
        "You are unsubscribed",
        "We will not send further marketing emails to this address. If this was a mistake, contact us and we can restore your preferences."
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    console.error("unsubscribe error", e);
    return new NextResponse(PAGE("Error", "Something went wrong. Please contact support."), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
