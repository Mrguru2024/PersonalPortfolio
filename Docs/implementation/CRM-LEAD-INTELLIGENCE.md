# CRM Lead Intelligence & Communication Tracking

This document describes the **Advanced Lead Intelligence and Communication Tracking** system integrated into the existing CRM.

## Database changes

After pulling this implementation, run:

```bash
npm run db:push
```

This applies:

- **`crm_contacts`**: new columns `lead_score` (integer 0–100), `intent_level` (text: low_intent | moderate_intent | high_intent | hot_lead).
- **New tables**:
  - `communication_events` — email open/click/reply/delivered
  - `document_events` — proposal/document view summary (view count, time spent)
  - `document_event_log` — per-view log for timeline
  - `visitor_activity` — anonymous/attributed page views, form events, CTA clicks
  - `crm_alerts` — real-time sales alerts (proposal opened, multiple views, etc.)

## Features

### Email engagement tracking

- **Open tracking**: `GET /api/track/email/open?token=...` returns a 1×1 GIF and records an open. Use as tracking pixel in emails.
- **Click tracking**: `GET /api/track/email/click?token=...&url=...` records a click and redirects to `url` (same-origin or allowlisted).
- **Token generation** (admin): `POST /api/admin/crm/email-tracking-token` with `{ leadId, emailId }` returns `token`, `pixelUrl`, and `clickUrlTemplate`. Use `TRACKING_SIGNATURE_SECRET` or `SESSION_SECRET` for signing.

### Proposal/document tracking

- Proposal view page (`/proposal/view/[token]`) automatically calls `POST /api/track/document` with `viewToken` on load and sends a heartbeat after 30s with `viewTimeSeconds`.
- Events are stored in `document_events` (aggregated per document+lead) and `document_event_log` (per view). When the viewer can be resolved to a CRM lead (via quote → assessment → email), the event is attached to that lead and intent score is updated.
- Alerts: "Proposal opened" and "Proposal opened multiple times" are created and shown in the CRM dashboard and lead profile.

### Visitor activity

- `POST /api/track/visitor` (public) records: `visitorId`, `eventType` (page_view | form_started | form_completed | cta_click | tool_used), `pageVisited`, `sessionId`, `referrer`, optional `leadId`. Use from the marketing site to attach behavior to a lead once they convert (e.g. set `leadId` when you create/update a CRM contact).

### Intent score

- `app/lib/crm-intent.ts`: `computeIntentScore(signals)` computes a 0–100 score and an intent level from email opens/clicks/replies, proposal views/time, pricing visits, return visits, tool use, form completions.
- Intent is recalculated when document tracking records an event for a known lead and the result is stored on `crm_contacts.lead_score` and `crm_contacts.intent_level`.

### Real-time alerts

- Alerts are created when: proposal is opened (first time), proposal is opened multiple times (and optionally for other high-signal events).
- **APIs**: `GET /api/admin/crm/alerts?leadId=&unreadOnly=true`, `POST /api/admin/crm/alerts/[id]/read`.
- Shown in: CRM main page ("Recent activity") and lead profile (timeline includes activity types).

### Lead profile and timeline

- **Lead profile**: `/admin/crm/[id]` — overview, company/source, lead score & intent, notes, and tabs:
  - **Timeline**: unified chronological list (activities, email events, document views, visitor events).
  - **Proposal activity**: document engagement summary (view count, time spent).
  - **Email engagement**: opens, clicks, replies.
  - **Add note**: internal note (stored as `crm_activities` type `note`).
- **APIs**:  
  - `GET /api/admin/crm/contacts/[id]/timeline` — merged timeline.  
  - `GET /api/admin/crm/contacts/[id]/document-events`  
  - `GET /api/admin/crm/contacts/[id]/communication-events`

### CRM analytics and insights

- **Engagement stats**: `GET /api/admin/crm/analytics/engagement` returns:
  - `emailOpens`, `emailClicks`, `documentViews`, `highIntentLeadsCount`, `unreadAlertsCount`
  - `recentUnreadAlerts`, `insights` (short decision-support bullets).
- CRM main page shows: engagement cards (opens, clicks, proposal views, high-intent count), recent activity (alerts), and an insights card.

## Privacy and security

- Tracking endpoints (`/api/track/*`) are public; tokens are signed so only your server can generate valid ones.
- Email tracking uses a signature (HMAC) over `leadId` and `emailId`; do not put sensitive data in `emailId`.
- Document tracking uses the existing proposal `viewToken`; no extra PII is stored beyond what the proposal view already has.
- Visitor activity stores only the fields listed above; optional `metadata` should be kept minimal and non-sensitive.
- All admin CRM and analytics routes are protected with `isAdmin(req)`.

## Apollo-style features (tasks, sequences, enrichment, saved lists)

- **Tasks** — `/admin/crm/tasks`: My tasks and Overdue. On each lead profile, a **Tasks** tab lets you add follow-ups (call, email, research, etc.) with due date and priority, and mark them done.
- **Email sequences** — `/admin/crm/sequences`: Create multi-step sequences (email + wait X days + task). Enroll contacts via "Enroll leads" (links to CRM). Use `POST /api/admin/crm/sequences/enroll` with `contactId` or `contactIds` and `sequenceId`. Run the next step for an enrollment with `POST /api/admin/crm/sequences/run-step` (body: `enrollmentId`); this creates tasks or logs email steps.
- **Contact enrichment** — On the lead profile, **Enrich contact** calls `POST /api/admin/crm/contacts/[id]/enrich`. With `APOLLO_API_KEY` set, it uses Apollo’s People Match API to fill LinkedIn URL, company, job title, industry. Without the key it marks the contact as enriched (placeholder). Contacts support `linkedinUrl`, `enrichmentStatus`, `enrichedAt`.
- **Saved lists** — `/admin/crm/saved-lists`: Smart filters (type, status, intentLevel, source, noContactSinceDays, hasOpenTasks). Create via `POST /api/admin/crm/saved-lists` with `name` and `filters`. View a list’s contacts via `/admin/crm?listId=<id>`.

After pulling, run `npm run db:push` to create the new tables: `crm_tasks`, `crm_sequences`, `crm_sequence_enrollments`, `crm_saved_lists`, and new columns on `crm_contacts` (`linkedin_url`, `enrichment_status`, `enriched_at`).

---

## Optional next steps

- **Cookie consent**: If you add a consent banner, gate client-side calls to `/api/track/visitor` and optional tracking pixels on the site on user consent.
- **Attach visitor to lead**: When a form submission creates or updates a CRM lead, call `storage.attachVisitorToLead(visitorId, leadId)` if you have a stable `visitorId` (e.g. from a cookie) so pre-conversion activity is linked to the lead.
- **Reply detection**: "Email replied" can be implemented via webhook from your email provider (e.g. Brevo) and then `createCommunicationEvent({ leadId, eventType: "reply", emailId, ... })`.
