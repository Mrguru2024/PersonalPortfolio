import { NextRequest, NextResponse } from "next/server";
import { storage } from "@server/storage";

export const dynamic = "force-dynamic";

/**
 * Brevo transactional webhooks (Phase 2).
 * Configure in Brevo with URL: https://your-domain.com/api/webhooks/brevo?secret=YOUR_SECRET
 * Set BREVO_WEBHOOK_SECRET in env to match `secret` query param.
 *
 * Docs: https://developers.brevo.com/docs/how-to-use-webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const expected = process.env.BREVO_WEBHOOK_SECRET?.trim();
    const q = req.nextUrl.searchParams.get("secret")?.trim();
    if (!expected || q !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const event = String(body.event ?? body.type ?? "").toLowerCase();
    const email = String(body.email ?? body["recipient"] ?? "").toLowerCase();
    const messageId = String(
      body["message-id"] ?? body.messageId ?? body.message_id ?? body["messageId"] ?? ""
    ).trim();

    if (!messageId) {
      return NextResponse.json({ ok: true, ignored: true, reason: "no_message_id" });
    }

    const send = await storage.getCommCampaignSendByBrevoMessageId(messageId);
    if (!send) {
      return NextResponse.json({ ok: true, ignored: true, reason: "send_not_found" });
    }

    const bounceLike =
      event.includes("hard") && event.includes("bounce") ? "hard"
      : event.includes("soft") && event.includes("bounce") ? "soft"
      : event.includes("spam") ? "spam"
      : event.includes("invalid") ? "invalid"
      : null;

    if (bounceLike) {
      await storage.updateCommCampaignSend(send.id, {
        bounceType: bounceLike,
        bouncedAt: new Date(),
        errorMessage: `[brevo:${event}] ${email || "unknown recipient"}`,
      });
    }

    return NextResponse.json({ ok: true, processed: !!bounceLike });
  } catch (e) {
    console.error("[brevo webhook]", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
