/**
 * Stage 3.5: Proposal prep workspace service — create/update with activity logging.
 */

import type { IStorage } from "@server/storage";
import type { InsertCrmProposalPrepWorkspace, CrmProposalPrepWorkspace } from "@shared/crmSchema";
import { logActivity } from "@server/services/crmFoundationService";

export async function createProposalPrepWorkspace(
  storage: IStorage,
  entry: InsertCrmProposalPrepWorkspace,
  opts?: { createdByUserId?: number }
): Promise<CrmProposalPrepWorkspace> {
  const workspace = await storage.createCrmProposalPrepWorkspace(entry);
  await logActivity(storage, {
    contactId: workspace.contactId,
    accountId: workspace.accountId ?? undefined,
    dealId: workspace.dealId ?? undefined,
    type: "proposal_prep_created",
    title: "Proposal prep workspace created",
    content: undefined,
    metadata: { proposalPrepWorkspaceId: workspace.id },
    createdByUserId: opts?.createdByUserId,
  });
  return workspace;
}

export async function updateProposalPrepWorkspace(
  storage: IStorage,
  id: number,
  updates: Partial<InsertCrmProposalPrepWorkspace>,
  opts?: { createdByUserId?: number }
): Promise<CrmProposalPrepWorkspace> {
  const workspace = await storage.updateCrmProposalPrepWorkspace(id, updates);
  await logActivity(storage, {
    contactId: workspace.contactId,
    accountId: workspace.accountId ?? undefined,
    dealId: workspace.dealId ?? undefined,
    type: "proposal_prep_updated",
    title: "Proposal prep workspace updated",
    metadata: { proposalPrepWorkspaceId: workspace.id },
    createdByUserId: opts?.createdByUserId,
  });
  return workspace;
}
