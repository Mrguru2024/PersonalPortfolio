/**
 * Stage 3: AI provider abstraction for CRM guidance.
 * RuleBasedAIProvider produces structured output from CRM data; LLM provider can be added later.
 */

import type { CrmContact } from "@shared/crmSchema";
import type { CrmAccount } from "@shared/crmSchema";
import type { CrmDeal } from "@shared/crmSchema";
import type { CrmResearchProfile } from "@shared/crmSchema";
import type {
  LeadSummaryOutput,
  AccountSummaryOutput,
  ContactSummaryOutput,
  OpportunityAssessmentOutput,
  NextBestActionItem,
  DiscoveryQuestionsOutput,
  ProposalPrepOutput,
  RiskWarningsOutput,
  QualificationGapOutput,
  ResearchSummaryOutput,
  AiPriorityOutput,
  AiPriorityLabel,
} from "@shared/crmAiGuidanceTypes";
import {
  calculateAiFitScore,
  calculateAiPriorityScore,
  generateNextBestActions as foundationNextBestActions,
} from "@server/services/crmFoundationService";
import {
  getDealCompleteness,
  getContactCompleteness,
  getResearchCompleteness,
} from "@server/services/crmCompletenessService";

export const PROVIDER_TYPE_RULE = "rule" as const;
export const PROVIDER_TYPE_LLM = "llm" as const;

export interface CrmAiContext {
  contact: CrmContact;
  account?: CrmAccount | null;
  deal?: CrmDeal | null;
  research?: CrmResearchProfile | null;
}

/** Provider returns structured guidance from CRM data. No fake API calls. */
export interface ICrmAiProvider {
  readonly providerType: typeof PROVIDER_TYPE_RULE | typeof PROVIDER_TYPE_LLM;
  generateLeadSummary(ctx: CrmAiContext): Promise<LeadSummaryOutput>;
  generateAccountSummary(account: CrmAccount, research: CrmResearchProfile | null): Promise<AccountSummaryOutput>;
  generateContactSummary(contact: CrmContact, account?: CrmAccount | null): Promise<ContactSummaryOutput>;
  generateOpportunityAssessment(ctx: CrmAiContext): Promise<OpportunityAssessmentOutput>;
  generateResearchSummary(research: CrmResearchProfile | null): Promise<ResearchSummaryOutput>;
  generateNextBestActions(ctx: CrmAiContext): Promise<NextBestActionItem[]>;
  generateDiscoveryQuestions(ctx: CrmAiContext): Promise<DiscoveryQuestionsOutput>;
  generateProposalPrepNotes(ctx: CrmAiContext): Promise<ProposalPrepOutput>;
  generateRiskWarnings(ctx: CrmAiContext): Promise<RiskWarningsOutput>;
  generateFollowUpAngle(ctx: CrmAiContext): Promise<{ angle: string }>;
  generateQualificationGapAnalysis(ctx: CrmAiContext): Promise<QualificationGapOutput>;
  generateAiPriority(ctx: CrmAiContext): Promise<AiPriorityOutput>;
}

function priorityLabelFromScore(score: number, stage: string): AiPriorityLabel {
  if (score >= 85 && ["proposal_ready", "negotiation"].includes(stage)) return "proposal_ready";
  if (score >= 85) return "urgent_attention";
  if (score >= 70) return "high_value";
  if (score >= 50) return "active";
  if (score >= 30) return "watchlist";
  if (score >= 15) return "nurture";
  return "low_priority";
}

/** Rule-based provider: all outputs derived from stored CRM data. */
export class RuleBasedAIProvider implements ICrmAiProvider {
  readonly providerType = PROVIDER_TYPE_RULE;

  async generateLeadSummary(ctx: CrmAiContext): Promise<LeadSummaryOutput> {
    const { contact, account, deal, research } = ctx;
    const dealCompleteness = deal ? getDealCompleteness(deal) : { score: 0, missingFields: [] as string[] };
    const researchCompleteness = getResearchCompleteness(research ?? null);
    const hasResearch = !!research && (research.companySummary?.length ?? 0) > 0;
    const aiPriority = deal ? calculateAiPriorityScore(deal, hasResearch) : calculateAiFitScore(contact, account ?? null);
    const nextActions = deal ? foundationNextBestActions(deal, { hasResearch, contactHasAccount: !!account }) : [];

    const signals: string[] = [];
    if (contact.leadScore != null && contact.leadScore >= 50) signals.push("Strong engagement score");
    if (deal?.urgencyLevel) signals.push(`Urgency: ${deal.urgencyLevel}`);
    if (deal?.budgetRange) signals.push(`Budget indicated: ${deal.budgetRange}`);
    if (deal?.primaryPainPoint) signals.push(`Pain point: ${deal.primaryPainPoint}`);
    if (hasResearch) signals.push("Research profile exists");
    if (contact.source && /referral|linkedin/i.test(contact.source)) signals.push("Quality source");

    const missing: string[] = [...(dealCompleteness.missingFields ?? []), ...(researchCompleteness.missingFields ?? [])];
    const uniqueMissing = [...new Set(missing)];

    return {
      shortSummary: [contact.name, contact.company || account?.name, deal?.title].filter(Boolean).join(" · ") || contact.email,
      whyThisLeadMatters: deal?.primaryPainPoint
        ? `Expressed need: ${deal.primaryPainPoint}. ${deal.businessGoal ? `Goal: ${deal.businessGoal}` : ""}`
        : account?.growthPainPoints || "Lead in pipeline; qualify to assess fit.",
      strongestOpportunitySignals: signals.length > 0 ? signals : ["Review contact and deal fields to identify signals"],
      likelyBusinessProblem: deal?.primaryPainPoint || account?.growthPainPoints || "Not yet captured",
      likelyServiceFit: deal?.serviceInterest || research?.suggestedServiceFit || "Confirm in discovery",
      qualificationCompleteness: deal ? dealCompleteness.score : 0,
      missingData: uniqueMissing,
      urgencyAssessment: deal?.urgencyLevel || "Unknown",
      confidenceRating: Math.min(100, aiPriority),
      suggestedNext3Actions: nextActions.slice(0, 3).map((a) => `${a.action}: ${a.reason}`),
    };
  }

  async generateAccountSummary(account: CrmAccount, research: CrmResearchProfile | null): Promise<AccountSummaryOutput> {
    const growth: string[] = [];
    if (account.growthPainPoints) growth.push(account.growthPainPoints);
    if (research?.likelyPainPoints) growth.push(research.likelyPainPoints);

    const conversion: string[] = [];
    if (research?.conversionNotes) conversion.push(research.conversionNotes);

    const design: string[] = [];
    if (research?.designUxNotes) design.push(research.designUxNotes);

    const automation: string[] = [];
    if (research?.automationOpportunityNotes) automation.push(research.automationOpportunityNotes);

    return {
      businessSummary: [account.name, account.industry, account.companySize, account.businessType].filter(Boolean).join(" · ") || account.name,
      websiteMaturitySummary: account.currentWebsiteStatus || account.currentMarketingMaturity || "Not specified",
      likelyGrowthIssues: growth.length > 0 ? growth : ["Add research or account notes"],
      likelyConversionIssues: conversion.length > 0 ? conversion : ["Review research conversion notes"],
      likelyDesignUxIssues: design.length > 0 ? design : ["Review research design/UX notes"],
      likelyAutomationOpportunities: automation.length > 0 ? automation : ["Review research automation notes"],
      serviceFitSummary: research?.suggestedServiceFit || "Add research to refine",
      strategicOpportunityLevel: account.accountStatus === "prospect" ? "Prospect" : account.currentMarketingMaturity || "Assess in discovery",
    };
  }

  async generateContactSummary(contact: CrmContact, account?: CrmAccount | null): Promise<ContactSummaryOutput> {
    const completeness = getContactCompleteness(contact);
    return {
      shortSummary: [contact.name, contact.jobTitle, contact.company || account?.name].filter(Boolean).join(" at ") || contact.email,
      relationshipNotes: contact.notes?.slice(0, 300) || "No notes yet",
      suggestedNextConversationAngle: account?.growthPainPoints ? `Discuss: ${account.growthPainPoints}` : "Confirm goals and timeline",
      missingInfoPrompts: completeness.missingFields,
    };
  }

  async generateOpportunityAssessment(ctx: CrmAiContext): Promise<OpportunityAssessmentOutput> {
    const { deal, research } = ctx;
    if (!deal) {
      return {
        summary: "No opportunity linked; create a deal to assess.",
        strengthSignals: [],
        risks: ["No deal record"],
        readiness: "unknown",
        suggestedFocus: ["Create opportunity and capture pain point, budget, timeline"],
      };
    }
    const hasResearch = !!research && (research.companySummary?.length ?? 0) > 0;
    const score = calculateAiPriorityScore(deal, hasResearch);
    const stage = deal.pipelineStage ?? deal.stage ?? "";
    const signals: string[] = [];
    if (deal.primaryPainPoint) signals.push(deal.primaryPainPoint);
    if (deal.budgetRange) signals.push(`Budget: ${deal.budgetRange}`);
    if (deal.urgencyLevel) signals.push(`Urgency: ${deal.urgencyLevel}`);
    if (hasResearch) signals.push("Research available");

    const risks: string[] = [];
    if (!deal.budgetRange) risks.push("Budget unknown");
    if (!deal.expectedCloseAt && ["qualified", "proposal_ready", "negotiation"].includes(stage)) risks.push("Timeline unknown");
    if (!hasResearch && deal.accountId) risks.push("No research on account");

    return {
      summary: `${deal.title} — ${stage}. Priority score: ${score}.`,
      strengthSignals: signals.length > 0 ? signals : ["Qualify further"],
      risks: risks.length > 0 ? risks : ["Review deal fields"],
      readiness: ["proposal_ready", "negotiation"].includes(stage) ? "Ready for proposal/close" : stage === "qualified" ? "Qualified" : "Early stage",
      suggestedFocus: !deal.primaryPainPoint ? ["Capture primary pain point"] : !deal.budgetRange ? ["Confirm budget"] : ["Schedule discovery or prepare proposal"],
    };
  }

  async generateResearchSummary(research: CrmResearchProfile | null): Promise<ResearchSummaryOutput> {
    if (!research) {
      return { summary: "No research profile.", recommendedServiceFit: "", outreachAngle: "", keyIssues: [] };
    }
    const keyIssues: string[] = [];
    if (research.technicalIssuesNotes) keyIssues.push(research.technicalIssuesNotes);
    if (research.conversionNotes) keyIssues.push(research.conversionNotes);
    if (research.designUxNotes) keyIssues.push(research.designUxNotes);
    return {
      summary: research.companySummary || research.aiGeneratedSummary || "No summary yet.",
      recommendedServiceFit: research.suggestedServiceFit || "",
      outreachAngle: research.suggestedOutreachAngle || "",
      keyIssues,
    };
  }

  async generateNextBestActions(ctx: CrmAiContext): Promise<NextBestActionItem[]> {
    const { contact, account, deal, research } = ctx;
    const hasResearch = !!research && (research.companySummary?.length ?? 0) > 0;
    const actions = deal
      ? foundationNextBestActions(deal, { hasResearch, contactHasAccount: !!account })
      : [
          { action: "Create opportunity / lead", reason: "No lead linked yet", priority: "high" as const },
          ...(account ? [] : [{ action: "Add account", reason: "Link to company", priority: "high" as const }]),
        ];

    const categories: Record<string, string> = {
      "Add account": "qualification",
      "Capture primary pain point": "qualification",
      "Confirm budget range": "qualification",
      "Research company website": "research",
      "Prepare proposal notes": "proposal",
      "Schedule discovery call": "sales",
      "Schedule follow-up": "follow_up",
      "Consider nurture track": "nurture",
    };

    return actions.slice(0, 8).map((a, i) => ({
      id: `nba-${ctx.contact.id}-${i}-${Date.now()}`,
      label: a.action,
      reason: a.reason,
      priority: a.priority,
      relatedEntityType: deal ? "deal" : undefined,
      relatedEntityId: deal?.id,
      actionCategory: categories[a.action] || "general",
      confidence: a.priority === "high" ? 85 : a.priority === "medium" ? 70 : 50,
      suggestedDueTiming: a.priority === "high" ? "Soon" : undefined,
    }));
  }

  async generateDiscoveryQuestions(ctx: CrmAiContext): Promise<DiscoveryQuestionsOutput> {
    const { deal, research } = ctx;
    const stage = deal?.pipelineStage ?? deal?.stage ?? "";
    return {
      topQuestions: [
        "What is the main business outcome you want from this engagement?",
        "Who else is involved in the decision?",
        "What is your timeline for making a change?",
      ],
      riskQuestions: ["What has stopped you from solving this before?", "What would need to be true for you to move forward?"],
      budgetTimelineQuestions: ["What budget range do you have in mind?", "When do you need to see results?"],
      websiteFunnelQuestions: research?.websiteFindings ? ["Based on your current site, what is the biggest conversion gap?"] : ["Do you have a website or funnel we should review?"],
      operationalQuestions: ["How is your team structured for this project?", "What tools do you use today?"],
      serviceFitConfirmationQuestions: deal?.serviceInterest
        ? [`You mentioned interest in ${deal.serviceInterest}. What would success look like?`]
        : ["Which of our services is most relevant to your goals?"],
    };
  }

  async generateProposalPrepNotes(ctx: CrmAiContext): Promise<ProposalPrepOutput> {
    const { deal, research } = ctx;
    const scope: string[] = [];
    if (deal?.serviceInterest) scope.push(deal.serviceInterest);
    if (research?.suggestedServiceFit) scope.push(research.suggestedServiceFit);
    return {
      likelyOfferDirection: deal?.serviceInterest || research?.suggestedServiceFit || "Confirm in discovery",
      expectedScopeThemes: scope.length > 0 ? scope : ["Scope TBD from discovery"],
      possibleUpsellCrossSell: ["Ongoing support", "Additional audits"],
      proposalPreparationNotes: ["Confirm decision process", "Confirm budget and timeline"],
      assumptionsRequiringValidation: [!deal?.budgetRange && "Budget range", !deal?.expectedCloseAt && "Close timeline"].filter(Boolean) as string[],
      pricingCautionNotes: [!deal?.budgetRange && "Budget not confirmed"].filter(Boolean) as string[],
      deliverablesToConfirm: ["Deliverables", "Timeline", "Success criteria"],
    };
  }

  async generateRiskWarnings(ctx: CrmAiContext): Promise<RiskWarningsOutput> {
    const { contact, account, deal, research } = ctx;
    const warnings: Array<{ code: string; label: string; severity: "high" | "medium" | "low" }> = [];
    if (deal && !deal.budgetRange) warnings.push({ code: "no_budget", label: "No budget data", severity: "high" });
    if (deal && !deal.expectedCloseAt && ["qualified", "proposal_ready", "negotiation"].includes(deal.pipelineStage ?? "")) {
      warnings.push({ code: "no_timeline", label: "No timeline", severity: "high" });
    }
    if (deal && !deal.serviceInterest) warnings.push({ code: "low_fit", label: "Service interest not set", severity: "medium" });
    if (account && !research) warnings.push({ code: "weak_research", label: "No research profile", severity: "medium" });
    if (contact.source && /unknown|other/i.test(contact.source)) warnings.push({ code: "low_source", label: "Low source quality", severity: "low" });
    if (!account && contact.company) warnings.push({ code: "incomplete_account", label: "Account not linked", severity: "medium" });
    if (deal?.pipelineStage === "proposal_ready" && (!deal.budgetRange || !deal.expectedCloseAt)) {
      warnings.push({ code: "proposal_not_ready", label: "Proposal not ready — confirm budget and timeline", severity: "high" });
    }
    if (deal?.leadScore != null && deal.leadScore < 20) warnings.push({ code: "nurture_only", label: "Lead looks nurture-only", severity: "low" });
    return { warnings };
  }

  async generateFollowUpAngle(ctx: CrmAiContext): Promise<{ angle: string }> {
    const { research, deal } = ctx;
    if (research?.suggestedOutreachAngle) return { angle: research.suggestedOutreachAngle };
    if (deal?.primaryPainPoint) return { angle: `Follow up on: ${deal.primaryPainPoint}` };
    return { angle: "Check in on goals and timeline." };
  }

  async generateQualificationGapAnalysis(ctx: CrmAiContext): Promise<QualificationGapOutput> {
    const { contact, account, deal } = ctx;
    const dealCompleteness = deal ? getDealCompleteness(deal) : { score: 0, missingFields: [] as string[] };
    const contactCompleteness = getContactCompleteness(contact);
    const missing = [...contactCompleteness.missingFields, ...dealCompleteness.missingFields];
    const weak: string[] = [];
    if (!deal?.primaryPainPoint) weak.push("Pain point");
    if (!deal?.budgetRange) weak.push("Budget");
    if (!deal?.expectedCloseAt) weak.push("Timeline");
    return {
      missingFields: [...new Set(missing)],
      weakQualificationAreas: weak,
      missingRiskItems: [],
      missingDecisionMakerClarity: !contact.jobTitle,
      missingBudgetClarity: !deal?.budgetRange,
      missingTimelineClarity: !deal?.expectedCloseAt,
      missingWebsiteFunnelClarity: !contact.websiteUrl && !account?.website,
      overallCompletenessScore: deal ? Math.round((dealCompleteness.score + contactCompleteness.score) / 2) : contactCompleteness.score,
    };
  }

  async generateAiPriority(ctx: CrmAiContext): Promise<AiPriorityOutput> {
    const { deal, research } = ctx;
    const hasResearch = !!research && (research.companySummary?.length ?? 0) > 0;
    const score = deal ? calculateAiPriorityScore(deal, hasResearch) : calculateAiFitScore(ctx.contact, ctx.account ?? null);
    const stage = deal?.pipelineStage ?? deal?.stage ?? "";
    const label = priorityLabelFromScore(score, stage);
    let rationale = `Score ${score} (${label}). `;
    if (deal?.urgencyLevel) rationale += `Urgency: ${deal.urgencyLevel}. `;
    if (deal?.budgetRange) rationale += "Budget indicated. ";
    if (hasResearch) rationale += "Research done. ";
    if (!deal?.budgetRange && ["qualified", "proposal_ready"].includes(stage)) rationale += "Confirm budget before proposal.";
    return { aiPriorityScore: score, priorityLabel: label, rationaleSummary: rationale.trim() };
  }
}

export const ruleBasedCrmAiProvider = new RuleBasedAIProvider();
