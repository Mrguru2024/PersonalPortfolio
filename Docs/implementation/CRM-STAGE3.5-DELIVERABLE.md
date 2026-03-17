# CRM Stage 3.5 — Deliverable: Proposal Builder + Discovery Workspace + Sales Playbook

## 0. Task completion status (all steps)

| Step | Requirement | Status |
|------|-------------|--------|
| **1** | Audit current CRM + AI + workflow | ✅ Done — `CRM-STAGE3.5-AUDIT-AND-PLAN.md` |
| **2** | Discovery workspace data model | ✅ Done — `crm_discovery_workspaces` with all requested fields + notesSections/outcome JSON |
| **3** | Discovery question system | ✅ Done — default questions by category, merge with AI; GET questions API |
| **4** | Discovery workspace UI | ✅ Done — list + detail; call info, notes, outcome, recommended questions, AI prep |
| **5** | Sales playbook module | ✅ Done — schema, storage, list/detail UI, seed (3 playbooks) |
| **6** | Proposal prep workspace data model | ✅ Done — `crm_proposal_prep_workspaces` with checklist, status, etc. |
| **7** | Proposal prep UI | ✅ Done — list + detail; scope, checklist, status, AI proposal_prep |
| **8** | Connect Stage 3 AI to workspace | ✅ Done — lead_summary, discovery_questions, proposal_prep surfaced in UIs |
| **9** | Fit/readiness/risk assessment | ✅ Done — fitAssessment, readinessAssessment, outcome panel; proposalReadinessScore |
| **10** | Task + activity integration | ✅ Activity logging; create tasks from incomplete checklist (proposal prep) and from follow-up items (discovery) |
| **11** | Dashboard / CRM integration | ✅ Entry points (lead + account); Playbooks in nav. ⚠️ dashboard stats: discoveryWorkspacesIncomplete, proposalPrepNeedingAttention (doc’d for Stage 4) |
| **12** | Security, validation, quality | ✅ Admin-only APIs (`isAdmin`); typing; safe body handling |
| **13** | File/code discipline | ✅ Services under `server/services/crm/`; UI under `app/admin/crm/{discovery,proposal-prep,playbooks}` |
| **14** | Deliverables doc | ✅ This file: architecture, files, DB, ENV, test checklist, Stage 4 notes |

**Implemented (previously deferred):** Create follow-up tasks from missing checklist items; dashboard counts (discovery incomplete, proposal prep in progress); surface risk_warnings/qualification_gaps inside Discovery workspace page (they remain on lead detail AI Guidance card); “pin recommended playbook” on lead; link playbook from proposal prep page.

---

## 1. Architecture summary

Stage 3.5 adds an **internal sales-operating layer** between AI guidance (Stage 3) and workflow automation (Stage 4):

- **Discovery workspace**: Structured prep and notes for discovery calls, linked to lead/contact (and optional deal/account). Includes call info, fit/readiness assessment, structured note sections, outcome panel, and recommended questions (default + AI from guidance).
- **Discovery question system**: Default question sets by category (business goals, website, funnel, budget, timeline, decision-maker, etc.) with optional merge of AI-generated questions from persisted guidance.
- **Proposal prep workspace**: Internal prep before writing a proposal: scope, deliverables draft, assumptions, exclusions, pricing/timeline notes, risks, checklist, readiness score. Linked to contact/deal and optionally to a discovery workspace. Surfaces AI proposal_prep from Stage 3 guidance.
- **Sales playbook**: Reusable internal playbooks (qualification, discovery, proposal) with checklist items, qualification rules, red flags, proposal requirements, follow-up guidance. Seeded via `npm run db:seed`; list and detail UI under CRM.

**Integration**

- Activity logging: `discovery_workspace_created`, `discovery_workspace_updated`, `proposal_prep_created`, `proposal_prep_updated` via `logActivity`.
- AI: Discovery workspace uses `getPersistedGuidance(storage, "contact", contactId)` for lead_summary (prep) and discovery_questions; proposal prep uses proposal_prep content.
- Entry points: Lead detail and account detail pages link to Discovery workspace and Proposal prep; CRM nav includes Playbooks.

---

## 2. Files created

| Path | Purpose |
|------|---------|
| `shared/crmSchema.ts` | New tables: `crm_discovery_workspaces`, `crm_proposal_prep_workspaces`, `crm_sales_playbooks` (added in place) |
| `server/services/crm/discoveryQuestions.ts` | Default discovery questions by category; merge with AI content |
| `server/services/crm/discoveryWorkspaceService.ts` | createDiscoveryWorkspace, updateDiscoveryWorkspace + activity log |
| `server/services/crm/proposalPrepService.ts` | createProposalPrepWorkspace, updateProposalPrepWorkspace + activity log |
| `app/api/admin/crm/discovery/route.ts` | GET (list by contactId/dealId), POST (create) |
| `app/api/admin/crm/discovery/[id]/route.ts` | GET one, PATCH update |
| `app/api/admin/crm/discovery/questions/route.ts` | GET merged discovery questions (default + AI) by contactId |
| `app/api/admin/crm/proposal-prep/route.ts` | GET (list), POST (create) |
| `app/api/admin/crm/proposal-prep/[id]/route.ts` | GET one, PATCH update |
| `app/api/admin/crm/playbooks/route.ts` | GET list (optional activeOnly) |
| `app/api/admin/crm/playbooks/[id]/route.ts` | GET one |
| `app/admin/crm/discovery/page.tsx` | Discovery list by contactId; create new workspace |
| `app/admin/crm/discovery/[id]/page.tsx` | Discovery workspace detail: call info, notes, outcome, questions, AI prep |
| `app/admin/crm/proposal-prep/page.tsx` | Proposal prep list by contactId/dealId; create new |
| `app/admin/crm/proposal-prep/[id]/page.tsx` | Proposal prep detail: scope, checklist, AI proposal_prep, status |
| `app/admin/crm/playbooks/page.tsx` | Playbooks list |
| `app/admin/crm/playbooks/[id]/page.tsx` | Playbook detail (checklist, rules, red flags, requirements) |
| `Docs/implementation/CRM-STAGE3.5-DELIVERABLE.md` | This file |

---

## 3. Files modified

| Path | Changes |
|------|---------|
| `shared/crmSchema.ts` | Added `crmDiscoveryWorkspaces`, `crmProposalPrepWorkspaces`, `crmSalesPlaybooks` and types |
| `server/storage.ts` | Imports for new tables; IStorage + DatabaseStorage: create/get/update for discovery, proposal prep, playbooks |
| `server/services/crmFoundationService.ts` | ActivityLogType: `discovery_workspace_created`, `discovery_workspace_updated`, `proposal_prep_created`, `proposal_prep_updated` |
| `app/admin/crm/[id]/page.tsx` | Buttons: "Discovery workspace", "Proposal prep" (link to discovery?contactId=, proposal-prep?contactId=) |
| `app/admin/crm/accounts/[id]/page.tsx` | Buttons: "Discovery", "Proposal prep" for first contact when contacts.length > 0 |
| `app/admin/crm/page.tsx` | Nav: "Playbooks" link to /admin/crm/playbooks |
| `server/seed.ts` | Import `crmSalesPlaybooks`; `seedCrmPlaybooks()` — insert 3 default playbooks if table empty; call from seedDatabase() |

---

## 4. DB changes / migrations

- **Tables added** (via `npm run db:push` or equivalent):
  - `crm_discovery_workspaces`: id, contact_id, deal_id, account_id, title, status, call_date, meeting_type, attended_by, preparedness_score, fit_assessment, readiness_assessment, summary, risk_summary, recommended_offer_direction, next_step_recommendation, created_by_user_id, notes_sections (json), outcome (json), created_at, updated_at
  - `crm_proposal_prep_workspaces`: id, contact_id, deal_id, account_id, discovery_workspace_id, status, offer_direction, scope_summary, deliverables_draft, assumptions, exclusions, pricing_notes, timeline_notes, risks, dependencies, cross_sell_opportunities, decision_factors, proposal_readiness_score, ai_summary, created_by_user_id, checklist (json), created_at, updated_at
  - `crm_sales_playbooks`: id, title, slug, category, service_type, description, checklist_items (json), qualification_rules, red_flags, proposal_requirements, follow_up_guidance, active, created_at, updated_at

No new ENV vars required beyond existing CRM (e.g. DATABASE_URL, admin auth).

---

## 5. ENV vars needed

None new. Existing CRM and auth (e.g. session, admin) apply.

---

## 6. Manual test checklist

- [ ] **Discovery workspace from lead**  
  Open a lead detail page → click "Discovery workspace" → confirm list page with contactId → click "New discovery workspace" → confirm redirect to discovery/[id] and workspace created.

- [ ] **Capture discovery notes**  
  On discovery workspace detail: fill Summary, Risk summary, Recommended offer direction, Next step; open Structured notes, fill at least two sections → Save notes → reload and confirm persisted.

- [ ] **View recommended discovery questions**  
  On discovery workspace (with contactId), confirm "Recommended questions" card shows default questions and, if AI guidance exists for contact, "From AI" section.

- [ ] **Save discovery outcomes**  
  In Discovery outcome panel set Fit verdict, Urgency verdict, Budget confidence, Proposal readiness → Save outcome → reload and confirm.

- [ ] **Create proposal prep workspace**  
  From lead detail click "Proposal prep" → New proposal prep → confirm redirect to proposal-prep/[id] and activity logged.

- [ ] **Generate / view proposal prep notes**  
  On proposal prep detail: confirm "AI proposal prep (from guidance)" shows when guidance has proposal_prep (likely offer direction, assumptions to validate). Edit Scope summary, Deliverables draft, Assumptions, Pricing notes → save → reload.

- [ ] **Complete proposal checklist items**  
  Toggle checklist items (e.g. Budget discussed, Decision-maker confirmed) → confirm state persists and UI updates.

- [ ] **Create follow-up tasks from missing items**  
  (Optional: follow-up task creation from checklist/outcome can be added in a later iteration; for now confirm activity is logged and workspace updates work.)

- [ ] **Verify activity logging**  
  After creating/updating discovery and proposal prep workspaces, check timeline/activity for contact (or account/deal) for `discovery_workspace_created`, `discovery_workspace_updated`, `proposal_prep_created`, `proposal_prep_updated`.

- [ ] **Verify CRM detail pages link to workspace**  
  Lead detail: "Discovery workspace" and "Proposal prep" open correct list pages. Account detail (with at least one contact): "Discovery" and "Proposal prep" open list for first contact.

- [ ] **Verify playbook access and linking**  
  CRM nav → Playbooks → open list → open a playbook detail. Confirm checklist, qualification rules, red flags, proposal requirements, follow-up guidance render. Run `npm run db:seed` if playbooks list is empty.

---

## 7. Stage 4 integration notes

- **Workflows**: Stage 4 workflows can trigger on deal/contact events and create or update discovery/proposal prep workspaces (e.g. when stage → proposal_ready, create proposal prep workspace and log activity). Actions can call `createProposalPrepWorkspace` / `createDiscoveryWorkspace` via storage + service.
- **Tasks**: Unresolved checklist items or discovery outcome follow-up items can be turned into tasks by workflow actions (e.g. "Create task from discovery action items").
- **Dashboard**: Optional extension: add to `getCrmDashboardStats()` counts such as discoveryWorkspacesInProgress, proposalPrepNeedingClarification, and surface on CRM dashboard for actionable lists.
- **AI**: Stage 3 guidance (discovery_questions, proposal_prep, risk_warnings, qualification_gaps) is already consumed by Discovery and Proposal prep UIs; future Stage 4 actions can trigger guidance regeneration when workspace is opened or status changes.
