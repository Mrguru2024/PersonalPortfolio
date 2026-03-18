# Development updates

Log of features and fixes shipped to production. Edit this file when you ship and push; the admin dashboard shows it in digest form (plain text, no markdown formatting).

---

## 2025-03-15 — CRM Stage 3 (AI guidance) and Stage 4 (workflow automation)

- **Stage 3 — AI guidance**: Rule-based AI provider and guidance service. Lead/account summaries, opportunity assessment, next-best actions, discovery questions, proposal prep notes, risk warnings, and qualification gaps generated from CRM data and persisted. Lead and account detail pages: “AI Guidance” / “AI Account Summary” cards with Generate/Refresh; next-best actions can be converted to tasks. Activity log and timeline show AI guidance and recommendation events. Dashboard: “Proposal ready” count.
- **Stage 4 — Workflow automation**: Workflow engine (triggers, conditions, actions, registry) with execution logging. Triggers on contact create, deal create, deal stage change (proposal_ready / won / lost), AI guidance generated, recommendation accepted. Default workflows: new qualified lead, form completed, proposal ready, stale lead, missing qualification, missing research, opportunity won/lost. Actions: create task, update outreach/nurture state, mark sequence ready, generate AI summary, create internal alert, etc.
- **Sequence-ready / outreach state**: Contact fields for outreachState, nurtureState, sequenceReady, nextFollowUpAt, doNotContact, nurtureReason. Lead detail: “Workflow & outreach” card and last automation run. Dashboard: “Follow-up needed” and “Sequence ready” counts.
- **Stale-check**: Manual run via POST `/api/admin/crm/workflows/run-stale-check` (admin). Detects stale leads, missing research, missing qualification and fires workflows (capped per category). Ready for future cron/scheduler.
- **Workflow execution log**: `crm_workflow_executions` table; GET `/api/admin/crm/workflows/executions?entityType=&entityId=` for history. Internal alerts created by workflows appear in existing CRM alerts.

---

## 2025-03-15 — CRM pipeline and UI

- Pipeline board: sticky toolbar, filters, and stage quick-jump. Move deals between stages without leaving the page.
- CRM main page: stat cards with icons, contact list with avatars (initials), hover states, and clearer empty states.
- CRM dashboard overview: card styling, overdue tasks highlight, and recent activity section.
- Deals tab: stage cards with links to contact profiles and hover feedback.

---

## 2025-03-14 — CRM import and intelligence

- Import leads: paste from spreadsheet or upload CSV (mobile- and desktop-friendly). Duplicate emails skipped; default source and row-level errors shown.
- CRM Stage 2: dashboard top sources/tags, saved-list filter builder (pipeline stage, lifecycle, has research, tags), profile completeness and missing-data warnings, next-best actions, source attribution on contact profile.
- Pipeline: filter by source and urgency; sort by value, score, close date, or last updated.

---

## 2025-03-01 — CRM foundation (Stage 1)

- CRM contacts, accounts, deals, pipeline stages, tasks, activity log, and research profiles.
- Contact detail: timeline, meetings, tasks, notes, business card scan, Zoom scheduling.
- Saved lists and CRM dashboard overview.
