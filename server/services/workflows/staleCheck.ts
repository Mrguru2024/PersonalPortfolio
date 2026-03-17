/**
 * Stage 4: Stale-check — detect stale leads, missing research, missing qualification and fire workflows.
 * Invoke via POST /api/admin/crm/workflows/run-stale-check or from a future cron.
 */

import type { IStorage } from "@server/storage";
import { fireWorkflows, buildPayloadFromContactId, buildPayloadFromDealId } from "./engine";
import { getDealCompleteness } from "@server/services/crmCompletenessService";

export interface StaleCheckOptions {
  /** Max contacts to process per category (default 20). */
  maxPerCategory?: number;
  /** Days without activity to consider lead stale (default 14). */
  staleDays?: number;
}

export interface StaleCheckResult {
  staleLeadCount: number;
  missingResearchCount: number;
  missingQualificationCount: number;
  workflowsFired: number;
  errors: string[];
}

/**
 * Run stale-check: find leads/accounts/deals needing attention and fire workflows.
 * Runs synchronously; safe to call from API. Limits work per category to avoid timeouts.
 */
export async function runStaleCheck(
  storage: IStorage,
  options: StaleCheckOptions = {}
): Promise<StaleCheckResult> {
  const maxPerCategory = options.maxPerCategory ?? 20;
  const staleDays = options.staleDays ?? 14;
  const errors: string[] = [];
  let workflowsFired = 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleDays);

  // 1. Stale leads: no activity for N days
  let staleLeadCount = 0;
  try {
    const contacts = await storage.getCrmContacts();
    const stale = contacts.filter((c) => {
      const last = c.lastActivityAt ?? c.updatedAt;
      return last && new Date(last) < cutoff && (c.type === "lead" || !c.type);
    });
    staleLeadCount = stale.length;
    for (const c of stale.slice(0, maxPerCategory)) {
      try {
        const payload = await buildPayloadFromContactId(storage, c.id);
        const results = await fireWorkflows(storage, "stale_lead_detected", payload);
        workflowsFired += results.length;
      } catch (e) {
        errors.push(`stale_lead ${c.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`stale_lead fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Missing research: account has no research profile
  let missingResearchCount = 0;
  try {
    const accounts = await storage.getCrmAccounts();
    const researchProfiles = await storage.getCrmResearchProfiles();
    const accountIdsWithResearch = new Set(researchProfiles.map((r) => r.accountId));
    const accountsNeeding = accounts.filter((a) => !accountIdsWithResearch.has(a.id));
    missingResearchCount = accountsNeeding.length;
    for (const account of accountsNeeding.slice(0, maxPerCategory)) {
      try {
        const contacts = await storage.getCrmContactsByAccountId(account.id);
        const contact = contacts[0];
        if (contact) {
          const payload = await buildPayloadFromContactId(storage, contact.id);
          const results = await fireWorkflows(storage, "missing_research_detected", payload);
          workflowsFired += results.length;
        }
      } catch (e) {
        errors.push(`missing_research ${account.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`missing_research fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Missing qualification: active deal missing key fields
  let missingQualificationCount = 0;
  try {
    const deals = await storage.getCrmDeals();
    const activeStages = ["new_lead", "researching", "qualified", "proposal_ready", "follow_up", "negotiation"];
    const active = deals.filter((d) => d.pipelineStage && activeStages.includes(d.pipelineStage));
    const missingQual = active.filter((d) => {
      const comp = getDealCompleteness(d);
      return comp.score < 70 || comp.missingFields.length > 0;
    });
    missingQualificationCount = missingQual.length;
    for (const deal of missingQual.slice(0, maxPerCategory)) {
      try {
        const payload = await buildPayloadFromDealId(storage, deal.id);
        const results = await fireWorkflows(storage, "missing_qualification_detected", payload);
        workflowsFired += results.length;
      } catch (e) {
        errors.push(`missing_qualification ${deal.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`missing_qualification fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    staleLeadCount,
    missingResearchCount,
    missingQualificationCount,
    workflowsFired,
    errors,
  };
}
