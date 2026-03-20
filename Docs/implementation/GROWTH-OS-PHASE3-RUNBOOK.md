# Growth OS Phase 3 — Internal runbook

Operational guide for the **Ascendra Growth Operating System** intelligence layer: where code lives, how to run it safely, and what clients may ever see.

## Architecture (quick map)

| Concern | Primary paths |
|--------|----------------|
| **Schema** | `shared/growthIntelligenceSchema.ts`, `shared/internalStudioSchema.ts`, `shared/growthOsSchema.ts`, `shared/crmSchema.ts` |
| **AI content insights** | `server/services/growthIntelligence/contentInsightService.ts`, `contentInsightDimensions.ts`, `growthIntelligenceConfig.ts` |
| **Research providers** | `server/services/growthIntelligence/researchProviders.ts`, `researchIntelligenceService.ts` |
| **Dashboards** | `server/services/growthIntelligence/dashboardService.ts`, `attributionService.ts` |
| **Automation / cron** | `server/services/growthIntelligence/automationService.ts`, `GET /api/cron/growth-os`, `vercel.json` |
| **Client-safe exposure** | `shared/clientSafe/gosExposurePolicies.ts`, `server/services/growthOsClientSafeExposureService.ts`, `app/lib/growth-os/sanitize.ts` |
| **Public report** | `GET /api/public/gos/report/[token]`, `app/gos/report/[token]/`, rate limit in `app/lib/public-api-rate-limit.ts` |
| **Admin UI** | `app/admin/growth-os/intelligence/page.tsx`, Content Studio under `app/admin/content-studio/` |

## Role / access model

- **Admin APIs** (`/api/admin/growth-os/**`, `/api/admin/content-studio/**`): require approved admin (`isAdmin`).
- **Intelligence UI**: admin-only; no separate “research analyst” role yet (`INTERNAL_TEAM` in `shared/accessScope.ts` is reserved).
- **Client / public**: never call insight or research routes. They only receive **pre-sanitized** payloads via **share tokens** (`gos_client_safe_report_shares`).

## Audit engine

- Runs and scores: `internal_audit_runs`, `internal_audit_scores`, `internal_audit_recommendations`.
- Automation job: `audit_recommendation_engine` → `executeAuditRun` in `server/services/internalStudio/auditService.ts`.
- **Client-safe**: audit runs can expose `clientSafeSummaryJson` only when built through the client-safe pipeline — not raw scores.

## CMS (Content Studio)

- Documents: `internal_cms_documents` — types include `hook`, `headline`, `cta`, drafts, etc.
- **AI insights**: analyze via admin API or document editor; optional auto-run on save (`GOS_AUTO_CONTENT_INSIGHT_ON_SAVE`) / schedule (`GOS_AUTO_CONTENT_INSIGHT_ON_SCHEDULE`).
- **Automation jobs** needing a document: `content_insight_save`, `content_insight_schedule`, `headline_hook_variants`, `repurposing_suggestions` — pass `documentId` (Growth OS → Intelligence → Automation, or POST body).

## Editorial calendar

- Table: `internal_editorial_calendar_entries`; scheduling can trigger content insight when env allows.
- Dashboard **best posting windows** = UTC hour histogram of `scheduledAt` for the project (operational signal, not a guarantee).

## AI insights flow

1. Trigger: manual analyze, CMS PATCH, calendar schedule, or automation job.
2. **Internal**: scores with `internalRationale`, suggestions with full `body` + `internalTraceJson`.
3. **Review**: suggestions are persisted and should be approved/edited before any external use.
4. **Client subset**: optional `clientSafeExcerpt` / hints — still subject to exposure policies when building shares.

## Provider setup

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Live OpenAI for insights + research when mode is live |
| `GOS_INTELLIGENCE_MODE` | `mock` \| `live` (optional override) |
| `GOS_OPENAI_MODEL` | Default `gpt-4o-mini` |
| `CRON_SECRET` | Bearer for `GET /api/cron/growth-os` |
| `GOS_PUBLIC_REPORT_MAX_PER_MINUTE` | Production IP rate limit for public report API |

**Mock mode**: deterministic catalog + structured mock scores; batches/items labeled `mock:*` / `mock_catalog`.

## Client-safe summary layer

- **Policies** define allow-listed fields per resource type — do not add “if client” branches in random components; extend policies and builders.
- **Excluded by default**: internal scoring math, weighting, AI rationale, research dashboards, team notes, cross-client aggregates, internal benchmarks.
- **Shares**: `POST /api/admin/growth-os/client-safe/build-share` → token; **UI**: `/gos/report/[token]` + JSON API.

## Automation jobs (reference)

| Job | Needs `documentId` | Notes |
|-----|-------------------|--------|
| `weekly_research_digest` | No | Cron: Mondays UTC (via `runScheduledGrowthOsJobs`) |
| `audit_recommendation_engine` | No | Full audit run |
| `editorial_gap_detection` | No | Gap hints in `resultSummary` |
| `stale_content_detection` | No | Drafts older than 21 days |
| `stale_followup_detection` | No | CRM `nextFollowUpAt` overdue, not won/lost |
| `content_insight_save` / `content_insight_schedule` | Yes | Same engine, different trigger label |
| `headline_hook_variants` | Yes | Insight run (headline/hook suggestions) |
| `repurposing_suggestions` | Yes | Insight run (repurpose / platform variants) |

**Cron** (`runScheduledGrowthOsJobs`): daily — stale content, editorial gaps, stale follow-up; **Monday** — weekly research digest.

## Performance dashboards (data notes)

- **Lead gen**: `conversionByCta` groups CRM contacts by `landing_page` (proxy for CTA/landing attribution when UTM/CTA fields are sparse).
- **Content**: `topHeadlines` merges blog titles (by views) with internal `headline`/`hook` library rows; `topCtaPatterns` groups internal `cta` documents by title; `personaEngagementTrends` tallies `persona_tags` on a sample of CMS + calendar rows (frequency proxy, not analytics pixel data).

## Rollout & testing

1. `npm run db:push` after schema changes.
2. Staging: `GOS_INTELLIGENCE_MODE=mock`; review copy quality before live.
3. **Manual**: Admin → Growth OS → Intelligence — dashboards, research, automation.
4. **Cron**: `curl -H "Authorization: Bearer $CRON_SECRET" "https://<host>/api/cron/growth-os?projectKey=ascendra_main"`
5. **Client share**: build share in admin, open `/gos/report/<token>`, confirm no internal keys in JSON.
6. **Tests**: `npm test` (Jest); `npm run check` (known jest-dom noise in unrelated UI tests).

See also: `GROWTH-OS-PHASE3.md`.
