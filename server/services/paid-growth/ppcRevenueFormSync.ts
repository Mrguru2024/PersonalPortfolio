/**
 * After CRM lead creation from a form — link attribution session + enqueue PPC verification when warranted.
 */
import type { IStorage } from "@server/storage";
import type { FormAttribution } from "@server/services/leadFromFormService";
import {
  resolvePpcCampaignIdFromContext,
  touchAttributionSessionFromForm,
} from "@server/services/paid-growth/attributionSessionService";

function shouldSkipVerificationReset(
  status: string | null | undefined,
): status is string {
  if (!status || status === "pending_verification") return false;
  return true;
}

export async function syncPpcRevenueLayerAfterFormLead(
  storage: IStorage,
  contactId: number,
  attribution: FormAttribution | null | undefined,
  isPaidSearch: boolean,
): Promise<void> {
  const campaigns = await storage.listPpcCampaigns();
  const utm = {
    utm_source: attribution?.utm_source,
    utm_medium: attribution?.utm_medium,
    utm_campaign: attribution?.utm_campaign,
  };

  let touchResult: Awaited<ReturnType<typeof touchAttributionSessionFromForm>> | null = null;
  if (attribution?.visitorId?.trim()) {
    touchResult = await touchAttributionSessionFromForm(storage, contactId, attribution).catch(() => null);
  }

  let campaignId = touchResult?.ppcCampaignId ?? null;
  if (campaignId == null) {
    campaignId = resolvePpcCampaignIdFromContext(campaigns, utm, attribution?.landing_page ?? null);
  }

  const shouldVerify = isPaidSearch || campaignId != null;
  if (!shouldVerify) return;

  const existing = await storage.getPpcLeadQualityByContact(contactId);
  if (shouldSkipVerificationReset(existing?.verificationStatus)) {
    if (touchResult) {
      await storage.upsertPpcLeadQuality(contactId, {
        attributionSessionId: touchResult.id,
        ...(campaignId != null ? { ppcCampaignId: campaignId } : {}),
      });
    } else if (campaignId != null) {
      await storage.upsertPpcLeadQuality(contactId, { ppcCampaignId: campaignId });
    }
    return;
  }

  await storage.upsertPpcLeadQuality(contactId, {
    ...(campaignId != null ? { ppcCampaignId: campaignId } : {}),
    ...(touchResult ? { attributionSessionId: touchResult.id } : {}),
    verificationStatus: "pending_verification",
    billableStatus: "pending",
  });
}
