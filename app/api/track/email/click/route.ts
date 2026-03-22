import { NextRequest, NextResponse } from "next/server";
import { verifyEmailTrackingToken } from "@/lib/track-email";
import { storage } from "@server/storage";
import {
  applyCommSendTrackingSideEffects,
  parseCommSendTrackingEmailId,
} from "@server/services/communications/trackingSideEffects";

export const dynamic = "force-dynamic";

/** GET /api/track/email/click?token=...&url=... — tracked redirect for email link clicks. No auth. */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const url = req.nextUrl.searchParams.get("url");
    const commBlockId = req.nextUrl.searchParams.get("block");
    const allowedHosts = [
      new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").hostname,
      "localhost",
    ];
    const destination = url ? decodeURIComponent(url) : "/";
    let targetUrl = destination;
    try {
      const u = new URL(destination);
      if (!allowedHosts.includes(u.hostname) && !u.hostname.endsWith(".mrguru.dev")) {
        targetUrl = "/";
      }
    } catch {
      targetUrl = "/";
    }

    if (token) {
      const parsed = verifyEmailTrackingToken(token);
      if (parsed) {
        const contact = await storage.getCrmContactById(parsed.leadId);
        if (contact) {
          const ua = req.headers.get("user-agent") || undefined;
          const deviceType = ua && /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
          let metadata: Record<string, unknown> = { url: targetUrl };
          if (commBlockId) metadata.commBlockId = commBlockId;
          const sendId = parseCommSendTrackingEmailId(parsed.emailId);
          if (sendId != null) {
            await applyCommSendTrackingSideEffects(parsed.emailId, "click", targetUrl, commBlockId);
            const send = await storage.getCommCampaignSendById(sendId);
            if (send) {
              const campaign = await storage.getCommCampaignById(send.campaignId);
              let designId = campaign?.emailDesignId;
              if (campaign && send.abVariant === "b" && campaign.variantEmailDesignId) {
                designId = campaign.variantEmailDesignId;
              }
              const design = campaign && designId ? await storage.getCommEmailDesignById(designId) : undefined;
              metadata = {
                ...metadata,
                commCampaignId: campaign?.id,
                commCampaignName: campaign?.name,
                subject: design?.subject,
                commSendId: send.id,
                ...(send.abVariant ? { abVariant: send.abVariant } : {}),
              };
            }
          }
          await storage.createCommunicationEvent({
            leadId: parsed.leadId,
            eventType: "click",
            emailId: parsed.emailId,
            metadata,
            ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
            userAgent: ua,
            deviceType,
          });
        }
      }
    }

    return NextResponse.redirect(targetUrl, 302);
  } catch {
    return NextResponse.redirect("/", 302);
  }
}
