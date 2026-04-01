/**
 * CRM overview (/admin/crm/dashboard) — reorderable blocks synced via admin_settings.adminUiLayouts.crm
 */

export const CRM_DASHBOARD_SECTION_IDS = [
  "kpis",
  "sourcesTags",
  "pipeline",
  "tasksActivity",
] as const;

export type CrmDashboardSectionId = (typeof CRM_DASHBOARD_SECTION_IDS)[number];

export const CRM_DASHBOARD_SECTION_LABELS: Record<CrmDashboardSectionId, string> = {
  kpis: "KPI cards (contacts, pipeline, alerts)",
  sourcesTags: "Top sources & tags",
  pipeline: "Pipeline stage & overdue tasks",
  tasksActivity: "Recent tasks & activity",
};

export const DEFAULT_CRM_DASHBOARD_ORDER: CrmDashboardSectionId[] = [...CRM_DASHBOARD_SECTION_IDS];

export interface CrmDashboardLayoutStored {
  order: CrmDashboardSectionId[];
  hidden: CrmDashboardSectionId[];
}

export function isCrmDashboardSectionId(x: string): x is CrmDashboardSectionId {
  return (CRM_DASHBOARD_SECTION_IDS as readonly string[]).includes(x);
}

export function parseCrmLayoutFromUnknown(raw: unknown): CrmDashboardLayoutStored | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { order?: unknown; hidden?: unknown };
  const order = Array.isArray(o.order)
    ? o.order.filter((x): x is CrmDashboardSectionId => typeof x === "string" && isCrmDashboardSectionId(x))
    : [];
  const hidden = Array.isArray(o.hidden)
    ? o.hidden.filter((x): x is CrmDashboardSectionId => typeof x === "string" && isCrmDashboardSectionId(x))
    : [];
  return { order, hidden: [...new Set(hidden)] };
}

export function normalizeCrmLayout(stored: CrmDashboardLayoutStored | null): CrmDashboardLayoutStored {
  const defaultOrder = [...DEFAULT_CRM_DASHBOARD_ORDER];
  const seen = new Set<CrmDashboardSectionId>();
  const order: CrmDashboardSectionId[] = [];
  const rawOrder = stored?.order?.length ? stored.order : defaultOrder;
  for (const id of rawOrder) {
    if (!isCrmDashboardSectionId(id) || seen.has(id)) continue;
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
    (stored?.hidden ?? []).filter((id) => CRM_DASHBOARD_SECTION_IDS.includes(id)),
  );
  return { order, hidden: [...hiddenSet] };
}
