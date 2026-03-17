# CRM Stage 4 — Workflow Automation + Sequence-Ready Action System — Deliverable

## 1. Stage 4 Architecture Summary

- **Workflow engine**: Synchronous execution in `server/services/workflows/`. **Registry** holds workflow definitions (key, trigger, conditions, actions). **Engine** `fireWorkflows(storage, triggerType, payload)` finds matching workflows, evaluates conditions, runs actions via **actions.ts**, and logs each run to **crm_workflow_executions**.
- **Triggers**: contact_created, lead_created, opportunity_marked_proposal_ready, opportunity_marked_won, opportunity_marked_lost, ai_summary_generated, recommendation_accepted, form_completed, stale_lead_detected, missing_research_detected, missing_qualification_detected (and others defined in types).
- **Conditions**: alwaysTrue, contactHasAccount, noActivityForDays(n), leadScoreAbove(n), qualificationScoreAbove(n), dealStageIs(s), hasResearch.
- **Actions**: create_task, update_outreach_state, update_nurture_state, mark_sequence_ready, mark_follow_up_required, mark_needs_research, update_tags, update_lead_stage, log_activity, create_internal_alert, generate_ai_summary, generate_proposal_prep, generate_next_best_actions, set_do_not_contact, etc. (stubs for notify_admin, recalculate_score where not yet implemented).
- **Sequence-ready / outreach state**: Stored on **crm_contacts**: outreachState, nurtureState, sequenceReady, lastOutreachAt, nextFollowUpAt, doNotContact, nurtureReason, responseStatus, reactivationEligible. **crm_deals** has lostReason. Workflow actions update these fields.
- **Execution log**: **crm_workflow_executions** (workflowKey, triggerType, relatedEntityType, relatedEntityId, executedActions, status, startedAt, finishedAt, errorMessage, metadata). Persisted after each workflow run.
- **Invocation**: contact create → contact_created; deal create → lead_created; deal PATCH (stage change) → opportunity_marked_proposal_ready | won | lost; guidance contact POST → ai_summary_generated; recommendation accept → recommendation_accepted. **Stale-check**: POST `/api/admin/crm/workflows/run-stale-check` runs detection for stale leads, missing research, missing qualification and fires the corresponding triggers (capped per category).
- **UI**: Lead detail shows **Workflow & outreach** card (outreachState, nurtureState, sequenceReady, nextFollowUpAt, doNotContact, nurtureReason, last workflow run). Dashboard shows **Follow-up needed** and **Sequence ready** counts plus existing Proposal ready, Leads missing data, Accounts needing research. **Workflow executions** API: GET by entityType + entityId for timeline/history.
- **Alerts**: Workflow action **create_internal_alert** uses existing createCrmAlert (leadId, alertType, title, message). No new alert table; existing alerts panel shows workflow-created alerts.

## 2. Files Created

| File | Purpose |
|------|---------|
| `server/services/workflows/types.ts` | WorkflowTriggerType, WorkflowActionType, WorkflowPayload, WorkflowContext, WorkflowDefinition, WorkflowExecutionResult |
| `server/services/workflows/conditions.ts` | leadScoreAbove, contactHasAccount, noActivityForDays, alwaysTrue, etc. |
| `server/services/workflows/actions.ts` | executeAction for create_task, update_outreach_state, update_nurture_state, mark_sequence_ready, mark_follow_up_required, mark_needs_research, update_tags, log_activity, create_internal_alert, generate_ai_summary, set_do_not_contact, etc. |
| `server/services/workflows/registry.ts` | Default workflows: new_qualified_lead, form_completed, proposal_ready, stale_lead, missing_qualification, missing_research, opportunity_won, opportunity_lost, after_ai_summary, after_recommendation_accepted |
| `server/services/workflows/engine.ts` | fireWorkflows, buildPayloadFromContactId, buildPayloadFromDealId |
| `server/services/workflows/staleCheck.ts` | runStaleCheck(storage, options) — detects stale leads, missing research, missing qualification; fires workflows (capped) |
| `server/services/workflows/index.ts` | Public exports: fireWorkflows, buildPayloadFromContactId/DealId, getWorkflowsByTrigger, getAllWorkflows, runStaleCheck |
| `app/api/admin/crm/workflows/run-stale-check/route.ts` | POST — run stale-check (admin only) |
| `app/api/admin/crm/workflows/executions/route.ts` | GET ?entityType=&entityId= — list workflow executions for entity |
| `Docs/implementation/CRM-STAGE4-AUDIT-AND-PLAN.md` | Audit and plan (updated) |
| `Docs/implementation/CRM-STAGE4-DELIVERABLE.md` | This deliverable |

## 3. Files Modified

| File | Changes |
|------|---------|
| `shared/crmSchema.ts` | **crm_contacts**: outreachState, nurtureState, sequenceReady, lastOutreachAt, nextFollowUpAt, doNotContact, nurtureReason, responseStatus, reactivationEligible. **crm_deals**: lostReason. **crm_workflow_executions** table. |
| `server/storage.ts` | createCrmWorkflowExecution, getCrmWorkflowExecutionsByEntity; getCrmDashboardStats: followUpNeededCount, sequenceReadyCount |
| `app/api/admin/crm/dashboard/route.ts` | Fallback response includes followUpNeededCount: 0, sequenceReadyCount: 0 |
| `app/api/admin/crm/contacts/route.ts` | After createCrmContact, fireWorkflows(storage, "contact_created", payload) |
| `app/api/admin/crm/deals/route.ts` | After createCrmDeal, fireWorkflows(storage, "lead_created", payload) |
| `app/api/admin/crm/deals/[id]/route.ts` | On PATCH pipelineStage change, fire proposal_ready | won | lost |
| `app/api/admin/crm/guidance/contact/[id]/route.ts` | After generateAndPersistLeadGuidance, fire ai_summary_generated |
| `app/api/admin/crm/guidance/recommendation/accept/route.ts` | After logActivity, fire recommendation_accepted |
| `app/admin/crm/dashboard/page.tsx` | DashboardStats: followUpNeededCount, sequenceReadyCount; cards "Follow-up needed", "Sequence ready" |
| `app/admin/crm/[id]/page.tsx` | CrmContact: outreachState, nurtureState, sequenceReady, nextFollowUpAt, doNotContact, nurtureReason, accountId; query workflow executions; "Workflow & outreach" card |

## 4. DB Changes / Migrations

- **crm_contacts**: Columns outreach_state, nurture_state, sequence_ready, last_outreach_at, next_follow_up_at, do_not_contact, nurture_reason, response_status, reactivation_eligible (if not already present).
- **crm_deals**: Column lost_reason (if not already present).
- **crm_workflow_executions**: id, workflow_key, trigger_type, related_entity_type, related_entity_id, executed_actions (json), status, started_at, finished_at, error_message, metadata (json), created_at.

Run `npm run db:push` (or apply migrations) to ensure tables/columns exist.

## 5. ENV Vars Needed

- None required for Stage 4. Workflow execution is synchronous and uses existing storage and AI guidance services. Optional future: cron URL or worker for run-stale-check.

## 6. Manual Test Checklist

- [ ] **Trigger new lead workflow**: Create a new contact via CRM → check activity log / workflow executions for contact; confirm tags, outreach state, task, and optional alert (new_qualified_lead).
- [ ] **Trigger lead_created**: Create a new deal → confirm lead_created workflow runs if defined (e.g. tags, task).
- [ ] **Trigger proposal_ready**: Edit a deal, set pipeline stage to proposal_ready → confirm proposal_ready workflow (proposal prep, task, activity).
- [ ] **Trigger won/lost**: Set deal to won or lost → confirm opportunity_won / opportunity_lost workflow (activity, outreach/nurture state).
- [ ] **Trigger ai_summary_generated**: On lead detail, click "Generate guidance" → confirm ai_summary_generated workflow runs (e.g. log activity).
- [ ] **Trigger recommendation_accepted**: Accept an AI recommendation (Add task) → confirm recommendation_accepted workflow runs.
- [ ] **Run stale-check**: POST /api/admin/crm/workflows/run-stale-check (e.g. from fetch or Postman) as admin → confirm response has staleLeadCount, missingResearchCount, missingQualificationCount, workflowsFired; confirm workflow executions for affected entities.
- [ ] **Create automation-generated task**: Trigger any workflow that creates a task (e.g. new lead, proposal ready, stale lead) → confirm task appears and activity log shows workflow/task created.
- [ ] **Verify nurture/outreach state updates**: Trigger workflow that sets outreach or nurture state (e.g. opportunity_lost → nurture; stale_lead → follow_up_due) → on lead detail confirm Workflow & outreach card shows updated state.
- [ ] **Verify internal alerts**: Trigger workflow that creates internal alert (e.g. new_qualified_lead) → confirm alert appears in CRM alerts for that lead.
- [ ] **Verify workflow execution logs**: After any triggered workflow, GET /api/admin/crm/workflows/executions?entityType=contact&entityId=<id> → confirm latest run with workflowKey, status, executedActions. On lead detail, confirm "Last automation" in Workflow & outreach card.
- [ ] **Verify AI guidance regeneration**: Trigger proposal_ready workflow → confirm proposal prep generation (or full lead guidance) where action is generate_proposal_prep / generate_ai_summary.
- [ ] **Dashboard**: Confirm CRM dashboard shows Follow-up needed and Sequence ready counts; Proposal ready, Leads missing data, Accounts needing research unchanged.

## 7. Post–Stage 4 Readiness Notes

- **Cron / scheduler**: To run stale-check on a schedule, call POST /api/admin/crm/workflows/run-stale-check from a cron job or serverless function (e.g. Vercel Cron) with admin auth. Document the endpoint and recommend maxPerCategory/staleDays for production.
- **form_completed / audit_completed**: Workflows are defined; trigger them from the code path that creates/updates a contact after a form or assessment (e.g. ensureCrmLeadFromFormSubmission or assessment submit). Optionally add trigger when linking assessment to CRM contact.
- **Task workflow flag**: Optional column workflow_generated on crm_tasks can be added and set in create_task action to distinguish automation-created tasks in lists.
- **Notify admin / owner**: notify_admin and notify_owner actions are stubs; integrate with emailService or existing notification when needed.
- **More workflows**: Add definitions for task_completed, research_profile_updated, lead_stage_changed in registry and invoke from deal PATCH (any stage change) or research profile save.
