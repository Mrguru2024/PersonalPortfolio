/** Keys in `admin_settings.admin_ui_layouts` JSON */

export const ADMIN_UI_LAYOUT_SURFACE_MAIN = "main";

export const ADMIN_UI_LAYOUT_SURFACE_CRM = "crm";

export const ADMIN_UI_LAYOUT_SURFACE_ANALYTICS = "analytics";

export type AdminUiLayoutSurface =
  | typeof ADMIN_UI_LAYOUT_SURFACE_MAIN
  | typeof ADMIN_UI_LAYOUT_SURFACE_CRM
  | typeof ADMIN_UI_LAYOUT_SURFACE_ANALYTICS;
