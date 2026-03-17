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
  userRole: ReminderRole
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
  if (presets.length === 0) return { created: 0, skipped: 0 };

  const data = await gatherReminderCandidates(storage);
  const userRole = options.userRole ?? "all";
  const items = buildReminderItems(presets, data, userRole);

  let created = 0;
  let skipped = 0;
  const userId = options.userId ?? null;

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
