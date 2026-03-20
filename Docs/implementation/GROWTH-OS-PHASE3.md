# Growth OS — Phase 3 (Intelligence layer)

Internal Ascendra Growth Operating System: AI content insights, provider-based research, performance dashboards, client-safe exposure policies, automation hooks, and public token report route.

## Architecture

| Layer | Responsibility |
|--------|----------------|
| `shared/growthIntelligenceSchema.ts` | Drizzle tables for insight runs/scores/suggestions, research batches/items, automation runs |
| `shared/clientSafe/gosExposurePolicies.ts` | Resource types, field allow-lists, envelope shape for client exports |
| `server/services/growthIntelligence/*` | Config, content insights (OpenAI + mock), research providers, dashboards, automation orchestration |
| `server/services/growthOsClientSafeExposureService.ts` | Build sanitized payloads from live entities + create token shares |
| `app/lib/growth-os/sanitize.ts` | Forbidden keys stripped from any client-bound JSON |
| Admin APIs | `/api/admin/growth-os/intelligence/*`, `client-safe/build-share` |
| Public API | `GET /api/public/gos/report/[token]` (no auth; token-only) |

## Role / access model

- **All Phase 3 admin APIs** require `isAdmin` (approved admin), consistent with Growth OS Phase 1.
- **INTERNAL_TEAM** is reserved in `shared/accessScope.ts` for future narrower tooling; intelligence UI remains admin-only today.
- **Client / public** never hits research or AI insight routes. They only receive **pre-built** JSON via **hashed share tokens** (`gos_client_safe_report_shares`).

## AI content insights

- Dimensions: hook, clarity, pain alignment, specificity, CTA, engagement, lead value, audience fit, funnel fit, platform fit.
- **Internal**: per-dimension `internalRationale`, run `internalMetadataJson`, full suggestion `body`, `internalTraceJson`.
- **Client-safe subset**: optional `clientSafeHint` on scores (future UI) and `clientSafeExcerpt` on suggestions — still review before external share.
- **Triggers**: `POST .../intelligence/content/[docId]/analyze`; optional `triggerContentInsight` on document PATCH; optional env auto-save; calendar PATCH when `calendarStatus` set to `scheduled` (if schedule automation env enabled).

### Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enables live mode when mode not forced to mock |
| `GOS_INTELLIGENCE_MODE` | `mock` \| `live` (optional override) |
| `GOS_OPENAI_MODEL` | Default `gpt-4o-mini` |
| `GOS_AUTO_CONTENT_INSIGHT_ON_SAVE` | `true` to run insight on every document save |
| `GOS_AUTO_CONTENT_INSIGHT_ON_SCHEDULE` | Default on; set `false` to skip schedule trigger |

## Research intelligence

- **Provider interface**: `ResearchProvider` in `researchProviders.ts` with `MockResearchProvider` and `OpenAiResearchProvider`.
- **Labeling**: Each batch stores `providerMode` (`live` \| `mock`); each item stores `source` (e.g. `openai`, `mock:deterministic`).
- **UI**: Admin → Growth OS → **Intelligence** → Research tab.

## Performance dashboards

- Aggregated JSON from CRM contacts/deals/tasks, blog posts, internal CMS documents, editorial calendar, audit runs, AI suggestion queue.
- Endpoint: `GET /api/admin/growth-os/intelligence/dashboards?projectKey=...`

## Client-safe summary layer

1. **Policies** (`gosExposurePolicies.ts`) define resource types and **allow-listed** fields — no ad-hoc spreading of internal rows.
2. **Builders** (`growthOsClientSafeExposureService.ts`) load internal data, enforce entity visibility (`internal_only` blocks export), merge overrides from `gos_entity_visibility_overrides`.
3. **Shares**: `POST /api/admin/growth-os/client-safe/build-share` creates a token with the sanitized envelope. Legacy manual JSON flow remains at `POST /api/admin/growth-os/client-shares`.
4. **Public read**: `GET /api/public/gos/report/[token]` returns only stored summary + metadata (logs `client_safe_report_viewed`).

### Supported built-in resource types

- `internal_audit_run` — uses persisted `clientSafeSummaryJson` on the run.
- `internal_cms_document` — requires document `visibility` ∈ {`client_visible`, `public_visible`}.
- `internal_editorial_calendar_slice` — `resourceId` format: `projectKey|YYYY-MM-DD|YYYY-MM-DD` (UTC window).

## Automation workflows

- Jobs: `weekly_research_digest`, `audit_recommendation_engine`, `editorial_gap_detection`, `stale_content_detection`, plus content-insight variants via CMS hooks.
- Persistence: `internal_automation_runs` with status + `resultSummary`.
- API: `POST /api/admin/growth-os/intelligence/automation/run`, `GET .../automation/runs`.

## Rollout recommendations

1. Run `npm run db:push` to create new tables.
2. Keep `GOS_INTELLIGENCE_MODE=mock` in staging until copy review of model outputs.
3. Add rate limiting / WAF rules on `/api/public/gos/report/*` in production.
4. Rotate share tokens by expiry; never log raw tokens server-side beyond creation response.

## CMS / calendar usage

- **CMS**: Content Studio document editor — AI card + “Save + queue insight”.
- **Calendar**: Scheduling a row with linked document can trigger insight when env allows (see above).

## Next dependencies

- Cron/worker for weekly digest without manual button.
- Narrow **INTERNAL_TEAM** routes for research read-only.
- Richer lead↔content attribution for “leads by content item”.
- Client portal page that consumes public report token (currently API-only).
