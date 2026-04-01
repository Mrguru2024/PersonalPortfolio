# Ascendra Growth Intelligence module

This document describes the in-app behavior analytics layer that powers **Ascendra Growth Intelligence** (admin) and **Conversion Diagnostics** (client portal).

## Audit summary — what existed before

- **Schemas:** `shared/behaviorIntelligenceSchema.ts` (`behavior_sessions`, `behavior_events`, replay segments, heatmaps, surveys, friction reports, watch targets/reports).
- **Ingest:** `POST /api/behavior/ingest` via `server/services/behavior/behaviorIngestService.ts`.
- **Client recorder:** `app/lib/tracking/ascendra-behavior-tracker.ts` (rrweb + heatmap clicks, watch-config scoping, masking).
- **Admin UI:** `/admin/behavior-intelligence/*` (visitors, replays, heatmaps, surveys, friction, user tests, watch).
- **Friction job:** `server/services/behavior/behaviorFrictionJob.ts` + cron ` /api/cron/behavior-friction`.
- **Experiments (AEE):** `growth_experiments` / `growth_variants` / `growth_assignments` in `shared/crmSchema.ts`.
- **Client portal gating:** `storage.getClientPortalEligibility`, `/api/client/growth-snapshot`, `/growth-system/*`.

Nothing above was removed; this module extends naming, navigation, diagnostics aggregation, insight tasks, and client summaries.

**Phase 2 (Growth engine — revenue & automation)** builds on the same ingest and diagnostics: see [GROWTH-PHASE2.md](./GROWTH-PHASE2.md) (`/admin/growth-engine`).

## What was added

| Area | Location |
|------|----------|
| Subnav + layout | `app/admin/behavior-intelligence/layout.tsx`, `GrowthIntelligenceSubnav.tsx` |
| Admin conversion diagnostics | `/admin/behavior-intelligence/conversion-diagnostics`, `GET /api/admin/growth-intelligence/diagnostics` |
| Insight tasks + experiment link tables | `growth_insight_tasks`, `growth_insight_experiment_links` in `behaviorIntelligenceSchema.ts` |
| Task API | `GET/POST /api/admin/growth-intelligence/insight-tasks`, `PATCH .../insight-tasks/[id]` |
| Client diagnostics | `/growth-system/conversion-diagnostics`, `GET /api/client/conversion-diagnostics?days=7` (7–90) |
| Client capabilities (permissions map) | `GET /api/client/growth-capabilities` — modules + CRM scope; optional `users.permissions` keys `growth.conversion_diagnostics`, `growth.shared_improvements`, `growth.page_behavior` (default allow; set `false` to deny) |
| Shared insight tasks (client) | `/growth-system/improvements`, `GET /api/client/growth-insight-tasks` — tasks with `visible_to_client` + matching `client_crm_account_id` |
| Page behavior drill-down | `/growth-system/page-behavior?path=/foo&days=30`, `GET /api/client/page-behavior` |
| Client UI | `app/components/conversion-diagnostics/ConversionDiagnosticsClient.tsx` (sectioned “Conversion Diagnostics” dashboard) |
| Aggregations | `server/services/growthIntelligence/growthDiagnosticsService.ts` (`buildClientConversionDiagnostics` + `buildAdminGrowthDiagnostics`) |
| Types | `shared/conversionDiagnosticsTypes.ts` (`ClientConversionDiagnostics`: executive metrics, conversion snapshot narratives, page/friction/heatmap/session highlights, feedback themes, recommendations, trends) |

**Empty / preview states:** When there is no CRM-linked behavior data, the client payload uses `mode: "preview_empty"` with copy and placeholder metrics (`premiumEmptyPayload` in the diagnostics service) — not fabricated live numbers.

## Event pipeline

1. **Recorder** batches replay (rrweb) and sends discrete **events** (`click`, `cta_click`, `scroll_depth`, etc.) through the same ingest endpoint.
2. **Normalization** stores `behavior_events.type` and JSON `metadata` (page path, UTM in session `source_json`).
3. **Friction sweep** aggregates rage/dead proxy + form funnel hints into `behavior_friction_reports`.
4. **Diagnostics** reads sessions/events/friction/surveys for admin + (CRM-linked) client snapshots.

**Element tagging:** Add `data-ascendra-cta="hero_book"` (or similar) on primary CTAs to populate `cta_click` with a stable key.

## Permissions

| Surface | Gate |
|---------|------|
| Admin Growth Intelligence | `isAdmin` (existing admin session) |
| Client Conversion Diagnostics | Session + `getClientPortalEligibility` (403 if not eligible) |
| Client data scope | Sessions where `behavior_sessions.crm_contact_id` matches CRM contacts resolved from the user’s email |

Internal operational fields (replay payloads, raw events) stay admin-only; client payloads are narrative + aggregates.

## Privacy / masking

- rrweb: `maskAllInputs`, `[data-private]`, password / card selectors, `blockSelector: [data-behavior-block]`.
- Client API does not return replay or PII from survey free-text beyond what’s already in CRM-scoped aggregates.

## Experiments connection layer

- Table `growth_insight_experiment_links` stores optional `growth_experiment_id`, keys, variant notes, and optional `pre_metrics_json` / `post_metrics_json` for before/after comparisons.
- **No synthetic significance testing** — placeholders only until a stats engine is wired.

## Future integration notes

- Time-series charts (daily/weekly) from materialized rollups or `dashboard_snapshots` table.
- Persisted `behavior_session_intent_scores` if heuristic load becomes heavy.
- Consent banner integration: gate `startAscendraBehaviorTracking` on CMP signal.
- Role matrix (super admin / operator / client owner / client member): currently binary admin vs eligible client; extend with `permissions` map when product defines keys.
