# Lead Control System — Audit, Architecture, and Implementation Plan

## Non-negotiable implementation constraints

Lead Control is **not** a disconnected CRM replacement and **must not** introduce a parallel lead database, task system, or analytics warehouse. It plugs into the existing Ascendra OS surfaces:

| Area | Rule |
|------|------|
| **Leads** | `crm_contacts` (and linked `crm_deals`) remain the single source of truth; extend columns and APIs, do not fork `leads` tables. |
| **Funnel & attribution** | Intake and form paths keep using current funnel, forms, and CRM ensure flows; Lead Control reads/writes the same records and activity log. |
| **Campaigns & communications** | Email Hub, newsletters, Content Studio, and paid growth stay canonical for campaign execution; Lead Control logs operational touches to `crm_activity_log` and links out (e.g. compose with `contactId`). |
| **Booking** | Scheduler / scheduling modules own meetings; surface booked-call and routing hints from CRM only—do not duplicate booking state. |
| **Analytics & experiments** | Reporting uses existing CRM stats, visitor/AEE events, and Growth OS–adjacent rollups; extend metrics and joins, avoid a second metrics store for “Lead Control only.” |

**Default posture:** extend tables (`crm_contacts`, `crm_activity_log`, `crm_tasks`), services, and admin components. If a capability exists partially, **upgrade** it rather than duplicating.

---

## 1. Audit summary

Ascendra OS already operates a **unified CRM** as the canonical lead record system. Legacy `contacts` plus project `assessments` feed the dashboard inbox; **crm_contacts** is the operational lead/client record with attribution, scoring, tasks, deals, and activity history. Building a second `leads` table would duplicate truth and break workflows.

**Strengths found**

- **CRM core**: `crm_contacts`, `crm_deals`, `crm_accounts`, `crm_tasks`, `crm_activity_log`, `crm_activities`, `communication_events`.
- **Scoring & qualification**: `leadScoringService`, `crmFoundationService` (`calculateAiFitScore`, `calculateAiPriorityScore`, `generateNextBestActions`), contact fields `intentLevel`, `lifecycleStage`, `leadScore`, `aiFitScore`, deal `aiPriorityScore`, `urgencyLevel`, `budgetRange`.
- **Follow-up**: `crm_tasks` (types, priority, `dueAt`, status, `contactId`, deal/account links), `nextFollowUpAt` / `outreachState` on contacts, overdue surfacing in `getCrmDashboardStats`.
- **Timeline**: CRM contact detail merges `crm_activity_log`, activities, comm events, documents (`/admin/crm/[id]`).
- **Lead intake (pre-CRM)**: `/admin/lead-intake` hub; imports to CRM via `leadIntakeCrmService` / `ensureCrmLeadFromFormSubmission`.
- **Forms & attribution**: Portfolio contact, market score, offer audit, free growth tools, challenge, strategy paths; UTM + visitor + **AEE** metadata where wired.
- **Booking / meetings**: Scheduler & scheduling modules; Email Hub compose with `contactId`; discovery / proposal prep workspaces.
- **Workflows**: `fireWorkflows`, CRM triggers (stage changes, etc.).
- **Admin UX**: Dashboard inbox, CRM pipeline/tasks pages, `adminTourConfig` (+ `data-tour` hooks), `AdminHelpTip`, CRM dashboard widgets.
- **Analytics / experiments**: Visitor tracking, AEE rollup/attribution — connect reporting to existing events, not a parallel analytics DB.
- **Permissions**: `isAdmin`, CRM-related permissions in Header; keep Lead Control **admin-first** behind the same gates.

**Gaps vs. desired “Lead Control System”**

- No single **admin command center** route dedicated to *speed-to-lead* and *communication attempts* (CRM list exists but is general-purpose).
- **Communication attempts** (call / voicemail / email marked / SMS marked) are not consistently logged as first-class **activity types** for timeline filtering.
- **Operational priority** (P1–P5) is not a dedicated, visible field aligned with intent + SLA.
- **First response time** is not persisted on the contact for reporting.
- **Routing hints** (book vs qualify-first) are implicit in custom fields / playbooks, not a small persisted hint for ops.
- **Provider abstraction** for future telephony: not formalized (Email Hub / mailto / calendar links are ad hoc).

---

## 2. Related systems (reuse)

| Capability | Location |
|------------|----------|
| Lead record | `crm_contacts` |
| Pipeline / value | `crm_deals` |
| Tasks / follow-ups | `crm_tasks`, APIs under `/api/admin/crm/tasks` |
| Timeline | `crm_activity_log`, `logActivity` in `crmFoundationService` |
| Intake before CRM | `/admin/lead-intake`, `/api/admin/lead-intake` |
| Forms → CRM | `leadFromFormService`, `portfolioController`, funnel APIs |
| Funnel & offer surfaces | `/admin/funnel`, dynamic funnel editors, public funnel routes |
| Campaigns / outbound | Email Hub, newsletters, Content Studio campaigns, paid growth (`/admin/paid-growth`) — link Lead Control actions; do not replace |
| Booking / meetings | `/admin/scheduler`, `/admin/scheduling`, discovery workspaces — CRM reflects outcomes |
| Site & ops analytics | `/admin/analytics`, visitor tracking, dashboard CRM widgets |
| Fit / priority math | `crmFoundationService` |
| Tour / tips | `adminTourConfig`, `AdminHelpTip`, `GuidedTourAnchor` patterns (AEE) |
| Experiments / attribution | AEE services, `aee_crm_attribution_events`, `/admin/experiments` |

---

## 3. Reuse / extend strategy

- **Canonical lead**: always `crm_contacts` (and linked `crm_deals` where relevant).
- **Notes / timeline**: extend **`crm_activity_log`** types for lead-control communication events (no `lead_events` duplicate).
- **Tasks**: only **`crm_tasks`** for follow-ups.
- **Qualification**: continue tags, `intentLevel`, `leadScore`, deals; add **priority + routing hint + firstResponseAt** on contact for ops layer.
- **Reporting**: Phase 1 uses existing list + summary counts; Phase 3 aggregates `firstResponseAt`, activity types, source — optionally join AEE.

---

## 4. Proposed architecture

```
[ Public pages / forms ] → ensureCrmLead / CRM APIs
                              ↓
                    crm_contacts (+ lead control fields)
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
  crm_tasks            crm_activity_log      crm_deals
        ↑                     ↑
  Follow-up panel      Communication actions API
        ↑                     ↑
  /admin/leads ───────── /admin/crm/[id]  (Lead Control bar + timeline)
```

**Communication provider layer (Phase 4-aligned, Phase 1 stub)**

- `server/services/communications/providers/types.ts` — `CommunicationProvider`, `CommunicationActionKind`, no vendor SDKs.

---

## 5. Schema extensions (incremental)

**Phase 1 (implemented in codebase)** — on `crm_contacts`:

- `lead_control_priority` — `P1` | `P2` | `P3` | `P4` | `P5` (nullable until computed).
- `first_response_at` — first logged outbound touch from Lead Control actions.
- `lead_routing_hint` — short label (e.g. `book_call`, `qualify_first`); rules engine can populate later.

No duplicate `leads`, `lead_tasks`, or `lead_notes` tables.

**Phase 2** — org routing config (not per-lead): table `lead_control_org_settings` (singleton `id = 1`) with `config.routingRules` (JSON). Evaluated rules write only to `crm_contacts.lead_routing_hint`.

---

## 6. Routes / pages / components

| Item | Purpose |
|------|---------|
| `/admin/leads` | Lead Command Center — summary cards + queue + links to CRM |
| `/admin/crm/[id]` | Existing detail; embed **Lead Control** action bar |
| `GET /api/admin/lead-control/summary` | Aggregated counts for command center |
| `POST /api/admin/lead-control/contacts/[id]/actions` | Log communication attempt + optional first-response + recompute priority + routing hint from rules |
| `GET` / `PUT /api/admin/lead-control/routing-rules` | Org singleton config → `lead_control_org_settings`; rules set `crm_contacts.lead_routing_hint` |
| `POST /api/admin/lead-control/recompute` | Batch refresh `lead_control_priority` and/or `lead_routing_hint` on CRM leads |
| `POST /api/admin/lead-control/contacts/[id]/follow-up-task` | Quick CRM `crm_tasks` follow-up + `task_created` timeline |
| `shared/leadControlPriority.ts` | Transparent P1–P5 rules (shared client/server) |
| `shared/leadControlRouting.ts` | Evaluate ordered routing rules (first match wins) |
| `/admin/leads/settings` | Routing rules admin UI |
| `app/components/lead-control/LeadControlActionBar` | Call copy, email, meeting stub, log actions, quick follow-ups |

Future (Phase 3): `/admin/leads/insights`, spam/access gates, richer reporting.

---

## 7. Services / hooks / utilities

- `shared/leadControlPriority.ts` — `computeLeadControlPriority(contact)`.
- `server/services/leadControl/applyLeadControlAction.ts` — validate action, `logActivity`, `updateCrmContact`, recompute priority.
- `server/services/communications/providers/types.ts` — provider interface.

---

## 8. Follow-up engine design

- **Create task**: `POST /api/admin/crm/tasks` on lead detail (existing). Phase 2: Lead Control action bar quick presets call `POST /api/admin/lead-control/contacts/[id]/follow-up-task`, which uses `createCrmTask` + `logActivity` (`task_created`).
- **Queues**: “overdue” = `crm_tasks.dueAt < now` + contact `nextFollowUpAt` / `outreachState` — already partially reflected in `getCrmDashboardStats`; command center surfaces the same signals.

---

## 9. Routing / priority logic

- **Priority (`computeLeadControlPriority`)**: combines `doNotContact`, spam-like tags, `intentLevel`, `leadScore`, `bookedCallAt`, `status`, `nextFollowUpAt` vs now, `lifecycleStage`.
- **Routing hint**: Phase 1 manual / optional default from rules module later; field stored for display and rules.

---

## 10. Reporting / insights plan

- Phase 1: summary API + export path = existing CRM + new activity types.
- Phase 3: panels for first-response time (from `first_response_at`), attempts per source, funnel step conversion; tie to AEE metrics where useful.

---

## 11. Guided tour + tooltips

- Add `data-tour="lead-command-center"` on `/admin/leads` + **AdminTourConfig** step.
- Use **AdminHelpTip** on priority badges and summary metrics (plain language).
- Optional: link from tour to CRM contact **Lead Control** bar (`data-tour="lead-control-actions"`).

---

## 12. Step-by-step implementation plan

| Phase | Delivered |
|-------|-----------|
| **1** (current PR) | Audit doc, schema fields, priority helper, summary + actions APIs, `/admin/leads`, Lead Control action bar on CRM contact, nav + tour hook, provider types stub |
| **2** (shipped) | Routing rules config (`lead_control_org_settings` JSON + `/admin/leads/settings`), quick CRM follow-up tasks from action bar + API, batch recompute (priority + hints) — all on `crm_contacts` / `crm_tasks` / `crm_activity_log` |
| **3** | Insights page, metric tooltips, spam/access gates per funnel (CTA config stored in existing settings/content) |
| **4** | Provider implementations (dialer, SMS), deeper automation — behind abstraction only |

---

## 13. Blockers / assumptions

- **DB**: run `npm run db:push` after pulling schema changes.
- **Telephony**: Phase 1 uses `tel:` links, copy, mailto, calendar/scheduling URLs — no dialer integration assumed.
- **Spam**: honeypots already exist on some forms; global “gate phone” is a **product config** task (Phase 3) tied to page-level CTA settings, not invented integrations.

---

## 14. Quality bar

Premium **internal operations** UX: one command center, one CRM truth, fast logging of touches, visible priority, measurable first response — without fragmenting the codebase.
