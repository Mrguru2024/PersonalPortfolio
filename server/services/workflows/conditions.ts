/**
 * Stage 4: Workflow condition evaluators.
 */

import type { WorkflowContext } from "./types";
import { getDealCompleteness } from "@server/services/crmCompletenessService";
import { calculateAiFitScore, calculateAiPriorityScore } from "@server/services/crmFoundationService";

export function leadScoreAbove(threshold: number): (ctx: WorkflowContext) => boolean {
  return (ctx) => {
    const contact = ctx.payload.contact;
    const deal = ctx.payload.deal;
    const score = deal?.leadScore ?? contact?.leadScore ?? 0;
    return score >= threshold;
  };
}

export function contactHasAccount(ctx: WorkflowContext): boolean {
  return !!(ctx.payload.contact?.accountId ?? ctx.payload.accountId);
}

export function dealStageIs(stage: string): (ctx: WorkflowContext) => boolean {
  return (ctx) => (ctx.payload.deal?.pipelineStage ?? ctx.payload.newStage) === stage;
}

export function hasResearch(ctx: WorkflowContext): boolean {
  return !!(ctx.payload.research && (ctx.payload.research.companySummary?.length ?? 0) > 0);
}

export function qualificationScoreAbove(threshold: number): (ctx: WorkflowContext) => boolean {
  return (ctx) => {
    const deal = ctx.payload.deal;
    if (!deal) return false;
    const comp = getDealCompleteness(deal);
    return comp.score >= threshold;
  };
}

export function aiPriorityAbove(threshold: number): (ctx: WorkflowContext) => boolean {
  return (ctx) => {
    const deal = ctx.payload.deal;
    const hasResearch = !!(ctx.payload.research && (ctx.payload.research.companySummary?.length ?? 0) > 0);
    if (deal) {
      const score = calculateAiPriorityScore(deal, hasResearch);
      return score >= threshold;
    }
    const contact = ctx.payload.contact;
    if (contact) {
      const score = calculateAiFitScore(contact, ctx.payload.account ?? null);
      return score >= threshold;
    }
    return false;
  };
}

export function noActivityForDays(days: number): (ctx: WorkflowContext) => boolean {
  return (ctx) => {
    const contact = ctx.payload.contact;
    const last = contact?.lastActivityAt ?? contact?.updatedAt;
    if (!last) return true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(last) < cutoff;
  };
}

export function alwaysTrue(): (ctx: WorkflowContext) => boolean {
  return () => true;
}
