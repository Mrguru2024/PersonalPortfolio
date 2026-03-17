/**
 * Stage 4: Workflow action executors.
 */

import type { WorkflowContext, WorkflowActionType } from "./types";
import { logActivity } from "@server/services/crmFoundationService";
import { generateAndPersistLeadGuidance, generateAndPersistAccountGuidance } from "@server/services/crmAiGuidanceService";

const ACTION_KEYS: Record<WorkflowActionType, string> = {
  create_task: "create_task",
  update_lead_stage: "update_lead_stage",
  update_status: "update_status",
  update_tags: "update_tags",
  update_priority: "update_priority",
  update_nurture_state: "update_nurture_state",
  update_outreach_state: "update_outreach_state",
  assign_owner: "assign_owner",
  mark_needs_research: "mark_needs_research",
  mark_proposal_ready: "mark_proposal_ready",
  mark_follow_up_required: "mark_follow_up_required",
  log_activity: "log_activity",
  recalculate_score: "recalculate_score",
  recalculate_ai_priority: "recalculate_ai_priority",
  generate_ai_summary: "generate_ai_summary",
  generate_next_best_actions: "generate_next_best_actions",
  generate_discovery_prep: "generate_discovery_prep",
  generate_proposal_prep: "generate_proposal_prep",
  notify_admin: "notify_admin",
  notify_owner: "notify_owner",
  create_internal_alert: "create_internal_alert",
  mark_sequence_ready: "mark_sequence_ready",
  set_do_not_contact: "set_do_not_contact",
};

export async function executeAction(
  type: WorkflowActionType,
  ctx: WorkflowContext,
  params?: Record<string, unknown>
): Promise<{ ok: boolean; actionKey: string }> {
  const key = ACTION_KEYS[type];
  const contactId = ctx.payload.contactId ?? ctx.payload.contact?.id;
  const accountId = ctx.payload.accountId ?? ctx.payload.account?.id ?? ctx.payload.contact?.accountId ?? ctx.payload.deal?.accountId;
  const dealId = ctx.payload.dealId ?? ctx.payload.deal?.id;

  try {
    switch (type) {
      case "create_task": {
        if (!contactId) return { ok: false, actionKey: key };
        const title = (params?.title as string) ?? "Follow-up (workflow)";
        const priority = (params?.priority as string) ?? "medium";
        const dueDays = (params?.dueDays as number) ?? 3;
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + dueDays);
        await ctx.storage.createCrmTask({
          contactId,
          relatedDealId: dealId ?? null,
          relatedAccountId: accountId ?? null,
          type: "follow_up",
          title,
          description: (params?.description as string) ?? null,
          priority: priority as "low" | "medium" | "high" | "urgent",
          dueAt,
          status: "pending",
          aiSuggested: false,
        });
        await logActivity(ctx.storage, {
          contactId,
          dealId: dealId ?? undefined,
          accountId: accountId ?? undefined,
          type: "task_created",
          title: "Task created by workflow",
          content: title,
          metadata: { workflowTask: true },
        });
        return { ok: true, actionKey: key };
      }
      case "update_outreach_state": {
        if (!contactId) return { ok: false, actionKey: key };
        const state = (params?.state as string) ?? "ready_for_follow_up";
        await ctx.storage.updateCrmContact(contactId, { outreachState: state });
        return { ok: true, actionKey: key };
      }
      case "update_nurture_state": {
        if (!contactId) return { ok: false, actionKey: key };
        const state = (params?.state as string) ?? "follow_up_later";
        const reason = params?.reason as string | undefined;
        await ctx.storage.updateCrmContact(contactId, {
          nurtureState: state,
          ...(reason ? { nurtureReason: reason } : {}),
        });
        return { ok: true, actionKey: key };
      }
      case "mark_sequence_ready": {
        if (!contactId) return { ok: false, actionKey: key };
        await ctx.storage.updateCrmContact(contactId, { sequenceReady: true, outreachState: "ready_for_follow_up" });
        return { ok: true, actionKey: key };
      }
      case "mark_follow_up_required": {
        if (!contactId) return { ok: false, actionKey: key };
        const days = (params?.days as number) ?? 1;
        const next = new Date();
        next.setDate(next.getDate() + days);
        await ctx.storage.updateCrmContact(contactId, {
          outreachState: "follow_up_due",
          nextFollowUpAt: next,
        });
        return { ok: true, actionKey: key };
      }
      case "mark_needs_research": {
        if (!contactId) return { ok: false, actionKey: key };
        await ctx.storage.updateCrmContact(contactId, { outreachState: "research_first" });
        return { ok: true, actionKey: key };
      }
      case "update_tags": {
        if (!contactId) return { ok: false, actionKey: key };
        const addTags = (params?.add as string[]) ?? [];
        const contact = ctx.payload.contact ?? (await ctx.storage.getCrmContactById(contactId));
        if (!contact) return { ok: false, actionKey: key };
        const existing = contact.tags ?? [];
        const merged = [...new Set([...existing, ...addTags])];
        await ctx.storage.updateCrmContact(contactId, { tags: merged });
        return { ok: true, actionKey: key };
      }
      case "update_lead_stage": {
        if (!dealId) return { ok: false, actionKey: key };
        const stage = (params?.stage as string) ?? "follow_up";
        await ctx.storage.updateCrmDeal(dealId, { pipelineStage: stage });
        return { ok: true, actionKey: key };
      }
      case "log_activity": {
        await logActivity(ctx.storage, {
          contactId: contactId ?? undefined,
          accountId: accountId ?? undefined,
          dealId: dealId ?? undefined,
          type: "note",
          title: (params?.title as string) ?? "Workflow activity",
          content: (params?.content as string) ?? undefined,
          metadata: (params?.metadata as Record<string, unknown>) ?? undefined,
        });
        return { ok: true, actionKey: key };
      }
      case "create_internal_alert": {
        if (!contactId) return { ok: false, actionKey: key };
        await ctx.storage.createCrmAlert({
          leadId: contactId,
          alertType: (params?.alertType as string) ?? "high_engagement",
          title: (params?.title as string) ?? "Workflow alert",
          message: (params?.message as string) ?? undefined,
          metadata: (params?.metadata as Record<string, unknown>) ?? undefined,
        });
        return { ok: true, actionKey: key };
      }
      case "generate_ai_summary": {
        if (contactId) {
          await generateAndPersistLeadGuidance({ contactId, storage: ctx.storage });
          return { ok: true, actionKey: key };
        }
        if (accountId) {
          await generateAndPersistAccountGuidance({ accountId, storage: ctx.storage });
          return { ok: true, actionKey: key };
        }
        return { ok: false, actionKey: key };
      }
      case "generate_proposal_prep":
      case "generate_discovery_prep":
      case "generate_next_best_actions": {
        if (contactId) {
          await generateAndPersistLeadGuidance({ contactId, storage: ctx.storage });
          return { ok: true, actionKey: key };
        }
        return { ok: false, actionKey: key };
      }
      case "set_do_not_contact": {
        if (!contactId) return { ok: false, actionKey: key };
        const reason = params?.reason as string | undefined;
        await ctx.storage.updateCrmContact(contactId, {
          doNotContact: true,
          nurtureReason: reason ?? "Do not contact (workflow)",
        });
        return { ok: true, actionKey: key };
      }
      case "update_status":
      case "update_priority":
      case "assign_owner":
      case "mark_proposal_ready":
      case "recalculate_score":
      case "recalculate_ai_priority":
      case "notify_admin":
      case "notify_owner":
        return { ok: true, actionKey: key };
      default:
        return { ok: false, actionKey: key };
    }
  } catch (err) {
    console.error(`Workflow action ${type} failed:`, err);
    return { ok: false, actionKey: key };
  }
}
