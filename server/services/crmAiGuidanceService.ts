/**
 * Stage 3: AI guidance service — generates and persists guidance using provider (rule-based or LLM).
 */

import type { IStorage } from "@server/storage";
import type { CrmContact, CrmAccount, CrmDeal, CrmResearchProfile } from "@shared/crmSchema";
import type { AiGuidanceOutputType } from "@shared/crmAiGuidanceTypes";
import type { ICrmAiProvider, CrmAiContext } from "@server/services/ai/crmAiProvider";
import { ruleBasedCrmAiProvider } from "@server/services/ai/crmAiProvider";
import { logActivity, type ActivityLogType } from "@server/services/crmFoundationService";

function toLogType(): ActivityLogType {
  return "ai_guidance_generated";
}

export interface GenerateLeadGuidanceInput {
  contactId: number;
  storage: IStorage;
  provider?: ICrmAiProvider;
}

export interface GenerateAccountGuidanceInput {
  accountId: number;
  storage: IStorage;
  provider?: ICrmAiProvider;
}

/** Load contact, account, primary deal, research for a contact. */
export async function loadCrmAiContextForContact(
  storage: IStorage,
  contactId: number
): Promise<CrmAiContext | null> {
  const contact = await storage.getCrmContactById(contactId);
  if (!contact) return null;
  const account = contact.accountId ? await storage.getCrmAccountById(contact.accountId) : undefined;
  const deals = await storage.getCrmDeals(contactId);
  const deal = deals[0] ?? null;
  const research =
    account?.id != null ? await storage.getCrmResearchProfileByAccountId(account.id) : undefined;
  return { contact, account: account ?? null, deal: deal ?? null, research: research ?? null };
}

/** Load account and research for an account. */
export async function loadCrmAiContextForAccount(
  storage: IStorage,
  accountId: number
): Promise<{ account: CrmAccount; research: CrmResearchProfile | null } | null> {
  const account = await storage.getCrmAccountById(accountId);
  if (!account) return null;
  const research = await storage.getCrmResearchProfileByAccountId(accountId);
  return { account, research: research ?? null };
}

/** Load deal, contact, account, research for a deal. */
export async function loadCrmAiContextForDeal(
  storage: IStorage,
  dealId: number
): Promise<CrmAiContext | null> {
  const deal = await storage.getCrmDealById(dealId);
  if (!deal) return null;
  const contact = await storage.getCrmContactById(deal.contactId);
  if (!contact) return null;
  const account = deal.accountId ? await storage.getCrmAccountById(deal.accountId) : undefined;
  const research =
    account?.id != null ? await storage.getCrmResearchProfileByAccountId(account.id) : undefined;
  return {
    contact,
    account: account ?? null,
    deal,
    research: research ?? null,
  };
}

/** Generate and persist lead (deal/contact) guidance. Returns saved guidance records keyed by outputType. */
export async function generateAndPersistLeadGuidance(
  input: GenerateLeadGuidanceInput
): Promise<Record<string, { id: number; content: Record<string, unknown>; providerType: string }>> {
  const { contactId, storage, provider = ruleBasedCrmAiProvider } = input;
  const ctx = await loadCrmAiContextForContact(storage, contactId);
  if (!ctx) return {};

  const results: Record<string, { id: number; content: Record<string, unknown>; providerType: string }> = {};

  const save = async (outputType: AiGuidanceOutputType, content: Record<string, unknown>) => {
    const existing = await storage.getCrmAiGuidanceByEntityAndType("contact", contactId, outputType);
    const payload = {
      entityType: "contact" as const,
      entityId: contactId,
      outputType,
      content,
      providerType: provider.providerType,
      version: existing ? existing.version + 1 : 1,
      generatedBySystem: true,
    };
    if (existing) {
      const updated = await storage.updateCrmAiGuidance(existing.id, {
        content: payload.content,
        providerType: payload.providerType,
        version: payload.version,
        generatedAt: new Date(),
      });
      results[outputType] = { id: updated.id, content: updated.content as Record<string, unknown>, providerType: updated.providerType };
    } else {
      const created = await storage.createCrmAiGuidance(payload);
      results[outputType] = { id: created.id, content: created.content as Record<string, unknown>, providerType: created.providerType };
    }
  };

  const leadSummary = await provider.generateLeadSummary(ctx);
  await save("lead_summary", leadSummary as unknown as Record<string, unknown>);

  const opportunityAssessment = await provider.generateOpportunityAssessment(ctx);
  await save("opportunity_assessment", opportunityAssessment as unknown as Record<string, unknown>);

  const nextBestActions = await provider.generateNextBestActions(ctx);
  await save("next_best_actions", { actions: nextBestActions } as Record<string, unknown>);

  const discoveryQuestions = await provider.generateDiscoveryQuestions(ctx);
  await save("discovery_questions", discoveryQuestions as unknown as Record<string, unknown>);

  const proposalPrep = await provider.generateProposalPrepNotes(ctx);
  await save("proposal_prep", proposalPrep as unknown as Record<string, unknown>);

  const riskWarnings = await provider.generateRiskWarnings(ctx);
  await save("risk_warnings", riskWarnings as unknown as Record<string, unknown>);

  const qualificationGaps = await provider.generateQualificationGapAnalysis(ctx);
  await save("qualification_gaps", qualificationGaps as unknown as Record<string, unknown>);

  const aiPriority = await provider.generateAiPriority(ctx);
  await save("ai_priority", aiPriority as unknown as Record<string, unknown>);

  const contactSummary = await provider.generateContactSummary(ctx.contact, ctx.account);
  await save("contact_summary", contactSummary as unknown as Record<string, unknown>);

  const followUp = await provider.generateFollowUpAngle(ctx);
  await save("follow_up_angle", followUp as unknown as Record<string, unknown>);

  await logActivity(storage, {
    contactId,
    accountId: ctx.account?.id,
    dealId: ctx.deal?.id,
    type: toLogType(),
    title: "AI guidance generated",
    content: `Lead summary, next actions, discovery, proposal prep, and risk warnings (${provider.providerType})`,
    metadata: { outputTypes: Object.keys(results), providerType: provider.providerType },
  });

  return results;
}

/** Generate and persist account guidance. */
export async function generateAndPersistAccountGuidance(
  input: GenerateAccountGuidanceInput
): Promise<Record<string, { id: number; content: Record<string, unknown>; providerType: string }>> {
  const { accountId, storage, provider = ruleBasedCrmAiProvider } = input;
  const loaded = await loadCrmAiContextForAccount(storage, accountId);
  if (!loaded) return {};

  const { account, research } = loaded;
  const results: Record<string, { id: number; content: Record<string, unknown>; providerType: string }> = {};

  const save = async (outputType: AiGuidanceOutputType, content: Record<string, unknown>) => {
    const existing = await storage.getCrmAiGuidanceByEntityAndType("account", accountId, outputType);
    const payload = {
      entityType: "account" as const,
      entityId: accountId,
      outputType,
      content,
      providerType: provider.providerType,
      version: existing ? existing.version + 1 : 1,
      generatedBySystem: true,
    };
    if (existing) {
      const updated = await storage.updateCrmAiGuidance(existing.id, {
        content: payload.content,
        providerType: payload.providerType,
        version: payload.version,
        generatedAt: new Date(),
      });
      results[outputType] = { id: updated.id, content: updated.content as Record<string, unknown>, providerType: updated.providerType };
    } else {
      const created = await storage.createCrmAiGuidance(payload);
      results[outputType] = { id: created.id, content: created.content as Record<string, unknown>, providerType: created.providerType };
    }
  };

  const accountSummary = await provider.generateAccountSummary(account, research);
  await save("account_summary", accountSummary as unknown as Record<string, unknown>);

  const researchSummary = await provider.generateResearchSummary(research);
  await save("research_summary", researchSummary as unknown as Record<string, unknown>);

  await logActivity(storage, {
    accountId,
    type: toLogType(),
    title: "AI account guidance generated",
    content: `Account summary and research summary (${provider.providerType})`,
    metadata: { outputTypes: Object.keys(results), providerType: provider.providerType },
  });

  return results;
}

/** Get persisted guidance for an entity. */
export async function getPersistedGuidance(
  storage: IStorage,
  entityType: "contact" | "account" | "deal",
  entityId: number
): Promise<Array<{ outputType: string; content: Record<string, unknown>; providerType: string; generatedAt: Date }>> {
  const rows = await storage.getCrmAiGuidanceByEntity(entityType, entityId);
  return rows.map((r) => ({
    outputType: r.outputType,
    content: (r.content ?? {}) as Record<string, unknown>,
    providerType: r.providerType,
    generatedAt: r.generatedAt,
  }));
}
