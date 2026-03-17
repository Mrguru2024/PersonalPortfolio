/**
 * Stage 4: Workflow engine — fire triggers, evaluate conditions, execute actions, log.
 */

import type { IStorage } from "@server/storage";
import type { WorkflowPayload, WorkflowExecutionResult } from "./types";
import { getWorkflowsByTrigger } from "./registry";
import { executeAction } from "./actions";

export interface FireOptions {
  contactId?: number;
  accountId?: number;
  dealId?: number;
  taskId?: number;
  contact?: unknown;
  account?: unknown;
  deal?: unknown;
  research?: unknown;
  previousStage?: string;
  newStage?: string;
  formSource?: string;
}

/**
 * Fire workflows for a trigger. Loads entity data if not provided, runs matching workflows, logs execution.
 * Runs synchronously; safe to call from API routes and services.
 */
export async function fireWorkflows(
  storage: IStorage,
  triggerType: string,
  payload: WorkflowPayload
): Promise<WorkflowExecutionResult[]> {
  const workflows = getWorkflowsByTrigger(triggerType);
  if (workflows.length === 0) return [];

  const ctx = { storage, payload };
  const results: WorkflowExecutionResult[] = [];

  for (const w of workflows) {
    const startedAt = new Date();
    const executedActions: string[] = [];
    let status: "success" | "partial" | "failed" = "success";
    let errorMessage: string | undefined;

    try {
      let pass = true;
      if (w.conditions?.length) {
        for (const cond of w.conditions) {
          const result = await Promise.resolve(cond(ctx));
          if (!result) {
            pass = false;
            break;
          }
        }
      }
      if (!pass) continue;

      for (const actionDef of w.actions) {
        const result = await executeAction(actionDef.type as import("./types").WorkflowActionType, ctx, actionDef.params);
        executedActions.push(result.actionKey);
        if (!result.ok) status = "partial";
      }
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const finishedAt = new Date();
    const relatedEntityType = payload.contactId != null ? "contact" : payload.dealId != null ? "deal" : payload.accountId != null ? "account" : "contact";
    const relatedEntityId = payload.contactId ?? payload.dealId ?? payload.accountId ?? 0;

    try {
      await storage.createCrmWorkflowExecution({
        workflowKey: w.key,
        triggerType,
        relatedEntityType,
        relatedEntityId,
        executedActions,
        status,
        startedAt,
        finishedAt,
        errorMessage: errorMessage ?? null,
        metadata: { trigger: triggerType },
      });
    } catch (logErr) {
      console.error("Workflow execution log failed:", logErr);
    }

    results.push({
      workflowKey: w.key,
      triggerType,
      relatedEntityType,
      relatedEntityId,
      executedActions,
      status,
      startedAt,
      finishedAt,
      errorMessage,
      metadata: { trigger: triggerType },
    });
  }

  return results;
}

/**
 * Resolve primary entity for execution log (contact > deal > account).
 */
export function getPrimaryEntity(payload: WorkflowPayload): { type: string; id: number } {
  if (payload.contactId != null) return { type: "contact", id: payload.contactId };
  if (payload.dealId != null) return { type: "deal", id: payload.dealId };
  if (payload.accountId != null) return { type: "account", id: payload.accountId };
  return { type: "contact", id: 0 };
}

/**
 * Build workflow payload from contactId (loads contact, account, primary deal, research).
 */
export async function buildPayloadFromContactId(
  storage: IStorage,
  contactId: number
): Promise<WorkflowPayload> {
  const contact = await storage.getCrmContactById(contactId);
  if (!contact) return { contactId };
  const account = contact.accountId ? await storage.getCrmAccountById(contact.accountId) : undefined;
  const deals = await storage.getCrmDeals(contactId);
  const deal = deals[0] ?? null;
  const research =
    account?.id != null ? await storage.getCrmResearchProfileByAccountId(account.id) : undefined;
  return {
    contactId,
    accountId: account?.id,
    dealId: deal?.id,
    contact,
    account: account ?? undefined,
    deal: deal ?? undefined,
    research: research ?? undefined,
  };
}

/**
 * Build workflow payload from dealId (loads deal, contact, account, research).
 */
export async function buildPayloadFromDealId(storage: IStorage, dealId: number): Promise<WorkflowPayload> {
  const deal = await storage.getCrmDealById(dealId);
  if (!deal) return { dealId };
  const contact = await storage.getCrmContactById(deal.contactId);
  if (!contact) return { dealId, deal, contactId: deal.contactId };
  const account = deal.accountId ? await storage.getCrmAccountById(deal.accountId) : undefined;
  const research =
    account?.id != null ? await storage.getCrmResearchProfileByAccountId(account.id) : undefined;
  return {
    contactId: contact.id,
    accountId: account?.id,
    dealId,
    contact,
    account: account ?? undefined,
    deal,
    research: research ?? undefined,
  };
}
