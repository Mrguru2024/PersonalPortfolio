/**
 * Main admin dashboard (/admin/dashboard) modules.
 * Persisted under admin_settings.adminUiLayouts.main (cross-device). Legacy localStorage is migrated once.
 */

export const ADMIN_DASHBOARD_SECTION_IDS = [
  "suggested",
  "reminders",
  "summary",
  "inbox",
  "intelligence",
  "shortcuts",
  "password",
  "devUpdates",
] as const;

export type AdminDashboardSectionId = (typeof ADMIN_DASHBOARD_SECTION_IDS)[number];

export const ADMIN_DASHBOARD_SECTION_LABELS: Record<AdminDashboardSectionId, string> = {
  suggested: "Suggested for you",
  reminders: "Reminders",
  summary: "Summary cards (counts)",
  inbox: "Inbox (assessments & contacts)",
  intelligence: "Operator intelligence (AI plan)",
  shortcuts: "Workspace shortcuts",
  password: "Password reset",
  devUpdates: "Development updates",
};

export const DEFAULT_ADMIN_DASHBOARD_ORDER: AdminDashboardSectionId[] = [
  ...ADMIN_DASHBOARD_SECTION_IDS,
];

export interface AdminDashboardLayoutStored {
  order: AdminDashboardSectionId[];
  /** Sections the user chose to hide. */
  hidden: AdminDashboardSectionId[];
}

export function adminDashboardLayoutStorageKey(userId: number | string): string {
  return `admin_dashboard_layout_v1_${userId}`;
}

function isSectionId(x: string): x is AdminDashboardSectionId {
  return (ADMIN_DASHBOARD_SECTION_IDS as readonly string[]).includes(x);
}

export function parseStoredLayout(raw: string | null): AdminDashboardLayoutStored | null {
  if (!raw?.trim()) return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const orderRaw = (o as { order?: unknown }).order;
    const hiddenRaw = (o as { hidden?: unknown }).hidden;
    const order = Array.isArray(orderRaw)
      ? orderRaw.filter((x): x is AdminDashboardSectionId => typeof x === "string" && isSectionId(x))
      : [];
    const hidden = Array.isArray(hiddenRaw)
      ? hiddenRaw.filter((x): x is AdminDashboardSectionId => typeof x === "string" && isSectionId(x))
      : [];
    return { order, hidden: [...new Set(hidden)] };
  } catch {
    return null;
  }
}

/** Ensure full section set, stable order, valid hidden set. */
export function normalizeLayout(
  stored: AdminDashboardLayoutStored | null,
): AdminDashboardLayoutStored {
  const defaultOrder = [...DEFAULT_ADMIN_DASHBOARD_ORDER];
  const seen = new Set<AdminDashboardSectionId>();
  const order: AdminDashboardSectionId[] = [];
  const rawOrder = stored?.order?.length ? stored.order : defaultOrder;
  for (const id of rawOrder) {
    if (!isSectionId(id) || seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  for (const id of defaultOrder) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  const hiddenSet = new Set(
    (stored?.hidden ?? []).filter((id) => ADMIN_DASHBOARD_SECTION_IDS.includes(id)),
  );
  return {
    order,
    hidden: [...hiddenSet],
  };
}

export function serializeLayout(layout: AdminDashboardLayoutStored): string {
  return JSON.stringify({ order: layout.order, hidden: layout.hidden });
}
