import type { IStorage } from "@server/storage";
import type { PpcLeadQuality } from "@shared/paidGrowthSchema";

/**
 * When a lead crosses into verified_qualified, queue a billable event (pending) for performance billing workflows.
 * Idempotent per contact + event kind while status stays pending.
 */
export async function maybeQueueBillableEventForVerifiedLead(
  storage: IStorage,
  before: PpcLeadQuality | undefined,
  after: PpcLeadQuality,
  actorUserId: number | null,
): Promise<void> {
  if (after.verificationStatus !== "verified_qualified") return;
  if (before?.verificationStatus === "verified_qualified") return;
  if (after.spamFlag === true || after.leadValid === false) return;

  const dup = await storage.findPendingPpcBillableEvent(after.crmContactId, "verified_lead");
  if (dup) return;

  await storage.createPpcBillableEvent({
    workspaceKey: "ascendra_main",
    crmContactId: after.crmContactId,
    ppcCampaignId: after.ppcCampaignId ?? null,
    attributionSessionId: after.attributionSessionId ?? null,
    eventKind: "verified_lead",
    status: "pending",
    metadataJson: { source: "verification_queue" },
    createdByUserId: actorUserId ?? undefined,
  });
}
