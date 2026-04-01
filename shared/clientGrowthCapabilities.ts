/**
 * Client portal Growth / Conversion Diagnostics — capability map and public DTOs.
 * Server merges `users.permissions` keys (optional) over defaults for eligible portal users.
 *
 * Documented permission keys (all optional on `users.permissions`):
 * - `growth.conversion_diagnostics` — Conversion Diagnostics dashboard
 * - `growth.shared_improvements` — Shared insight tasks / improvements queue
 * - `growth.page_behavior` — Page-level behavior drill-down
 */
export const CLIENT_GROWTH_PERMISSION_KEYS = [
  "growth.conversion_diagnostics",
  "growth.shared_improvements",
  "growth.page_behavior",
] as const;

export type ClientGrowthPermissionKey = (typeof CLIENT_GROWTH_PERMISSION_KEYS)[number];

export interface ClientGrowthModuleFlags {
  /** Eligible users always get this unless explicitly denied in `users.permissions`. */
  conversionDiagnostics: boolean;
  /** Requires CRM account linkage for task scoping. */
  sharedImprovements: boolean;
  /** Requires CRM contact linkage (same as diagnostics data scope). */
  pageBehaviorDetail: boolean;
}

export interface ClientGrowthCapabilities {
  eligible: boolean;
  reason?: "unauthenticated" | "portal_inactive";
  crm: {
    linkedContacts: number;
    accountIds: number[];
  };
  modules: ClientGrowthModuleFlags;
  /** Effective flags after defaults + user.permissions merge (true unless permissions[key] === false). */
  permissions: Record<ClientGrowthPermissionKey, boolean>;
}

/** Client-safe insight task — no evidence JSON, session keys, or assignee IDs. */
export interface ClientInsightTaskView {
  id: number;
  title: string;
  body: string | null;
  status: string;
  /** Client-facing label derived from internal status. */
  statusLabel: string;
  priority: string;
  pagePath: string | null;
  heatmapPage: string | null;
  updatedAt: string;
}

export interface ClientPageBehaviorDetail {
  path: string;
  periodDays: number;
  sinceIso: string;
  lastUpdatedIso: string;
  linkedSessionsInWindow: number;
  /** Distinct linked sessions with at least one event on this path */
  sessionsTouchingPage: number;
  behaviorEventsOnPage: number;
  heatmapClicksOnPage: number;
  hasFrictionFlag: boolean;
  frictionSummary: string | null;
  narratives: string[];
}
