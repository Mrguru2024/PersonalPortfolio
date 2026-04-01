/**
 * AFN → CRM engagement bridge (Phase 11).
 * Merges into crm_contacts.custom_fields when user email matches an existing contact — no duplicate CRM rows.
 */
import { storage } from "@server/storage";

export type AfnEngagementSnapshot = {
  userId: number;
  onboardingComplete: boolean | null;
  profileCompletionApprox: number | null;
  activationScore: number | null;
  inviteLikelihood: number | null;
  trustScore?: number | null;
  contributionScore?: number | null;
  engagementStage?: string | null;
  communityMaturityLevel?: string | null;
  timelineLiveEffective?: string | null;
  updatedAt: string;
};

export async function syncAfnEngagementToCrmIfLinked(snapshot: AfnEngagementSnapshot): Promise<void> {
  const user = await storage.getUser(snapshot.userId);
  const email = user?.email?.trim();
  if (!email) return;

  const matches = await storage.getCrmContactsByNormalizedEmails([email]);
  if (matches.length === 0) return;

  const contact = matches[0]!;
  const prev =
    contact.customFields && typeof contact.customFields === "object" && !Array.isArray(contact.customFields)
      ? { ...(contact.customFields as Record<string, unknown>) }
      : {};
  const next: Record<string, unknown> = {
    ...prev,
    afn_engagement: { ...snapshot },
    afn_last_sync_at: snapshot.updatedAt,
  };
  await storage.updateCrmContact(contact.id, { customFields: next });
}
