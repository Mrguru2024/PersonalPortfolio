# Behavior Intelligence — Phase 1 audit & MVP integration

## Existing systems (reused; do not duplicate)

| System | Location | Role |
|--------|----------|------|
| Visitor activity | `visitor_activity` in `shared/crmSchema.ts` | Canonical event stream: page_view, CTA, forms, tools; UTM in metadata |
| Public track API | `POST /api/track/visitor` | Creates visitor rows; geo/device; `addScoreFromEvent` when `leadId` set |
| Client hook | `app/lib/useVisitorTracking.ts` | UTM capture, page_view, component/section metadata |
| Admin analytics | `app/admin/analytics`, `/api/admin/analytics/*` | Traffic, events, demographics |
| AEE rollup | `server/services/experimentation/*` | Aggregates `visitor_activity` + experiments |
| CRM | `crm_contacts`, attribution fields | UTM, landing_page, visitor linkage |
| Growth Intelligence doc | `Docs/implementation/GROWTH-INTELLIGENCE-SYSTEM.md` | Architecture alignment |

**Behavior Intelligence** adds **dense** behavioral data (rrweb payloads, click coordinates, survey payloads, friction rollups) in separate `behavior_*` tables and **optionally bridges** a subset of events into `visitor_activity` when `visitorId` is present on ingest.

## New MVP surface

- **Ingest:** `POST /api/behavior/ingest` — rate-limited; optional `BEHAVIOR_INGEST_SECRET` (Bearer).
- **Tracker SDK:** `app/lib/tracking/ascendra-behavior-tracker.ts` (client) — rrweb record + heatmap clicks + flush batches.
- **Admin UI:** `app/admin/behavior-intelligence/*` — overview, replays (rrweb-player), friction list; heatmaps/surveys/user-tests documented stubs for next iteration.
- **Cron:** `GET /api/cron/behavior-friction` — friction sweep (24h); scheduled in `vercel.json`.
- **Schema:** `shared/behaviorIntelligenceSchema.ts` (sessions, events, replay segments, heatmap points, surveys, responses, friction reports, user-test tables).

## Privacy

- Tracker: `maskAllInputs`, password/CC autocomplete selectors blocked, `[data-private]` / `[data-behavior-mask]`, `ignoreClass`, opt-out `localStorage ascendra_behavior_opt_out=1`.
- Do not enable the tracker on client portals without legal review; default integration is for **Ascendra-owned** marketing surfaces.

## Success criteria vs full spec

| Capability | MVP status |
|------------|------------|
| Session replay ingest + admin playback | Yes |
| Heatmap coordinate ingest | Yes; overlay UI deferred |
| Surveys | Schema + ingest path; builder UI deferred |
| User tests | Schema; CRUD UI deferred |
| Friction reports | Cron + heuristic job + admin list |
| Full load testing / rage-click ML | Deferred |

## Tie-in: Client Growth System

- **No client exposure** of raw Behavior Intelligence in this MVP.
- Future: summarized friction or “top issues” could feed **client growth snapshot** copy with strict anonymization and aggregation (separate product decision).
