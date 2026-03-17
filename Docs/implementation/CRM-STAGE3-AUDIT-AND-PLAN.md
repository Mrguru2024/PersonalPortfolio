# CRM Stage 3 — AI Guidance + Recommendation Engine — Audit & Plan

## 1. Audit Summary

### 1.1 Current CRM Models / Entities
- **crm_accounts**: name, website, domain, industry, businessType, companySize, estimatedRevenueRange, location, serviceArea, currentWebsiteStatus, currentMarketingMaturity, growthPainPoints, leadSource, accountStatus, tags, notesSummary, ownerUserId.
- **crm_contacts**: type, name, email, phone, company, jobTitle, industry, accountId, source, status, estimatedValue, leadScore, intentLevel, lifecycleStage, websiteUrl, utm*, linkedinUrl, enrichmentStatus, lastActivityAt, bookedCallAt, etc.
- **crm_deals**: contactId, accountId, title, value, stage, pipelineStage, serviceInterest, primaryPainPoint, businessGoal, urgencyLevel, budgetRange, confidenceLevel, leadScore, aiPriorityScore, estimatedCloseProbability, expectedCloseAt, source, campaign, medium, notes.
- **crm_tasks**: contactId, relatedDealId, relatedAccountId, type/taskType, title, description, priority, dueAt, status, aiSuggested, sequenceEnrollmentId.
- **crm_research_profiles**: accountId, contactId, companySummary, websiteFindings, designUxNotes, messagingNotes, conversionNotes, seoVisibilityNotes, automationOpportunityNotes, technicalIssuesNotes, likelyPainPoints, suggestedServiceFit, suggestedOutreachAngle, aiGeneratedSummary, researchConfidence.
- **crm_activity_log**: contactId, accountId, dealId, taskId, type, title, content, metadata, createdByUserId.

### 1.2 Current Research Profile Implementation
- Stored in `crm_research_profiles`; fetched by accountId (and optionally contactId). Used in insights/deal and insights/contact for completeness and “has research” flag.
- `generateResearchSummary()` in crmFoundationService is a stub (pass-through of profile fields).

### 1.3 Current Scoring Logic
- **Lead score**: Updated by leadScoringService (events) and document tracking; stored on contact and deal.
- **AI fit score**: `calculateAiFitScore(contact, account)` in crmFoundationService — rule-based from industry, company, jobTitle, leadScore, source quality, account fields.
- **AI priority score**: `calculateAiPriorityScore(deal, hasResearch)` — rule-based from urgency, value, pipelineStage, leadScore, pain point, budget, expectedCloseAt, research.

### 1.4 Current Next-Action Logic
- `generateNextBestActions(deal, { hasResearch, contactHasAccount })` in crmFoundationService — returns array of `{ action, reason, priority }`. Used by insights/contact and insights/deal APIs and shown on lead detail page (Next best actions card).

### 1.5 Current Dashboard Modules
- **Dashboard API**: GET /api/admin/crm/dashboard → getCrmDashboardStats: totalContacts, totalAccounts, totalActiveLeads, leadsMissingData, leadsByPipelineStage, recentTasks, overdueTasks, recentActivity, accountsNeedingResearch, topSources, topTags.
- **Dashboard page**: app/admin/crm/dashboard — shows stats, tasks, activity.

### 1.6 Current Admin Routes / Pages
- CRM: /admin/crm (main list), /admin/crm/[id] (lead/contact detail), /admin/crm/accounts, /admin/crm/accounts/[id], /admin/crm/pipeline, /admin/crm/tasks, /admin/crm/dashboard, /admin/crm/personas, /admin/crm/sequences, /admin/crm/saved-lists, /admin/crm/import.
- APIs: contacts, contacts/[id], contacts/[id]/timeline, contacts/[id]/enrich, deals, deals/[id], accounts, accounts/[id], research-profiles, tasks, tasks/[id], activity-log, insights/contact/[id], insights/deal/[id], dashboard.

### 1.7 Service Layer Structure
- **server/services/crmFoundationService.ts**: calculateAiFitScore, calculateAiPriorityScore, generateNextBestActions, generateResearchSummary (stub), logActivity.
- **server/services/crmCompletenessService.ts**: getContactCompleteness, getAccountCompleteness, getDealCompleteness, getResearchCompleteness.
- **server/services/leadScoringService.ts**: addScoreFromEvent, addScoreForServicePagesViewed.
- **server/services/leadSegmentationService.ts**: segmentation by filters.

### 1.8 AI Provider Infrastructure
- **OpenAI** used elsewhere: aiAssistanceService, recommendationService, newsletterAIService, blogAIService, imageGenerationService, business-card route. All use OPENAI_API_KEY and degrade when missing.
- **CRM** currently has no LLM integration; scoring and next actions are rule-based.

### 1.9 Background Jobs / Workflows
- No generic job queue. Sequences run via run-step API when triggered. No cron for automated AI refresh.

### 1.10 Best Extension Path for Stage 3
- Add a **single new table** for persisted AI guidance (entityType, entityId, outputType, content JSON) to avoid scattering columns.
- Introduce **provider abstraction** (AIProvider interface, RuleBasedAIProvider, optional LLMProvider) under server/services/ai or server/crm/ai.
- **Reuse** existing insights APIs and lead/account detail pages; add new “AI Guidance” sections and optional “Refresh guidance” action.
- Extend **activity_log type** for AI events; extend **dashboard stats** (or add a lightweight ai-overview endpoint) for Stage 3 metrics.
- **Recommendation → task**: New API to accept recommendation and create task with aiSuggested: true; log activity.

---

## 2. Stage 3 Implementation Plan

| Step | Description |
|------|-------------|
| 1 | **Schema + storage**: Add `crm_ai_guidance` table; extend activity log types; add storage methods and IStorage interface. |
| 2 | **AI provider abstraction**: AIProvider interface, RuleBasedAIProvider (all outputs from CRM data), optional LLM provider placeholder. |
| 3 | **AI guidance service**: generateLeadSummary, generateAccountSummary, generateContactSummary, generateOpportunityAssessment, generateResearchSummary, generateNextBestActions (structured), generateDiscoveryQuestions, generateProposalPrepNotes, generateRiskWarnings, generateFollowUpAngle, generateQualificationGapAnalysis; persist via storage; log activity. |
| 4 | **APIs**: GET/POST guidance for lead (deal/contact), account; POST accept/dismiss recommendation; GET discovery-prep, proposal-prep. |
| 5 | **UI – Lead detail**: Cards/panels for AI Lead Summary, Opportunity Assessment, Qualification Gaps, Next Best Actions, Discovery Questions, Proposal Prep, Risk Warnings; “Refresh guidance”; show provider (rule vs LLM). |
| 6 | **UI – Account detail**: AI Account Summary, opportunity summary, suggested outreach angle, research confidence. |
| 7 | **UI – Contact detail**: AI Contact Summary, next conversation angle, missing info (already has insights; extend with saved guidance). |
| 8 | **UI – Research section**: AI Research Summary, service fit, outreach angle, key issues (on account page research card). |
| 9 | **Recommendation → task**: Accept recommendation creates task, logs activity, marks recommendation used; dismiss stores state. |
| 10 | **Priority logic**: Extend ai priority with labels (low_priority, nurture, watchlist, active, high_value, proposal_ready, urgent_attention) and rationale. |
| 11 | **Activity logging**: Log all Stage 3 events (summary generated, recommendations refreshed, accepted, dismissed, discovery/proposal generated). |
| 12 | **Dashboard**: Add Stage 3 insights (leads missing key data, highest AI priority, proposal-ready, high risk, research confidence, stale opportunities). |
| 13 | **Security & validation**: Admin-only routes; validate entity ownership/access; safe server-side typing; no client secrets. |

---

## 3. File Layout (Target)

| Area | Location |
|------|----------|
| Schema | shared/crmSchema.ts (new table); crmActivityLog type extended in code (string type). |
| Storage | server/storage.ts (IStorage + DatabaseStorage). |
| AI types | shared/crmAiGuidanceTypes.ts or lib/validation/crmAiGuidance.ts. |
| Provider | server/services/ai/crmAiProvider.ts (interface + RuleBasedAIProvider). |
| Guidance service | server/services/crmAiGuidanceService.ts. |
| APIs | app/api/admin/crm/guidance/... (lead, account, recommendation accept/dismiss). |
| UI components | app/components/crm/ or inline in existing pages. |
| Activity types | Extend LogActivityPayload type and activity_log.type in schema comment. |
