import {
  ADMIN_DASHBOARD_SECTION_IDS,
  ADMIN_DASHBOARD_SECTION_LABELS,
  type AdminDashboardSectionId,
} from "@/lib/adminDashboardLayout";
import {
  CRM_DASHBOARD_SECTION_IDS,
  CRM_DASHBOARD_SECTION_LABELS,
  type CrmDashboardSectionId,
} from "@/lib/crmDashboardLayout";

/** Key stored under `admin_settings.admin_ui_layouts` for the analytics host page. */
export const ADMIN_UI_LAYOUT_SURFACE_ANALYTICS = "analytics";

export const UNIFIED_LAYOUT_SURFACE_IDS = ["main", "crm", "analytics"] as const;
export type UnifiedLayoutSurfaceId = (typeof UNIFIED_LAYOUT_SURFACE_IDS)[number];

export const ANALYTICS_WIDGET_IDS = ["analytics_summary"] as const;
export type AnalyticsWidgetId = (typeof ANALYTICS_WIDGET_IDS)[number];

export const ANALYTICS_WIDGET_LABELS: Record<AnalyticsWidgetId, string> = {
  analytics_summary: "Website analytics summary",
};

/** Every block that may appear on any admin dashboard surface (unique placement). */
export const ALL_ADMIN_WIDGET_IDS = [
  ...ADMIN_DASHBOARD_SECTION_IDS,
  ...CRM_DASHBOARD_SECTION_IDS,
  ...ANALYTICS_WIDGET_IDS,
] as const;

export type AdminWidgetId = (typeof ALL_ADMIN_WIDGET_IDS)[number];

export const ADMIN_WIDGET_LABELS: Record<AdminWidgetId, string> = {
  ...ADMIN_DASHBOARD_SECTION_LABELS,
  ...CRM_DASHBOARD_SECTION_LABELS,
  ...ANALYTICS_WIDGET_LABELS,
};

const MAIN_SET = new Set<string>(ADMIN_DASHBOARD_SECTION_IDS);
const CRM_SET = new Set<string>(CRM_DASHBOARD_SECTION_IDS);

export function isAdminWidgetId(x: string): x is AdminWidgetId {
  return (ALL_ADMIN_WIDGET_IDS as readonly string[]).includes(x);
}

/** Default “home” page for reset-to-defaults on that surface. */
export function defaultSurfaceForWidget(id: AdminWidgetId): UnifiedLayoutSurfaceId {
  if (MAIN_SET.has(id)) return "main";
  if (CRM_SET.has(id)) return "crm";
  return "analytics";
}

export function isMainNativeWidget(id: string): id is AdminDashboardSectionId {
  return MAIN_SET.has(id);
}

export function isCrmNativeWidget(id: string): id is CrmDashboardSectionId {
  return CRM_SET.has(id);
}
