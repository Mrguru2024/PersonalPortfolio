/**
 * Stage 3.5: Discovery workspace service — create/update with activity logging.
 */

import type { IStorage } from "@server/storage";
import type { InsertCrmDiscoveryWorkspace, CrmDiscoveryWorkspace } from "@shared/crmSchema";
import { logActivity } from "@server/services/crmFoundationService";

export async function createDiscoveryWorkspace(
  storage: IStorage,
  entry: InsertCrmDiscoveryWorkspace,
  opts?: { createdByUserId?: number }
): Promise<CrmDiscoveryWorkspace> {
  const workspace = await storage.createCrmDiscoveryWorkspace(entry);
  await logActivity(storage, {
    contactId: workspace.contactId,
    accountId: workspace.accountId ?? undefined,
    dealId: workspace.dealId ?? undefined,
    type: "discovery_workspace_created",
    title: "Discovery workspace created",
    content: workspace.title ? `"${workspace.title}"` : undefined,
    metadata: { discoveryWorkspaceId: workspace.id },
    createdByUserId: opts?.createdByUserId,
  });
  return workspace;
}

export async function updateDiscoveryWorkspace(
  storage: IStorage,
  id: number,
  updates: Partial<InsertCrmDiscoveryWorkspace>,
  opts?: { createdByUserId?: number }
): Promise<CrmDiscoveryWorkspace> {
  const workspace = await storage.updateCrmDiscoveryWorkspace(id, updates);
  await logActivity(storage, {
    contactId: workspace.contactId,
    accountId: workspace.accountId ?? undefined,
    dealId: workspace.dealId ?? undefined,
    type: "discovery_workspace_updated",
    title: "Discovery workspace updated",
    content: workspace.title ? `"${workspace.title}"` : undefined,
    metadata: { discoveryWorkspaceId: workspace.id },
    createdByUserId: opts?.createdByUserId,
  });
  return workspace;
}
