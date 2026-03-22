import { signEmailTrackingPayload } from "@/lib/track-email";
import { storage } from "@server/storage";

const COMM_SEND_PREFIX = "commSend-";

export function parseCommSendTrackingEmailId(emailId: string): number | null {
  if (!emailId.startsWith(COMM_SEND_PREFIX)) return null;
  const id = Number(emailId.slice(COMM_SEND_PREFIX.length));
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function buildCommSendTrackingEmailId(sendId: number): string {
  return `${COMM_SEND_PREFIX}${sendId}`;
}

/** Unsubscribe tokens: same HMAC format, emailId `unsubcomm-{campaignId}` */
export function buildUnsubCommEmailId(campaignId: number): string {
  return `unsubcomm-${campaignId}`;
}

export function parseUnsubCommCampaignId(emailId: string): number | null {
  if (!emailId.startsWith("unsubcomm-")) return null;
  const id = Number(emailId.slice("unsubcomm-".length));
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function signCommUnsubscribeToken(leadId: number, campaignId: number): string {
  return signEmailTrackingPayload(leadId, buildUnsubCommEmailId(campaignId));
}

/**
 * After a tracked open/click, update comm_campaign_sends + aggregate campaign stats.
 */
export async function applyCommSendTrackingSideEffects(
  emailId: string,
  kind: "open" | "click",
  clickUrl?: string,
  clickBlockId?: string | null
): Promise<void> {
  const sendId = parseCommSendTrackingEmailId(emailId);
  if (sendId == null) return;
  if (kind === "open") {
    await storage.markCommCampaignSendFirstOpen(sendId);
    return;
  }
  if (clickUrl) {
    await storage.markCommCampaignSendFirstClick(sendId, clickUrl, clickBlockId);
  }
}
