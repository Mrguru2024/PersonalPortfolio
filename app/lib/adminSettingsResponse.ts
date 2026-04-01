import type { AdminTtsConfigStored } from "@shared/readAloudTtsConfig";
import type { AdminSettings } from "@shared/schema";

/** Shared shape for GET/PATCH /api/admin/settings (client + server). */
export interface AdminSettingsApiPayload {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotificationsEnabled: boolean;
  remindersEnabled: boolean;
  reminderFrequency: string;
  reminderPlanningDays: string[];
  reminderCityFocus: string | null;
  reminderEditorialHolidaysEnabled: boolean;
  reminderEditorialLocalEventsEnabled: boolean;
  reminderEditorialHorizonDays: number;
  notifyOnRoleChange: boolean;
  aiAgentCanPerformActions: boolean;
  aiAgentRequireActionConfirmation: boolean;
  /** Opt-in: aggregate admin paths for the mentor (no form fields or keystrokes). */
  aiMentorObserveUsage: boolean;
  /** When observation is on, rare checkpoint prompts may appear in the assistant panel. */
  aiMentorProactiveCheckpoints: boolean;
  adminUiLayouts: Record<string, { order: string[]; hidden: string[] }> | null;
  /** Null = defaults only (env + built-in voices). */
  ttsConfig: AdminTtsConfigStored | null;
}

export const ADMIN_SETTINGS_DEFAULTS: Omit<AdminSettingsApiPayload, "adminUiLayouts" | "ttsConfig"> = {
  emailNotifications: true,
  inAppNotifications: true,
  pushNotificationsEnabled: true,
  remindersEnabled: true,
  reminderFrequency: "realtime",
  reminderPlanningDays: ["monday"],
  reminderCityFocus: null,
  reminderEditorialHolidaysEnabled: true,
  reminderEditorialLocalEventsEnabled: true,
  reminderEditorialHorizonDays: 21,
  notifyOnRoleChange: true,
  aiAgentCanPerformActions: false,
  aiAgentRequireActionConfirmation: true,
  aiMentorObserveUsage: false,
  aiMentorProactiveCheckpoints: true,
};

export function toAdminSettingsApiPayload(
  row: AdminSettings | null | undefined,
): AdminSettingsApiPayload {
  if (!row) {
    return { ...ADMIN_SETTINGS_DEFAULTS, adminUiLayouts: null, ttsConfig: null };
  }
  return {
    emailNotifications: row.emailNotifications,
    inAppNotifications: row.inAppNotifications,
    pushNotificationsEnabled: row.pushNotificationsEnabled,
    remindersEnabled: row.remindersEnabled,
    reminderFrequency: row.reminderFrequency,
    reminderPlanningDays: row.reminderPlanningDays ?? ADMIN_SETTINGS_DEFAULTS.reminderPlanningDays,
    reminderCityFocus: row.reminderCityFocus ?? ADMIN_SETTINGS_DEFAULTS.reminderCityFocus,
    reminderEditorialHolidaysEnabled:
      row.reminderEditorialHolidaysEnabled ?? ADMIN_SETTINGS_DEFAULTS.reminderEditorialHolidaysEnabled,
    reminderEditorialLocalEventsEnabled:
      row.reminderEditorialLocalEventsEnabled ?? ADMIN_SETTINGS_DEFAULTS.reminderEditorialLocalEventsEnabled,
    reminderEditorialHorizonDays:
      row.reminderEditorialHorizonDays ?? ADMIN_SETTINGS_DEFAULTS.reminderEditorialHorizonDays,
    notifyOnRoleChange: row.notifyOnRoleChange,
    aiAgentCanPerformActions: row.aiAgentCanPerformActions,
    aiAgentRequireActionConfirmation: row.aiAgentRequireActionConfirmation,
    aiMentorObserveUsage: row.aiMentorObserveUsage,
    aiMentorProactiveCheckpoints: row.aiMentorProactiveCheckpoints,
    adminUiLayouts: row.adminUiLayouts ?? null,
    ttsConfig: row.ttsConfig ?? null,
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
