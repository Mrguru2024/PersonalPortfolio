# Admin reminder automation

Automation reminders keep admins aligned with business growth by surfacing tasks derived from **goal presets** and **platform interaction** (CRM tasks, follow-ups, discovery, proposal prep, alerts). Reminders are **role-aware** and **interactive** (dismiss, snooze, mark done) and can use the **backend AI agent** to suggest next steps.

## Data model

- **business_goal_presets** — Defines what to look for (e.g. overdue tasks, unread alerts, follow-up due). Each preset has: key, name, category (sales | marketing | operations | growth), criteria (JSON with `type`), roleFilter (all | sales | marketing | operations), priority.
- **admin_reminders** — Stored reminder instances: title, body, priority, actionUrl, relatedType/relatedId, status (new | dismissed | done | snoozed), snoozedUntil. `userId` null = applies to all admins.
- **admin_settings (reminder fields)** — Editorial targeting controls for reminder generation:
  - `reminderPlanningDays` (weekday array, e.g. `["monday","thursday"]`)
  - `reminderCityFocus` (admin-selected city focus, e.g. `Austin, TX`)
  - `reminderEditorialHolidaysEnabled` (boolean)
  - `reminderEditorialLocalEventsEnabled` (boolean)
  - `reminderEditorialHorizonDays` (3-90 day look-ahead window)

## Reminder engine

- **Service**: `server/services/reminderEngineService.ts`
- **Input**: Active presets + CRM dashboard stats (overdue tasks, tasks due soon, unread alerts, follow-up due, discovery incomplete, proposal prep attention, leads missing data) + admin reminder settings for planning/editorial targeting.
- **Output**: Reminder items with reminderKey (e.g. `overdue_task_123`) so we avoid duplicates. Idempotent: only creates reminders that don’t already exist (same key, status new/snoozed).
- **Editorial criteria supported**:
  - `content_planning_day`
  - `editorial_holiday_window`
  - `editorial_local_event_window`
- **Role**: `getUserReminderRole()` maps user role/permissions to sales | marketing | operations | all. Presets can filter by `roleFilter`; default presets use "all".

## APIs

- **GET /api/admin/reminders** — List reminders for current admin (new + snoozed where snoozedUntil ≤ now).
- **POST /api/admin/reminders** — Run the engine and persist new reminders. Optionally sends a push notification to all admin push subscriptions when any are created.
- **GET /api/admin/reminders/config** — Read current planning/editorial reminder targeting settings (planning days, city focus, holiday/local toggles, horizon).
- **PATCH /api/admin/reminders/[id]** — Update status: `dismissed` | `done` | `snoozed` (body: `{ status, snoozedUntil? }`).
- **POST /api/admin/reminders/[id]/suggest-next** — AI-suggest 3–5 next steps for this reminder (uses OpenAI when `OPENAI_API_KEY` is set; otherwise returns static steps).

## UI

- **Dashboard** — “Growth reminders” card with compact list, Refresh (generate), Open link, Suggest next steps (AI), and Actions (Mark done, Dismiss, Snooze 1h / tomorrow / 3 days / 1 week). Link to full page.
- **/admin/reminders** — Full-page list with same actions and generate.

## Seed

- **npm run db:seed** — Seeds default business goal presets (overdue tasks, tasks due soon, unread alerts, follow-up due, discovery incomplete, proposal prep attention, leads missing data, content planning day, editorial holiday opportunity, editorial local-event opportunity). Run **npm run db:push** first to create the tables.

## Automation

- Reminders are **generated on demand** when an admin hits Refresh or opens the reminders page (client can call POST generate once per session if desired).
- For scheduled automation (e.g. daily digest), call **POST /api/admin/reminders** from a cron job or serverless scheduler; the same endpoint runs the engine and optionally sends push.
