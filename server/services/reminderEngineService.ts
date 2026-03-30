/**
 * Admin reminder engine: derives reminders from business goal presets and platform state
 * (CRM tasks, alerts, discovery, proposal prep, follow-ups). Role-based filtering supported.
 */

import type { IStorage } from "@server/storage";
import type { BusinessGoalPreset } from "@shared/schema";
import type { CrmTask } from "@shared/crmSchema";

export type ReminderRole = "all" | "sales" | "marketing" | "operations";

export interface ReminderItem {
  reminderKey: string;
  title: string;
  body: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  actionUrl: string | null;
  relatedType: string | null;
  relatedId: number | null;
  sourcePresetKey: string;
}

type ReminderEngineSettings = {
  reminderPlanningDays: string[];
  reminderCityFocus: string | null;
  reminderEditorialHolidaysEnabled: boolean;
  reminderEditorialLocalEventsEnabled: boolean;
  reminderEditorialHorizonDays: number;
};

type EditorialOpportunity = {
  reminderKey: string;
  title: string;
  body: string;
  actionUrl: string;
};

const WEEKDAY_LABELS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type HolidayLookupRow = { id: string; name: string; month: number; day: number };

const HOLIDAY_LOOKUP: HolidayLookupRow[] = [
  { id: "new_year", name: "New Year's Day", month: 1, day: 1 },
  { id: "valentines", name: "Valentine's Day", month: 2, day: 14 },
  { id: "st_patrick", name: "St. Patrick's Day", month: 3, day: 17 },
  { id: "earth_day", name: "Earth Day", month: 4, day: 22 },
  { id: "memorial_day", name: "Memorial Day (US)", month: 5, day: 27 },
  { id: "independence_day", name: "Independence Day (US)", month: 7, day: 4 },
  { id: "labor_day", name: "Labor Day (US)", month: 9, day: 2 },
  { id: "halloween", name: "Halloween", month: 10, day: 31 },
  { id: "thanksgiving", name: "Thanksgiving (US)", month: 11, day: 28 },
  { id: "black_friday", name: "Black Friday", month: 11, day: 29 },
  { id: "small_business_saturday", name: "Small Business Saturday", month: 11, day: 30 },
  { id: "christmas_eve", name: "Christmas Eve", month: 12, day: 24 },
  { id: "christmas", name: "Christmas Day", month: 12, day: 25 },
];

function normalizeReminderSettings(
  raw: Partial<ReminderEngineSettings> | null | undefined,
): ReminderEngineSettings {
  const allowedDays = new Set(WEEKDAY_LABELS);
  const days = Array.isArray(raw?.reminderPlanningDays)
    ? [...new Set(raw!.reminderPlanningDays
        .filter((d): d is string => typeof d === "string")
        .map((d) => d.trim().toLowerCase())
        .filter((d) => allowedDays.has(d as (typeof WEEKDAY_LABELS)[number])))]
    : [];
  return {
    reminderPlanningDays: days.length > 0 ? days : ["monday"],
    reminderCityFocus:
      typeof raw?.reminderCityFocus === "string" && raw.reminderCityFocus.trim().length > 0
        ? raw.reminderCityFocus.trim().slice(0, 120)
        : null,
    reminderEditorialHolidaysEnabled: raw?.reminderEditorialHolidaysEnabled !== false,
    reminderEditorialLocalEventsEnabled: raw?.reminderEditorialLocalEventsEnabled !== false,
    reminderEditorialHorizonDays: Math.max(
      3,
      Math.min(90, Math.round(Number(raw?.reminderEditorialHorizonDays ?? 21))),
    ),
  };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysUntil(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function nextWeekdayDate(from: Date, weekday: string): Date | null {
  const target = WEEKDAY_LABELS.indexOf(weekday as (typeof WEEKDAY_LABELS)[number]);
  if (target < 0) return null;
  const d = new Date(from);
  for (let i = 0; i < 14; i++) {
    if (d.getDay() === target && i > 0) return d;
    d.setDate(d.getDate() + 1);
  }
  return null;
}

function buildEditorialOpportunities(now: Date, settings: ReminderEngineSettings): EditorialOpportunity[] {
  const out: EditorialOpportunity[] = [];
  const horizonEnd = endOfDay(addDays(now, settings.reminderEditorialHorizonDays));

  for (const day of settings.reminderPlanningDays) {
    const next = nextWeekdayDate(now, day);
    if (!next) continue;
    const delta = daysUntil(now, next);
    if (delta > settings.reminderEditorialHorizonDays) continue;
    out.push({
      reminderKey: `content_planning_${day}_${next.getFullYear()}-${next.getMonth() + 1}-${next.getDate()}`,
      title: `Content planning day: ${day[0].toUpperCase()}${day.slice(1)}`,
      body: `Plan and schedule editorial slots for ${formatDateLabel(next)} so content stays ahead of deadlines.`,
      actionUrl: "/admin/content-studio/calendar",
    });
  }

  if (settings.reminderEditorialHolidaysEnabled) {
    const year = now.getFullYear();
    const candidates: Array<HolidayLookupRow & { year: number }> = [
      ...HOLIDAY_LOOKUP.map((h) => ({ ...h, year })),
      ...HOLIDAY_LOOKUP.map((h) => ({ ...h, year: year + 1 })),
    ];
    for (const h of candidates) {
      const when = new Date(h.year, h.month - 1, h.day);
      if (when < now || when > horizonEnd) continue;
      out.push({
        reminderKey: `editorial_holiday_${h.id}_${when.getFullYear()}-${h.month}-${h.day}`,
        title: `Editorial reminder: ${h.name}`,
        body: `Draft and schedule holiday-timed posts before ${formatDateLabel(when)} to maximize reach.`,
        actionUrl: "/admin/content-studio/calendar",
      });
    }
  }

  if (settings.reminderEditorialLocalEventsEnabled && settings.reminderCityFocus) {
    const city = settings.reminderCityFocus;
    const recurring = [
      { key: "month_start", offset: 5, label: "Start-of-month local spotlight" },
      { key: "mid_month", offset: 14, label: "Mid-month local partnership round-up" },
      { key: "month_end", offset: 24, label: "End-of-month local event recap" },
    ];
    for (const r of recurring) {
      const when = addDays(now, r.offset);
      if (when > horizonEnd) continue;
      out.push({
        reminderKey: `editorial_local_${r.key}_${when.getFullYear()}-${when.getMonth() + 1}-${when.getDate()}_${city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: `Local editorial: ${city}`,
        body: `${r.label} — prepare content tied to ${city} events and community moments by ${formatDateLabel(when)}.`,
        actionUrl: "/admin/content-studio/calendar",
      });
    }
  }

  return out;
}

/** Map user role/permissions to reminder role for filtering. */
export function getUserReminderRole(user: { role?: string | null; permissions?: Record<string, boolean> | null }): ReminderRole {
  if (user.role === "developer") return "all";
  const perms = user.permissions ?? {};
  if (perms["crm_sales"] || perms["crm"]) return "sales";
  if (perms["blog"] || perms["newsletters"]) return "marketing";
  if (perms["pages"] || perms["system"]) return "operations";
  return "all";
}

/** Check if preset applies to the user's role. */
export function presetAppliesToRole(preset: BusinessGoalPreset, userRole: ReminderRole): boolean {
  const filter = (preset.roleFilter as ReminderRole) ?? "all";
  if (filter === "all") return true;
  return filter === userRole;
}

export async function gatherReminderCandidates(storage: IStorage): Promise<{
  overdueTasks: (CrmTask & { contact?: { id: number; name?: string | null; email?: string | null } })[];
  tasksDueSoon: (CrmTask & { contact?: { id: number; name?: string | null; email?: string | null } })[];
  unreadAlertsCount: number;
  followUpNeededCount: number;
  discoveryIncomplete: number;
  proposalPrepAttention: number;
  staleLeadsCount: number;
  leadsMissingData: number;
}> {
  const summary = await storage.getCrmDashboardStats();
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days
  const allIncomplete = await storage.getCrmTasks({ incompleteOnly: true });
  const overdueTasks = summary.overdueTasks ?? [];
  const tasksDueSoon = allIncomplete.filter(
    (t) => t.dueAt && !t.completedAt && new Date(t.dueAt) > now && new Date(t.dueAt) <= soon
  );
  const engagement = await storage.getCrmEngagementStats().catch(() => ({ unreadAlertsCount: 0 }));

  return {
    overdueTasks,
    tasksDueSoon,
    unreadAlertsCount: engagement.unreadAlertsCount ?? 0,
    followUpNeededCount: summary.followUpNeededCount ?? 0,
    discoveryIncomplete: summary.discoveryWorkspacesIncomplete ?? 0,
    proposalPrepAttention: summary.proposalPrepNeedingAttention ?? 0,
    staleLeadsCount: 0, // could derive from noActivityForDays; use dashboard if we add it
    leadsMissingData: summary.leadsMissingData ?? 0,
  };
}

/** Build reminder items from presets and candidate data. */
export function buildReminderItems(
  presets: BusinessGoalPreset[],
  data: Awaited<ReturnType<typeof gatherReminderCandidates>>,
  userRole: ReminderRole,
  editorial: EditorialOpportunity[],
): ReminderItem[] {
  const items: ReminderItem[] = [];

  for (const preset of presets) {
    if (!presetAppliesToRole(preset, userRole)) continue;
    const criteria = preset.criteria as { type: string } | null;
    if (!criteria?.type) continue;

    switch (criteria.type) {
      case "overdue_tasks": {
        for (const task of data.overdueTasks) {
          const contactName = task.contact?.name || task.contact?.email || `Contact #${task.contactId}`;
          items.push({
            reminderKey: `overdue_task_${task.id}`,
            title: preset.name,
            body: `${task.title} — ${contactName}`,
            priority: (task.priority as ReminderItem["priority"]) || "high",
            actionUrl: `/admin/crm/${task.contactId}`,
            relatedType: "task",
            relatedId: task.id,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "tasks_due_soon": {
        if (data.tasksDueSoon.length > 0) {
          items.push({
            reminderKey: "tasks_due_soon",
            title: preset.name,
            body: `${data.tasksDueSoon.length} task(s) due in the next 2 days`,
            priority: "medium",
            actionUrl: "/admin/crm/tasks",
            relatedType: null,
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "unread_alerts": {
        if (data.unreadAlertsCount > 0) {
          items.push({
            reminderKey: "unread_alerts",
            title: preset.name,
            body: `${data.unreadAlertsCount} unread lead alert(s)`,
            priority: "high",
            actionUrl: "/admin/crm",
            relatedType: "alert",
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "follow_up_due": {
        if (data.followUpNeededCount > 0) {
          items.push({
            reminderKey: "follow_up_due",
            title: preset.name,
            body: `${data.followUpNeededCount} lead(s) due for follow-up`,
            priority: "high",
            actionUrl: "/admin/crm",
            relatedType: null,
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "discovery_incomplete": {
        if (data.discoveryIncomplete > 0) {
          items.push({
            reminderKey: "discovery_incomplete",
            title: preset.name,
            body: `${data.discoveryIncomplete} discovery workspace(s) in draft or scheduled`,
            priority: "medium",
            actionUrl: "/admin/crm/discovery",
            relatedType: "discovery",
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "proposal_prep_attention": {
        if (data.proposalPrepAttention > 0) {
          items.push({
            reminderKey: "proposal_prep_attention",
            title: preset.name,
            body: `${data.proposalPrepAttention} proposal prep workspace(s) need attention`,
            priority: "medium",
            actionUrl: "/admin/crm/proposal-prep",
            relatedType: "proposal_prep",
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "leads_missing_data": {
        if (data.leadsMissingData > 0) {
          items.push({
            reminderKey: "leads_missing_data",
            title: preset.name,
            body: `${data.leadsMissingData} active lead(s) missing key data (budget, timeline, pain point)`,
            priority: "medium",
            actionUrl: "/admin/crm/pipeline",
            relatedType: null,
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "content_planning_day": {
        for (const e of editorial.filter((row) => row.reminderKey.startsWith("content_planning_"))) {
          items.push({
            reminderKey: e.reminderKey,
            title: preset.name,
            body: e.body,
            priority: "medium",
            actionUrl: e.actionUrl,
            relatedType: "editorial",
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "editorial_holiday_window": {
        for (const e of editorial.filter((row) => row.reminderKey.startsWith("editorial_holiday_"))) {
          items.push({
            reminderKey: e.reminderKey,
            title: preset.name,
            body: e.body,
            priority: "medium",
            actionUrl: e.actionUrl,
            relatedType: "editorial",
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      case "editorial_local_event_window": {
        for (const e of editorial.filter((row) => row.reminderKey.startsWith("editorial_local_"))) {
          items.push({
            reminderKey: e.reminderKey,
            title: preset.name,
            body: e.body,
            priority: "medium",
            actionUrl: e.actionUrl,
            relatedType: "editorial",
            relatedId: null,
            sourcePresetKey: preset.key,
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return items;
}

/** Generate and persist reminders for a user (or all admins if userId null). Idempotent: skips if reminderKey already exists with status new/snoozed. */
export async function runReminderEngine(
  storage: IStorage,
  options: { userId?: number | null; userRole?: ReminderRole }
): Promise<{ created: number; skipped: number }> {
  const presets = await storage.getBusinessGoalPresets(true);
  const userRole = options.userRole ?? "all";
  const userId = options.userId ?? null;
  const settingsRaw = userId != null ? await storage.getAdminSettings(userId) : null;
  const reminderSettings = normalizeReminderSettings({
    reminderPlanningDays: settingsRaw?.reminderPlanningDays ?? undefined,
    reminderCityFocus: settingsRaw?.reminderCityFocus ?? null,
    reminderEditorialHolidaysEnabled: settingsRaw?.reminderEditorialHolidaysEnabled ?? true,
    reminderEditorialLocalEventsEnabled: settingsRaw?.reminderEditorialLocalEventsEnabled ?? true,
    reminderEditorialHorizonDays: settingsRaw?.reminderEditorialHorizonDays ?? 21,
  });
  const editorialItems = buildEditorialOpportunities(new Date(), reminderSettings);
  const data =
    presets.length > 0
      ? await gatherReminderCandidates(storage)
      : {
          overdueTasks: [],
          tasksDueSoon: [],
          unreadAlertsCount: 0,
          followUpNeededCount: 0,
          discoveryIncomplete: 0,
          proposalPrepAttention: 0,
          staleLeadsCount: 0,
          leadsMissingData: 0,
        };
  const items = buildReminderItems(presets, data, userRole, editorialItems);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const existing = await storage.getAdminReminderByKey(userId, item.reminderKey);
    if (existing && (existing.status === "new" || existing.status === "snoozed")) {
      skipped++;
      continue;
    }
    await storage.createAdminReminder({
      userId,
      reminderKey: item.reminderKey,
      title: item.title,
      body: item.body,
      priority: item.priority,
      actionUrl: item.actionUrl,
      relatedType: item.relatedType,
      relatedId: item.relatedId,
      sourcePresetKey: item.sourcePresetKey,
      status: "new",
    });
    created++;
  }

  return { created, skipped };
}
