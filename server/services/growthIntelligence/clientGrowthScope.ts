import { storage } from "@server/storage";
import type { User } from "@shared/schema";
import type {
  ClientGrowthCapabilities,
  ClientGrowthModuleFlags,
  ClientGrowthPermissionKey,
} from "@shared/clientGrowthCapabilities";

export type ClientGrowthScope = {
  contactIds: number[];
  accountIds: number[];
};

function mergeModule(base: boolean, override: unknown): boolean {
  if (override === false) return false;
  return base;
}

export async function getClientGrowthScopeForUser(userId: number): Promise<ClientGrowthScope> {
  const user = await storage.getUser(userId);
  const emailRaw = user?.email?.trim() ?? "";
  if (!emailRaw) return { contactIds: [], accountIds: [] };
  const crmRows = await storage.getCrmContactsByNormalizedEmails([emailRaw]);
  const contactIds = crmRows.map((c) => c.id);
  const accountIds = [
    ...new Set(crmRows.map((c) => c.accountId).filter((x): x is number => x != null && x > 0)),
  ];
  return { contactIds, accountIds };
}

export function buildClientGrowthCapabilities(args: {
  eligible: boolean;
  user: User | null | undefined;
  scope: ClientGrowthScope;
}): ClientGrowthCapabilities {
  const p = (args.user?.permissions ?? null) as Record<string, unknown> | null;
  const deny = (key: string) => p?.[key] === false;

  const modules: ClientGrowthModuleFlags = {
    conversionDiagnostics: mergeModule(args.eligible, !deny("growth.conversion_diagnostics")),
    sharedImprovements: mergeModule(
      args.eligible && args.scope.accountIds.length > 0,
      !deny("growth.shared_improvements"),
    ),
    pageBehaviorDetail: mergeModule(
      args.eligible && args.scope.contactIds.length > 0,
      !deny("growth.page_behavior"),
    ),
  };

  const permissions = {
    "growth.conversion_diagnostics": modules.conversionDiagnostics,
    "growth.shared_improvements": modules.sharedImprovements,
    "growth.page_behavior": modules.pageBehaviorDetail,
  } as Record<ClientGrowthPermissionKey, boolean>;

  return {
    eligible: args.eligible,
    crm: {
      linkedContacts: args.scope.contactIds.length,
      accountIds: args.scope.accountIds,
    },
    modules,
    permissions,
  };
}
