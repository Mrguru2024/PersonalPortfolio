# CRM Stage 4 — Workflow Automation + Sequence-Ready Action System — Audit & Plan

## 1. Audit Summary

### 1.1 Current CRM Models
- **crm_contacts**: type, name, email, phone, company, jobTitle, accountId, source, status, leadScore, intentLevel, lifecycleStage, lastActivityAt, tags, customFields, **outreachState, nurtureState, sequenceReady, lastOutreachAt, nextFollowUpAt, doNotContact, nurtureReason, lostReason, responseStatus, reactivationEligible** (Stage 4).
- **crm_deals**: contactId, accountId, title, value, pipelineStage, serviceInterest, primaryPainPoint, urgencyLevel, budgetRange, expectedCloseAt, leadScore, aiPriorityScore, etc.
- **crm_tasks**: contactId, relatedDealId, relatedAccountId, type, title, priority, dueAt, status, aiSuggested, sequenceEnrollmentId.
- **crm_activity_log**: contactId, accountId, dealId, taskId, type, title, content, metadata.
- **crm_alerts**: leadId, alertType, title, message, metadata, readAt. (proposal_opened | site_revisit | pricing_click | etc.)
- **crm_ai_guidance**: entityType, entityId, outputType, content, providerType (Stage 3).
- **crm_research_profiles**: accountId, contactId, companySummary, suggestedServiceFit, researchConfidence, etc.

### 1.2 Task System
- createCrmTask, updateCrmTask, getCrmTasks (by contact, filters). Tasks support type, priority, dueAt, status, aiSuggested, sequenceEnrollmentId. No workflow-origin flag yet (can use aiSuggested or add workflowGenerated).

### 1.3 Activity Logging
- createCrmActivityLog; getCrmActivityLogByContactId, ByAccountId, ByDealId. Types include note, stage_change, task_created, task_completed, ai_guidance_generated, ai_recommendation_accepted. Timeline API merges activity log with activities, comm events, doc events, visitor activity.

### 1.4 Scoring & AI Guidance
- leadScoringService: addScoreFromEvent, addScoreForServicePagesViewed.
- crmFoundationService: calculateAiFitScore, calculateAiPriorityScore, generateNextBestActions, logActivity.
- crmAiGuidanceService: generateAndPersistLeadGuidance, generateAndPersistAccountGuidance; loadCrmAiContextForContact/ForAccount.

### 1.5 Dashboard / Insights
- getCrmDashboardStats: totalContacts, totalAccounts, totalActiveLeads, leadsMissingData, proposalReadyCount, leadsByPipelineStage, recentTasks, overdueTasks, recentActivity, accountsNeedingResearch, topSources, topTags.
- Insights APIs: GET insights/contact/[id], insights/deal/[id] (completeness, scores, nextBestActions).

### 1.6 Server Action / Route Patterns
- Admin routes use isAdmin(req). Storage is singleton. createCrmContact/createCrmDeal/updateCrmDeal in API routes and leadFromFormService. No central “after create” hook; we will add workflow invocation in callers or wrap storage in a thin layer that fires workflows.

### 1.7 Queue / Job / Workflow Infra
- **None.** No cron, no job queue, no webhook runner. Sequences run via manual run-step API. We will use **synchronous** workflow execution from existing code paths and an optional **manual admin trigger** for stale-check.

### 1.8 Email / Notification
- **emailService** (Brevo) exists; used for transactional and newsletters. createCrmAlert exists for in-app alerts. We will use createCrmAlert for workflow-driven internal alerts; optional notify_admin via email later.

### 1.9 Best Extension Path
- Add **workflow execution log** table and **outreach/nurture state** fields on contact (and optionally deal) without breaking existing APIs.
- Build **workflow engine** (registry, triggers, conditions, actions, execution logger) in server/services/workflows; invoke **synchronously** from key points (contact create, deal create/update, task complete, form submission, guidance generated).
- Add **manual stale-check** API and document how to call it from a future cron.
- Reuse logActivity, createCrmAlert, createCrmTask, crmAiGuidanceService; keep workflow definitions in code (no DB-driven workflow builder in Stage 4).

---

## 2. Stage 4 Implementation Plan

| Step | Description |
|------|-------------|
| 1 | **Schema**: Add crm_workflow_executions; add outreach/nurture/sequence fields to crm_contacts (and optionally crm_deals). |
| 2 | **Workflow types**: Trigger types, action types, WorkflowDefinition, ExecutionLog, condition/action signatures. |
| 3 | **Conditions**: Evaluators for qualification score, lead score, stage, has research, etc. |
| 4 | **Actions**: Executors for create_task, update_lead_stage, update_contact_tags, log_activity, create_alert, generate_ai_summary, update_outreach_state, etc. |
| 5 | **Registry**: Default workflow definitions (new lead, audit completed, proposal ready, stale lead, missing qualification, missing research, won/lost). |
| 6 | **Engine**: fire(trigger, payload) → find workflows → evaluate conditions → execute actions → log execution. |
| 7 | **Invocation**: Call engine from contact create, deal create/update (stage change), task complete, form completion (leadFromFormService), guidance generated; optional stale-check API. |
| 8 | **UI**: Lead/account detail – outreach state, nurture state, sequence ready, last workflow; dashboard – follow-up needed, stale, nurture, sequence-ready counts; alerts panel. |
| 9 | **Alerts**: Extend createCrmAlert usage for workflow-driven alert types. |
| 10 | **Security & deliverables**: Admin-only routes; validation; Stage 4 deliverable doc and manual test checklist. |
