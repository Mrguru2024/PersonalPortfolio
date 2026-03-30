# Ascendra Agency Operating System Core — Audit & Implementation Plan

**Status:** Audit complete (codebase review Mar 2026).  
**Goal:** HVD-controlled delivery, role-aware execution, SOP/training-in-the-loop, PM + accountability — without duplicating CRM reminders, CRM tasks, or client agreement milestones.

---

## 1. Executive summary

The codebase already has **strong fragments** of execution intelligence (CRM tasks, discovery/proposal prep, workflow execution logs, admin reminders with role filters, AI admin agent + feature guide, Growth OS, Paid Growth readiness, service agreement **client** milestones). **None** of these form a unified **internal agency PM layer** with mandatory value classification (HVD), task acceptance, SOP linkage, activity timelines, or a first-class training/playbook system tied to work items.

**Strategy:** Introduce a **new bounded context** — `agency_os` (or `aos_*` tables) — that **references** CRM contacts/deals, agreements, admin users, and optional Content Studio / Paid Growth entities. **Do not** overload `crm_tasks` for internal dev/design/ads work (different lifecycle than lead follow-ups); use **optional linking** (`linkedCrmTaskId`, `linkedContactId`, etc.) to avoid silos.

---

## 2. Codebase audit — what exists

### 2.1 User & admin identity

| Area | Location | Relevance |
|------|----------|-----------|
| Users, admin flags, `task_focus` | `shared/schema.ts` (`users`) | "Focus" nudges AI; **not** a full execution role matrix. |
| Super-admin helpers | `lib/super-admin`, scripts | Operational access only. |

**Gap:** No **ExecutionRole** catalog (Strategist, Developer, …) with responsibilities, task types, systems used, AI focus — beyond reminder `roleFilter` (sales / marketing / operations / all).

### 2.2 Tasks, reminders, workflows

| Area | Location | Behavior |
|------|----------|----------|
| **CRM tasks** | `shared/crmSchema.ts` → `crm_tasks` | Lead-centric: `contactId` required, types like call/email/follow_up/proposal_prep. Status: pending/in_progress/completed/cancelled. **No** acceptance flow, HVD, SOP id, or internal project linkage. |
| **Admin reminders** | `admin_reminders`, `business_goal_presets` | Task-like **nudges**; dismiss/snooze/done; links to CRM entities via `relatedType` / `relatedId`. **Not** a project hierarchy. |
| **Workflow executions** | `crm_workflow_executions` | Automation log (trigger → actions). **Not** human task state machine. |
| **Workflow actions** | `server/services/workflows/*` | Event-driven automation; complement, not replace Agency OS tasks. |

**Conclusion:** Extend CRM tasks **only where work is lead-tied** (e.g. “call client”); create **Agency OS tasks** for internal delivery with acceptance + HVD + SOP.

### 2.3 Projects & milestones (existing meanings)

| Name | Meaning | File / table |
|------|---------|--------------|
| **Portfolio `projects`** | Marketing case studies / demos | `shared/schema.ts` `projects` |
| **Project assessments** | Client assessment wizard submissions | `project_assessments` |
| **Service agreement milestones** | **Client billing / legal SOW** checkpoints | `shared/serviceAgreementSchema.ts` → `client_service_agreement_milestones` |
| **Internal Studio** | Document/workflow product (phased) | `Docs/implementation/INTERNAL-STUDIO-PHASE2.md`, services under `server/services/internalStudio` |

**Conclusion:** Agency OS **“Projects / Phases / Milestones”** must use **new names or prefixes** in UI (`Agency project`, `Delivery milestone`) to avoid collision with portfolio and **client** milestones.

### 2.4 Training, SOPs, AI teaching

| Area | Location | Behavior |
|------|----------|----------|
| Admin agent + mentor | `server/services/adminAgentService.ts`, `AdminMentorCompanion` | Contextual help, links to routes, coaching tone. **Not** structured modules/playbooks bound to tasks. |
| Feature guide | `server/services/adminAgentFeatureGuide.ts` | Static product how-tos for the assistant context builder. |
| Operator knowledge | `/admin/agent-knowledge` | Injected prompts; **not** execution SOPs with QA checklists. |
| CRM AI guidance | `crm_ai_guidance` | Entity-bound LLM/rule outputs (summaries, proposal prep). **Not** reusable SOP templates. |

**Gap:** Structured **SOP library**, **playbooks**, **training modules**, and **contextual “why this matters”** panels on Agency OS entities.

### 2.5 Value / impact language (partial)

| Area | Notes |
|------|-------|
| Offer grading | `siteOffers` + grading — offer-level, not a universal feature gate. |
| PPC readiness | `readinessEngine.ts`, scores + blockers — **campaign-specific**, not org-wide HVD. |
| AMIE / market intelligence | Demand/competition framing — not linked to internal build decisions. |
| Client growth snapshot | Client-facing steps (diagnose/build/scale). |

**Gap:** **HVD registry** and mandatory classification on **new internal initiatives** (features, projects, major tasks).

### 2.6 Navigation & discoverability

- **`app/lib/siteDirectory.ts`** — canonical route map for search/agents.
- Admin layout is thin (`AdminLayout` + global tips + agent widget).
- Many hubs: CRM, Growth OS, Content Studio, Paid Growth, Communications, etc.

**Requirement:** New hub **`/admin/agency-os`** (or nested routes) + site directory entries **without** duplicating CRM URLs.

---

## 3. Non-goals (avoid duplication)

1. **Replacing `crm_tasks`** for sales follow-ups — link when relevant.
2. **Replacing `admin_reminders`** — reminders can **spawn** or **reference** Agency OS tasks optionally later.
3. **Renaming portfolio `projects`** — keep as-is; Agency OS uses distinct terminology in UI and schema.
4. **Replacing client `client_service_agreement_milestones`** — optional cross-link (same client engagement).
5. **A second generic workflow engine** — use existing automation where triggers are event-based; Agency OS handles **human** delivery.

---

## 4. Target architecture (high level)

```
HVD Definition (registry)
       ↓
Agency Project (internal) → Phases → Milestones → Agency Tasks → Subtasks
       ↓                          ↓
  ExecutionRole            SOP (optional/generated)
       ↓                          ↓
  Assignment / Acceptance    Training snippet + Playbook link
       ↓
  Task Activity Log (append-only events)
       ↓
  Metrics: tie to CRM (lead/deal), revenue ops, or manual impact metric fields
```

### 4.1 proposed schema modules (names illustrative)

| Table | Purpose |
|-------|---------|
| `aos_hvd_categories` | Enum-like seed + optional custom labels (align to your 9 categories). |
| `aos_value_contributions` | Flags: leads, conversions, revenue, retention, efficiency, visibility, training. |
| `aos_hvd_definitions` | Registry rows: slug, name, description, default metrics hints. |
| `aos_execution_roles` | Built-in + custom; JSON for responsibilities, taskTypes, systemsUsed, aiFocus. |
| `aos_user_role_assignments` | Map `userId` → `executionRoleId` (many-to-many if needed). |
| `aos_sops` | Title, purpose, roleId, primaryHvdId, tools, steps[], mistakes[], qaChecklist[], successCriteria. |
| `aos_playbooks` | Ordered steps; links to HVD + suggested task templates. |
| `aos_training_modules` | Modules (markdown/JSON sections); `roleId` / `hvdId` optional filters. |
| `aos_agency_projects` | Name, status, health, progressPct, primaryHvdId, secondary HVD M2M, ownerUserIds, optional crmAccountId / agreementId. |
| `aos_project_phases` | order, name, dates. |
| `aos_milestones` | phaseId, name, dueAt, approval state, blocker flag. |
| `aos_tasks` | projectId?, milestoneId?, title, description, roleId, assigneeUserId, hvd linkage, sopId, status (draft/pending_acceptance/active/blocked/done), acceptance fields. |
| `aos_task_events` | taskId, eventType (assigned, accepted, declined, clarification_requested, status_change, comment, sop_viewed, ai_assist, blocker, approval), actorUserId, payload JSON, createdAt. |

**Indexes:** task assignee, project status, due dates, HVD id for registry dashboard queries.

---

## 5. Validation & scoring (HVD layer)

- **On create/update** of `aos_agency_projects` and **standalone strategic** `aos_tasks` (configurable): require `primaryHvdId`, at least one **value contribution**, `expectedOutcome`, `impactMetric`, `dataSource`, `priority`.
- **Derived scores** (stored or computed): Value Fit, Measurability (presence/quality of metric + data source), Strategic Importance (priority + HVD weight).
- **Overlap warning:** heuristic match against `siteDirectory` keywords + existing module names (simple string/embedding later); flag, don’t hard-block unless exact slug collision.

---

## 6. Task acceptance flow (UX)

1. Assignee opens task → sees purpose, HVD summary, expected output, impact line.
2. Actions: **Accept** | **Request clarification** (opens thread / comment + notifies assigner) | **Decline** (reason required).
3. Log all transitions in `aos_task_events`.

---

## 7. SOP & training

- Task optional `sopId`. If missing and OpenAI configured: **generate draft SOP** → admin review → save as `aos_sops`.
- **Contextual training:** resolve snippets by `task.type` / `roleId` / `phase` / `primaryHvdId` from `aos_training_modules` and `aos_playbooks`.
- **Admin agent:** extend feature guide with **routes only**; long content lives in DB modules to avoid bloating prompts.

---

## 8. UI / navigation (admin-first)

Suggested IA under **`/admin/agency-os`**:

| Section | Path sketch |
|---------|-------------|
| Command / dashboard | `/admin/agency-os` |
| Value rules (HVD registry) | `/admin/agency-os/hvd` |
| Execution roles | `/admin/agency-os/roles` |
| SOP center | `/admin/agency-os/sops` |
| Projects | `/admin/agency-os/projects`, `[id]` |
| Task inbox (acceptance) | `/admin/agency-os/tasks` |
| Activity / audit | `/admin/agency-os/activity` |
| Training center | `/admin/agency-os/training` |
| Playbooks | `/admin/agency-os/playbooks` |

Use existing **shadcn** components, dark mode, patterns from CRM admin pages.

---

## 9. Implementation phases (ordered)

| Phase | Deliverable | Risk if skipped |
|-------|-------------|-----------------|
| **1** | Drizzle schema + `db:push` + seed (HVD categories, default roles, 1–2 sample playbooks) | No foundation |
| **2** | HVD registry CRUD API + admin UI + validation helpers | No value gate |
| **3** | Execution roles CRUD + user assignment + assistant context hook (role summary in agent context) | Roles drift |
| **4** | Agency projects + phases + milestones + health/progress + link to CRM/agreement optional | PM still external |
| **5** | Agency tasks + acceptance + events log + linking to milestones | No accountability |
| **6** | SOP CRUD + task link + optional AI draft route | No execution layer |
| **7** | Training modules + playbooks + contextual panels on task/project pages | “Not theory” unmet |
| **8** | Kanban/table/timeline views; executive rollup; site directory; feature guide; E2E smoke | Low adoption |

---

## 10. Success metrics (definition of done)

- New agency **project** cannot be saved without passing HVD validation (per policy).
- Tasks in **pending_acceptance** cannot move to **active** without accept or clarification loop.
- Every task state change has a **timestamped event** and visible timeline.
- At least one **training module** surfaces on a task detail without manual paste.
- No naming collision confusion with portfolio projects or client agreement milestones in UI copy.

---

## 11. Open decisions (product)

1. **Single vs multi assignee** on tasks (v1: single assignee + watchers later).
2. **Who can override HVD** (super-admin only vs PM role).
3. **Client visibility** (v1 internal-only; client portal later).

---

*Next step: implement Phase 1–2 in repo (schema + HVD registry + APIs) per sprint planning.*
