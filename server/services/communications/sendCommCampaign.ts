import { buildBlockIdResolverForLinks } from "@/lib/commEmailBlocks";
import {
  applyEmailMergeTags,
  mergeFieldsFromCrmContact,
} from "@/lib/emailMergeTags";
import { resolveRelativeUrlsForEmail } from "@/lib/resolveEmailAssetUrls";
import { storage } from "@server/storage";
import type { CommEmailDesign } from "@shared/communicationsSchema";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { wrapEmailHtmlForSend } from "./wrapEmailHtml";
import { sendBrevoTransactional } from "./brevoTransactional";
import { resolveCommAudience } from "./resolveAudience";
import { buildCommSendTrackingEmailId, signCommUnsubscribeToken } from "./trackingSideEffects";
export function commSegmentHasExplicitConstraint(f: CommSegmentFilters): boolean {
  if (f.contactIds && f.contactIds.length > 0) return true;
  if (f.type || f.status || f.intentLevel || f.source || f.lifecycleStage) return true;
  if (f.tags && f.tags.length > 0) return true;
  if (f.noContactSinceDays != null) return true;
  if (f.hasOpenTasks === true) return true;
  if (f.pipelineStage) return true;
  if (f.hasResearch === true || f.hasResearch === false) return true;
  if (f.utmSource || f.utmMedium || f.utmCampaign) return true;
  if (f.personaId) return true;
  if (f.bookedCall === true || f.bookedCall === false) return true;
  if (f.serviceInterestContains?.trim()) return true;
  return false;
}

/** Stable A/B assignment per contact + campaign (deterministic). */
export function pickCommAbVariant(contactId: number, campaignId: number, variantBPercent: number): "a" | "b" {
  const p = Math.max(0, Math.min(100, variantBPercent));
  const n = Math.abs((contactId * 7919 + campaignId * 104729) % 100);
  return n < p ? "b" : "a";
}

function publicBaseUrl(reqOrigin?: string): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    reqOrigin?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

/**
 * Executes a send: resolves audience, creates per-recipient rows, sends via Brevo, logs CRM activity + delivered events.
 */
export async function executeCommCampaignSend(input: {
  campaignId: number;
  reqOrigin?: string;
  createdByUserId?: number | null;
}): Promise<{ ok: true; sent: number; failed: number } | { ok: false; error: string }> {
  const campaign = await storage.getCommCampaignById(input.campaignId);
  if (!campaign) return { ok: false, error: "Campaign not found" };
  if (campaign.status === "sending") return { ok: false, error: "Campaign is already sending" };

  const design = await storage.getCommEmailDesignById(campaign.emailDesignId);
  if (!design) return { ok: false, error: "Email design not found" };

  const variantDesign =
    campaign.abTestEnabled && campaign.variantEmailDesignId ?
      await storage.getCommEmailDesignById(campaign.variantEmailDesignId)
    : undefined;
  if (campaign.abTestEnabled && campaign.variantEmailDesignId && !variantDesign) {
    return { ok: false, error: "A/B test is enabled but the variant email design was not found." };
  }

  const priorSends = await storage.getCommCampaignSendsByCampaignId(input.campaignId);
  if (priorSends.length > 0) {
    return {
      ok: false,
      error: "This campaign was already executed. Duplicate the campaign in the UI (future) or create a new campaign record to send again.",
    };
  }

  const audience = await resolveCommAudience(storage, campaign.segmentFilters);
  if (audience.length === 0) return { ok: false, error: "No recipients match this audience" };
  if (!commSegmentHasExplicitConstraint(campaign.segmentFilters)) {
    return {
      ok: false,
      error:
        "Audience is too broad: add at least one segment filter (tags, status, contact IDs, UTM, persona, etc.) before sending.",
    };
  }

  const baseUrl = publicBaseUrl(input.reqOrigin);
  await storage.updateCommCampaign(input.campaignId, { status: "sending" });

  let sent = 0;
  let failed = 0;

  for (const contact of audience) {
    const email = contact.email?.trim().toLowerCase();
    if (!email) {
      failed += 1;
      continue;
    }

    const abVariant: "a" | "b" | undefined =
      campaign.abTestEnabled && variantDesign ?
        pickCommAbVariant(contact.id, campaign.id, campaign.abVariantBPercent ?? 50)
      : undefined;
    const designForSend: CommEmailDesign =
      abVariant === "b" && variantDesign ? variantDesign : design;

    const sendRow = await storage.createCommCampaignSend({
      campaignId: campaign.id,
      contactId: contact.id,
      recipientEmail: email,
      status: "pending",
      abVariant,
    });

    const trackingId = buildCommSendTrackingEmailId(sendRow.id);
    const unsubUrl = `${baseUrl}/api/track/email/unsubscribe?token=${encodeURIComponent(signCommUnsubscribeToken(contact.id, campaign.id))}`;

    const resolveBlockIdForLinkIndex = buildBlockIdResolverForLinks(designForSend.blocksJson as unknown);

    const mergeFields = mergeFieldsFromCrmContact(email, {
      firstName: contact.firstName,
      name: contact.name,
      company: contact.company,
    });
    const mergedSubject = applyEmailMergeTags(designForSend.subject, mergeFields, { htmlEscape: false });
    const mergedHtmlRaw = applyEmailMergeTags(designForSend.htmlContent, mergeFields, { htmlEscape: true });
    const mergedHtml = resolveRelativeUrlsForEmail(mergedHtmlRaw, baseUrl);
    const mergedPlain = designForSend.plainText
      ? applyEmailMergeTags(designForSend.plainText, mergeFields, { htmlEscape: false })
      : undefined;

    const bodyHtml = wrapEmailHtmlForSend({
      html: mergedHtml,
      baseUrl,
      previewText: designForSend.previewText,
      leadId: contact.id,
      trackingEmailId: trackingId,
      unsubscribeUrl: unsubUrl,
      resolveBlockIdForLinkIndex,
    });

    const utm =
      campaign.utmSource || campaign.utmMedium || campaign.utmCampaign
        ? `utm_source=${encodeURIComponent(campaign.utmSource || "")}&utm_medium=${encodeURIComponent(campaign.utmMedium || "")}&utm_campaign=${encodeURIComponent(campaign.utmCampaign || "")}`
        : "";
    const _utmNote = utm; // reserved for future link append to landing CTA

    const result = await sendBrevoTransactional({
      to: email,
      subject: mergedSubject,
      htmlContent: bodyHtml,
      textContent: mergedPlain,
      senderName: designForSend.senderName,
    });

    if (result.ok) {
      await storage.updateCommCampaignSend(sendRow.id, {
        status: "sent",
        sentAt: new Date(),
        brevoMessageId: result.messageId,
      });
      await storage.createCommunicationEvent({
        leadId: contact.id,
        eventType: "delivered",
        emailId: trackingId,
        metadata: {
          subject: mergedSubject,
          commCampaignId: campaign.id,
          commCampaignName: campaign.name,
          commDesignId: designForSend.id,
          ...(abVariant !== undefined ? { abVariant } : {}),
        },
      });
      await storage.createCrmActivityLog({
        contactId: contact.id,
        type: "comm_campaign_sent",
        title: `Email sent: ${campaign.name}`,
        content: mergedSubject,
        metadata: {
          commCampaignId: campaign.id,
          commDesignId: designForSend.id,
          commSendId: sendRow.id,
          ...(abVariant !== undefined ? { abVariant } : {}),
        },
        createdByUserId: input.createdByUserId ?? undefined,
      });
      sent += 1;
    } else {
      await storage.updateCommCampaignSend(sendRow.id, {
        status: "failed",
        errorMessage: result.error,
      });
      failed += 1;
    }
  }

  await storage.updateCommCampaign(input.campaignId, {
    status: failed === audience.length ? "failed" : "sent",
    sentAt: new Date(),
    totalRecipients: audience.length,
    sentCount: sent,
    failedCount: failed,
    updatedAt: new Date(),
  });

  return { ok: true, sent, failed };
}
