import type { AdminSettings } from "@shared/schema";

/** Shared shape for GET/PATCH /api/admin/settings (client + server). */
export interface AdminSettingsApiPayload {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotificationsEnabled: boolean;
  remindersEnabled: boolean;
  reminderFrequency: string;
  notifyOnRoleChange: boolean;
  aiAgentCanPerformActions: boolean;
  aiAgentRequireActionConfirmation: boolean;
  adminUiLayouts: Record<string, { order: string[]; hidden: string[] }> | null;
}

export const ADMIN_SETTINGS_DEFAULTS: Omit<AdminSettingsApiPayload, "adminUiLayouts"> = {
  emailNotifications: true,
  inAppNotifications: true,
  pushNotificationsEnabled: true,
  remindersEnabled: true,
  reminderFrequency: "realtime",
  notifyOnRoleChange: true,
  aiAgentCanPerformActions: false,
  aiAgentRequireActionConfirmation: true,
};

export function toAdminSettingsApiPayload(
  row: AdminSettings | null | undefined,
): AdminSettingsApiPayload {
  if (!row) {
    return { ...ADMIN_SETTINGS_DEFAULTS, adminUiLayouts: null };
  }
  return {
    emailNotifications: row.emailNotifications,
    inAppNotifications: row.inAppNotifications,
    pushNotificationsEnabled: row.pushNotificationsEnabled,
    remindersEnabled: row.remindersEnabled,
    reminderFrequency: row.reminderFrequency,
    notifyOnRoleChange: row.notifyOnRoleChange,
    aiAgentCanPerformActions: row.aiAgentCanPerformActions,
    aiAgentRequireActionConfirmation: row.aiAgentRequireActionConfirmation,
    adminUiLayouts: row.adminUiLayouts ?? null,
  };
}

export function sanitizeAdminUiLayoutsPatch(
  raw: unknown,
): Record<string, { order: string[]; hidden: string[] }> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, { order: string[]; hidden: string[] }> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== "string" || k.length > 64) continue;
    if (!v || typeof v !== "object") continue;
    const order = Array.isArray((v as { order?: unknown }).order)
      ? (v as { order: unknown[] }).order.filter((x): x is string => typeof x === "string")
      : [];
    const hidden = Array.isArray((v as { hidden?: unknown }).hidden)
      ? (v as { hidden: unknown[] }).hidden.filter((x): x is string => typeof x === "string")
      : [];
    out[k] = { order, hidden };
  }
  return Object.keys(out).length ? out : undefined;
}
