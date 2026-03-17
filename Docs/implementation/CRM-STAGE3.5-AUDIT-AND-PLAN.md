# CRM Stage 3.5 — Proposal Builder + Discovery Workspace + Sales Playbook — Audit & Plan

## 1. Audit Summary

### 1.1 CRM Entities and Relationships
- **crm_contacts**: lead/client; accountId FK; status, leadScore, outreachState, nurtureState, sequenceReady.
- **crm_deals**: contactId, accountId; pipelineStage (new_lead → proposal_ready → won/lost); serviceInterest, primaryPainPoint, budgetRange, expectedCloseAt.
- **crm_accounts**: company; research profile 1:1 per account.
- **crm_research_profiles**: accountId, contactId; companySummary, suggestedServiceFit, suggestedOutreachAngle, researchConfidence.
- **crm_tasks**: contactId, relatedDealId, relatedAccountId; type, status, aiSuggested.
- **crm_activity_log**: contactId, accountId, dealId, taskId; type, title, content, metadata.
- **crm_ai_guidance**: entityType, entityId, outputType, content (JSON); lead_summary, discovery_questions, proposal_prep, risk_warnings, qualification_gaps, etc.

### 1.2 AI Guidance Outputs (Stage 3)
- generateAndPersistLeadGuidance / generateAndPersistAccountGuidance.
- Persisted: lead_summary, opportunity_assessment, next_best_actions, discovery_questions, proposal_prep, risk_warnings, qualification_gaps, contact_summary, follow_up_angle, ai_priority.
- GET/POST /api/admin/crm/guidance/contact/[id], guidance/account/[id].

### 1.3 Task and Activity Systems
- createCrmTask, updateCrmTask; createCrmActivityLog; logActivity(storage, payload) with types note, task_created, ai_guidance_generated, etc.
- Timeline API merges activity log with activities, comm events, doc events.

### 1.4 Lead/Account/Contact Detail Pages
- **Lead (contact)**: /admin/crm/[id] — contact card, AI Guidance card, Workflow & outreach, Next best actions, Timeline, Tasks, Notes, etc.
- **Account**: /admin/crm/accounts/[id] — details, contacts, leads, research, AI Account Summary, activity.
- **Pipeline**: /admin/crm/pipeline — deals by stage; link to contact.

### 1.5 Pipeline and Stage Logic
- pipelineStage: new_lead | researching | qualified | proposal_ready | follow_up | negotiation | won | lost | nurture.
- Deal PATCH triggers workflows (proposal_ready, won, lost).

### 1.6 Research Profile
- getCrmResearchProfileByAccountId; create/update research profile; used by AI guidance and completeness.

### 1.7 Existing Proposal/Quote/Discovery
- **projectAssessments** (shared/schema): public assessment funnel; assessmentData, pricingBreakdown; linked to clientQuotes.
- **clientQuotes**: assessmentId, proposalData, totalAmount; view token for client.
- **proposalService**: generates proposal document from assessment (different funnel from CRM).
- **No** internal CRM-native discovery or proposal-prep workspace yet.

### 1.8 Best Extension Path
- Add **crm_discovery_workspaces** and **crm_proposal_prep_workspaces** (link to contactId, dealId, accountId); use JSON for structured note sections.
- Add **crm_sales_playbooks** for reusable checklists and guidance.
- Reuse Stage 3 guidance: fetch discovery_questions and proposal_prep for a contact/deal and surface in workspace UI.
- Add activity log types for discovery_workspace_created, proposal_prep_created; optional follow-up task creation from checklist gaps.
- Entry points: lead detail, account detail, pipeline/deal context — "Discovery workspace" and "Proposal prep" links.

---

## 2. Stage 3.5 Implementation Plan

| Step | Description |
|------|-------------|
| 1 | **Schema**: crm_discovery_workspaces, crm_proposal_prep_workspaces, crm_sales_playbooks. |
| 2 | **Storage**: CRUD for discovery, proposal prep, playbooks; get by contact/deal/account. |
| 3 | **Discovery questions**: Default question sets by category; service to merge with AI guidance when available. |
| 4 | **APIs**: Discovery workspace GET/POST/PATCH; proposal prep GET/POST/PATCH; playbook GET list + GET by id; discovery questions GET. |
| 5 | **Discovery workspace UI**: Page with linked lead/account, call info, notes sections, outcome panel, recommended questions (default + AI). |
| 6 | **Proposal prep UI**: Page with scope, assumptions, checklist, readiness; link to AI proposal_prep. |
| 7 | **Sales playbook UI**: List + detail; optional link from discovery/prep. |
| 8 | **Entry points**: Lead detail and account detail — buttons/links to Discovery workspace and Proposal prep. |
| 9 | **Activity + task**: Log on create/update; optional "Create follow-up tasks" from missing checklist items. |
| 10 | **Dashboard**: Optional counts (discovery incomplete, proposal prep in progress). |
| 11 | **Deliverables**: Architecture summary, files created/modified, DB changes, manual test checklist. |
