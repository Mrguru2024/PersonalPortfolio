import { buildBlockIdResolverForLinks } from "@/lib/commEmailBlocks";
import {
  applyEmailMergeTags,
  mergeFieldsFromCrmContact,
  mergeFieldsFromEmailOnly,
} from "@/lib/emailMergeTags";
import { resolveRelativeUrlsForEmail } from "@/lib/resolveEmailAssetUrls";
import { storage } from "@server/storage";
import type { CommEmailDesign } from "@shared/communicationsSchema";
import type { CommSegmentFilters } from "@shared/communicationsSchema";
import { wrapEmailHtmlForSend } from "./wrapEmailHtml";
import { sendBrevoTransactional } from "./brevoTransactional";
import { resolveCommCampaignRecipients } from "./resolveAudience";
import { fireWorkflows, buildPayloadFromContactId } from "@server/services/workflows/engine";
import {
  buildCommSendTrackingEmailId,
  signCommUnsubscribeToken,
  signCommUnsubscribeTokenExternal,
} from "./trackingSideEffects";
export function commSegmentHasExplicitConstraint(f: CommSegmentFilters): boolean {
  if (f.allCrmContacts === true) return true;
  if (f.additionalRecipientsOnly === true) {
    return (f.additionalEmails?.length ?? 0) > 0;
  }
  if (f.audienceTargeting === "selected") {
    return Array.isArray(f.contactIds) && f.contactIds.length > 0;
  }
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

function stableIdFromEmail(email: string): number {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = Math.imul(31, h) + email.charCodeAt(i) | 0;
  const n = Math.abs(h);
  return n === 0 ? 1 : n;
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

  const audience = await resolveCommCampaignRecipients(storage, campaign.segmentFilters);
  if (audience.length === 0) return { ok: false, error: "No recipients match this audience" };
  if (!commSegmentHasExplicitConstraint(campaign.segmentFilters)) {
    return {
      ok: false,
      error:
        "Audience is too broad: add at least one segment filter (tags, status, contact IDs, all CRM contacts, UTM, persona, additional emails, etc.) before sending.",
    };
  }

  const baseUrl = publicBaseUrl(input.reqOrigin);
  await storage.updateCommCampaign(input.campaignId, { status: "sending" });

  let sent = 0;
  let failed = 0;

  for (const row of audience) {
    const email =
      row.source === "crm" ? row.contact.email?.trim().toLowerCase() : row.email.trim().toLowerCase();
    if (!email) {
      failed += 1;
      continue;
    }

    const abKey = row.source === "crm" ? row.contact.id : stableIdFromEmail(email);
    const abVariant: "a" | "b" | undefined =
      campaign.abTestEnabled && variantDesign ?
        pickCommAbVariant(abKey, campaign.id, campaign.abVariantBPercent ?? 50)
      : undefined;
    const designForSend: CommEmailDesign =
      abVariant === "b" && variantDesign ? variantDesign : design;

    const sendRow = await storage.createCommCampaignSend({
      campaignId: campaign.id,
      contactId: row.source === "crm" ? row.contact.id : undefined,
      recipientEmail: email,
      status: "pending",
      abVariant,
    });

    const trackingId = buildCommSendTrackingEmailId(sendRow.id);
    const unsubToken =
      row.source === "crm" ?
        signCommUnsubscribeToken(row.contact.id, campaign.id)
      : signCommUnsubscribeTokenExternal(campaign.id, sendRow.id);
    const unsubUrl = `${baseUrl}/api/track/email/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

    const resolveBlockIdForLinkIndex = buildBlockIdResolverForLinks(designForSend.blocksJson as unknown);

    const mergeFields =
      row.source === "crm" ?
        mergeFieldsFromCrmContact(email, {
          firstName: row.contact.firstName,
          name: row.contact.name,
          company: row.contact.company,
        })
      : mergeFieldsFromEmailOnly(email);
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
      leadId: row.source === "crm" ? row.contact.id : 0,
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
      if (row.source === "crm") {
        await storage.createCommunicationEvent({
          leadId: row.contact.id,
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
          contactId: row.contact.id,
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
        const wfBase = await buildPayloadFromContactId(storage, row.contact.id).catch(() => ({
          contactId: row.contact.id,
          contact: row.contact,
        }));
        const wfPayload = {
          ...wfBase,
          journeyEvent: {
            channel: "email" as const,
            emailSource: "comm_campaign" as const,
            commCampaignName: campaign.name,
          },
        };
        fireWorkflows(storage, "contact_email_sent", wfPayload).catch(() => {});
      }
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
