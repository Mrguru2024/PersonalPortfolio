# Ascendra Growth Engine (PPC + Revenue) — Audit and implementation plan

This document complements [`PAID-GROWTH-MODULE.md`](./PAID-GROWTH-MODULE.md) with a **product-level audit** against the full Growth Engine spec and a **non-duplicative build plan**.

## 1. Audit — what already exists (do not rebuild)

| Area | Location | Notes |
|------|-----------|--------|
| PPC schema core | `shared/paidGrowthSchema.ts` | Accounts, campaigns, publish logs, performance snapshots, lead quality, readiness assessments |
| Product rules + gates | `shared/ppcBusinessRules.ts` | Readiness threshold, publish gates, Google Ads dashboard publish blocked with honest messaging |
| Readiness engine | `server/services/paid-growth/readinessEngine.ts` | Category scores, gates, `adReady`, Ascendra packages (`Foundation` / `Launch` / `Revenue Engine`) |
| Ephemeral optimization hints | `server/services/paid-growth/paidGrowthRecommendations.ts` | String hints from `ppc_lead_quality` — not persisted |
| Publish / adapters | `server/services/paid-growth/*` | Meta publish path, Google OAuth validation, no fake Google campaign API |
| Storage CRUD | `server/storage.ts` | All existing PPC tables |
| Admin API | `app/api/admin/paid-growth/**` | Campaigns, accounts, dashboard, lead quality, readiness, publish |
| Admin UI | `app/admin/paid-growth/**`, `PaidGrowthSubnav` | Dashboard, accounts, campaigns, lead quality, readiness, reports |
| CRM + attribution | `crm_contacts` UTM fields, `visitor_activity`, `ppc_lead_quality` | Single CRM; PPC augments with quality row per contact |
| Offers / funnels | `site_offers`, `funnel_content` | Campaign `offerSlug`, `landingPagePath` |
| Experiments linkage | `shared/experimentationEngineSchema.ts` | Optional `ppcCampaignId` on experiments |

## 2. What must stay single-source

- **CRM**, forms, booking flows — extend with UTMs and `ppc_lead_quality`; no parallel lead DB.
- **Visitor / first-party analytics** — use for enrichment; do not clone a second “session attic” unless a missing index is proven.
- **Growth Diagnosis** (`/growth-diagnosis`) — deep audits stay there; PPC readiness remains a **launch gate**, not a second site audit product.

## 3. Gaps closed by this phase (extend, don’t fork)

1. **Campaign structure** — first-class `ppc_ad_groups`, `ppc_keywords` (including negatives), instead of only JSON blobs.
2. **Landing destinations** — `ppc_campaign_destinations` for primary / fallback / variant paths tied to campaigns and optional offer slugs.
3. **Modular ad copy** — `ppc_ad_copy_variants` for test sets and angles (headlines, bodies, CTAs) linked to campaigns and optionally ad groups.
4. **Persisted optimization** — `ppc_optimization_recommendations` + **rules-based** `optimizationRulesEngine.ts` (merge with dashboard; hints remain a fast path).
5. **Ascendra commercial layer** — `ppc_billing_profiles` for internal retainer, setup fee, labor estimate, profitability score, fulfillment notes (admin-only surfaces).
6. **Growth route label** — user-facing route (`needs_foundation` → “Needs Foundation Work”, etc.) mapped from `adReady` + score; stored in readiness snapshot + assessment column.
7. **Client summary API** — `GET /api/client/ppc-summary` when `ASCENDRA_PPC_CLIENT_SUMMARY_ENABLED` and portal eligibility; **no** internal strategy or profitability fields.

## 4. Intentionally deferred (adapters / future)

- Live **Google Ads API** campaign sync — keep `GOOGLE_ADS_DASHBOARD_PUBLISH_BLOCKED` behavior; extend `googleAdsConnection.ts` + dedicated sync service when credentials are production-ready.
- **Call tracking** provider — reserved fields / JSON metadata on keywords or campaigns only when a vendor is chosen.
- **GA4 / offline conversion** upload — same: adapter interface in services folder when needed.
- **AI** optimization — rules engine emits structured recommendations; LLM layer can rank or explain later without replacing rules.

## 5. File map (post-build)

```
shared/paidGrowthSchema.ts          # extended tables
shared/ppcBusinessRules.ts          # growthRouteRecommendationFromReadiness
server/services/paid-growth/
  readinessEngine.ts                # + growthRouteRecommendation
  optimizationRulesEngine.ts      # NEW: persist recommendations
server/storage.ts                   # CRUD for new entities
app/api/admin/paid-growth/
  optimization/route.ts
  optimization/run/route.ts
  optimization/[id]/route.ts
  campaigns/[id]/ad-groups/route.ts
  ad-groups/[id]/route.ts
  ad-groups/[id]/keywords/route.ts
  keywords/[id]/route.ts
  campaigns/[id]/destinations/route.ts
  campaigns/[id]/copy-variants/route.ts
  copy-variants/[id]/route.ts
  billing-profiles/route.ts
  billing-profiles/[id]/route.ts
app/api/client/ppc-summary/route.ts
app/admin/paid-growth/optimization/page.tsx
Docs/implementation/PPC-GROWTH-ENGINE-AUDIT-AND-PLAN.md  # this file
```

## 6. Permissions

Reuse **`isAdmin`** for all `/api/admin/paid-growth/*` routes. **Strategist / AM** granularity can map to the same `isAdmin` gate until a dedicated RBAC table exists. Client routes use **portal eligibility** + env flag.
