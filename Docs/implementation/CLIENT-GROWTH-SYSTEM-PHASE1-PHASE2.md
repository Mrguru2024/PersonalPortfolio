# Client Growth System — Phase 1 Audit (complete) & Phase 2 Architecture Plan

**Product framing:** Ascendra OS = internal operating layer. **Client Growth System** = premium client-facing “3-Step Growth System” (Diagnose → Build → Scale) powered by OS data, without exposing admin complexity.

**Stack reality check:** Next.js App Router, Drizzle + PostgreSQL (`shared/schema.ts`, domain schemas), session auth via `getSessionUser` (`@/lib/auth-helpers`), TanStack Query on client dashboards.

---

## Phase 1 — Audit (100% complete)

### P1.1 Project structure (relevant areas)

| Area | Path pattern | Notes |
|------|----------------|------|
| Client portal shell | `app/portal/*` | Login; eligibility drives `/dashboard` vs `/portal/welcome`. |
| Client dashboard | `app/dashboard/*` | Main post-auth client hub (invoices, proposals, projects, feedback). |
| Client APIs | `app/api/client/*` | All use `getSessionUser`; no admin permission checks inside typical routes. |
| Eligibility | `app/api/user/client-portal-eligibility/route.ts` | Wraps `storage.getClientPortalEligibility`. |
| Public/auth | `app/auth/*`, `app/login/*` | General auth; portal is client-specific entry. |
| Admin OS | `app/admin/*` | Full CRM, experiments, Lead Control, Growth OS, AMIE, funnels, etc. |
| Public growth/diagnostic surfaces | `app/market-score`, `app/offer-valuation`, `app/growth*`, `app/diagnosis*`, `app/resources/*`, `app/tools/*`, `app/offers/*`, `app/api/funnel/*`, `app/api/growth-diagnosis/*` | Fuel for **Diagnose** summaries; must not be re-built as second products. |
| Token / share | `app/gos/report/[token]`, `app/proposal/view/[token]` | Precedent for “client-safe digest” without admin UI. |
| Community (distinct product) | `app/Afn/*` | Founder network; **not** the Client Growth System—avoid merging UX. |

### P1.2 Route inventory — client & portal (canonical)

| Route | Purpose |
|-------|---------|
| `/portal` | Client workspace sign-in |
| `/portal/welcome` | Signed in but not eligible for full dashboard |
| `/dashboard` | Client dashboard (overview, invoices, proposals, feedback, projects) |
| `/dashboard/proposals/[id]` | Proposal detail |

**Site directory:** `app/lib/siteDirectory.ts` tags these as `audience: "client"` where listed.

### P1.3 Route inventory — public tools (Diagnose / acquisition inputs)

| Route (examples) | Maps to step |
|------------------|----------------|
| `/market-score` | Diagnose — market-style snapshot; CRM + nurture (`marketScoreFunnelService`) |
| `/offer-valuation` | Diagnose — offer strength (`OfferValuationTool`, `offer_valuation_settings`) |
| `/growth`, `/growth-diagnosis`, `/diagnosis` | Diagnose — funnels / engine flows |
| `/resources/startup-growth-kit`, `/tools/startup-website-score`, `/resources/startup-action-plan` | Diagnose / nurture — `funnel_content` + `getFunnelContent` / `GET /api/funnel/[slug]` |
| `/offers/startup-growth-system` | Build narrative — offer CMS path (separate from funnel slug JSON) |
| `/apply`, `/book`, `/strategy-call` | Build / Scale — conversion & booking |

**Do not duplicate** these flows; **summarize** into the client Growth System.

### P1.4 API inventory — client (`app/api/client`)

| Method | Path | Data source (typical) |
|--------|------|------------------------|
| GET | `/api/client/invoices` | `getClientInvoices(user.id)` |
| GET | `/api/client/invoices/[id]` | Invoice by id + ownership |
| GET | `/api/client/proposals` | Client proposals |
| GET | `/api/client/proposals/[id]` | Proposal detail |
| GET | `/api/client/quotes` | Quotes for client |
| GET | `/api/client/announcements` | `client_announcements` targeting |
| GET/POST | `/api/client/feedback` | `client_feedback` |
| GET | `/api/client/projects` | **`getClientProjects(user.id)` → `project_assessments` by user email** |

**Gap:** No `/api/client/growth-*` yet — Phase 3 will add snapshot aggregator(s) here (or sibling under `/api/user` if you prefer; **prefer `/api/client/growth-snapshot`** for consistency).

### P1.5 API inventory — eligibility & user

| Path | Role |
|------|------|
| `GET /api/user` | Session user (incl. `isAdmin`, `adminApproved`, permissions, `clientPortalAccess`) |
| `GET /api/user/client-portal-eligibility` | Boolean eligibility for `/dashboard` |

### P1.6 Schema — client linkage & diagnose/build inputs

| Table / entity | File | Relevance to Growth System |
|----------------|------|----------------------------|
| `users` | `shared/schema.ts` | `clientPortalAccess`, `isAdmin`, `permissions`; session identity |
| `project_assessments` | `shared/schema.ts` | **Already linked to clients by email** via `getClientProjects` |
| `client_invoices`, client quotes, proposals | `shared/schema.ts` | Portal dashboard; “Scale” can reference paid engagement signals |
| `client_feedback`, `client_announcements` | `shared/schema.ts` | Activity / comms on dashboard |
| `growth_funnel_leads` | `shared/schema.ts` | Scores, bottleneck, recommendation; email/name optional |
| `growth_diagnosis_reports` | `shared/schema.ts` | `report_payload`, `overall_score`, email — Diagnose input |
| `funnel_content` | `shared/schema.ts` | Per-slug JSON; includes `accessModel`, `leadFrictionLevel` (`shared/funnelConversionSettings.ts`) |
| `offer_valuation_settings` | `shared/schema.ts` | Singleton toggles: client/public access, lead capture |
| `crm_contacts` | `shared/crmSchema.ts` | **Admin-first**; client Scale can use **aggregates only** via new read-scoped service (by email), never admin routes |
| AMIE / GOS / experiments | `shared/amieSchema.ts`, `growthOsSchema.ts`, experimentation tables | OS-only detail; client sees summaries |

**No `client_growth_workflow` table today** — Phase 2 recommends optional later table or computed snapshot only.

### P1.7 Services & storage (touchpoints)

| Function | Location | Use |
|----------|----------|-----|
| `getClientPortalEligibility` | `server/storage.ts` | Portal routing |
| `getClientProjects` | `server/storage.ts` | Assessments by email |
| `getClientInvoices` / quotes / proposals | `server/storage.ts` | Dashboard |
| `marketScoreFunnelService` | `server/services/marketScoreFunnelService.ts` | Market Score → CRM |
| Lead intake / diagnosis listing | `server/services/leadIntakeCrmService.ts` | Reads `growthDiagnosisReports`, `growthFunnelLeads` (admin contexts) |
| Funnel content | `storage.getFunnelContent` / PATCH admin funnel | Build posture |
| Lead Control / CRM analytics | `server/services/leadControl/*`, CRM APIs | **Admin**; client Scale maps from summarized queries |

### P1.8 UI & design system

- **Primitives:** `app/components/ui/*` (Card, Tabs, Badge, Button, Progress if present).
- **Client dashboard:** `app/dashboard/page.tsx` — patterns for queries, loading, tabs.
- **Marketing sections:** `marketing-page-y`, `LeadMagnetRelatedWorkSection`, `FunnelHeroMedia`, etc.
- **Auth:** `app/hooks/use-auth.tsx` — `AuthUser` from `users` row + server extras.

### P1.9 Auth matrix (who sees what)

| Actor | Client Growth UI | OS admin |
|-------|-------------------|----------|
| Unauthenticated | Redirect to `/portal` or `/auth` | N/A |
| Client eligible (`getClientPortalEligibility`) | **Yes** (`/dashboard` + future `/growth-system`) | No |
| `clientPortalAccess === true` | Eligible path | No |
| Admin approved | Typically `/admin/dashboard` from portal login | Yes |
| Admin impersonation | **Not in codebase today** — future only | — |

### P1.10 Overlap / duplication risks (explicit do-not-build)

| Don’t build | Because |
|-------------|---------|
| Second CRM | `crm_contacts` + admin UI exists |
| Second experiments UI for clients | AEE stays admin; optional “results summary” only |
| Second portal | `/portal` + `/dashboard` exist |
| Second project assessment store | `project_assessments` exists |
| Raw Market Score UI inside Growth System | Link out or embed summary card only |

### P1.11 Gaps for the 3-step product (facts)

1. **No** dedicated client route for Diagnose / Build / Scale narrative.
2. **No** `ClientGrowthSnapshot`-style DTO or mapper service.
3. **No** client API that joins email → CRM aggregates safely.
4. **No** persisted workflow state machine (optional).
5. **Personas (e.g. Marcus)** — copy/config only today, not a DB enum.

### P1.12 Phase 1 completion checklist

- [x] **1.** Inspect project structure relevant to client vs admin vs public.
- [x] **2.** Identify routes, components, models, services for client portal and growth tools.
- [x] **3.** Identify conflicts (duplicate dashboard risk), duplicates, integration opportunities (extend `/dashboard`, reuse `project_assessments`, CRM by email).
- [x] **4.** Summarize reuse vs new work.
- [x] **5.** Document integration plan — see Phase 2 below.

**Phase 1 status: COMPLETE.** This document is the signed audit artifact.

---

## Phase 2 — Architecture Plan (complete)

### P2.1 Final route structure (recommended)

| Route | Purpose |
|-------|---------|
| **`/growth-system`** | Primary premium **3-Step Growth System** shell (step tracker + sections). **New.** Rationale: avoids overloading `/dashboard` tabs while keeping same auth. |
| `/growth-system/diagnose`, `/build`, `/scale` | **Optional** Phase 3 sub-routes for deep links; **or** single page with anchors for v1. |
| `/dashboard` | Add **single prominent CTA** → “Your growth system” linking to `/growth-system` when eligible. |

**Do not** introduce `app/(client)/` route groups unless migrating all client pages — current repo uses flat `app/`.

### P2.2 Role / access strategy

1. **Gate:** `getSessionUser` required; if unauthenticated → ` /portal?redirect=/growth-system`.
2. **Eligibility:** Reuse `getClientPortalEligibility` for v1 (or stricter `user.clientPortalAccess && eligible` if product requires).
3. **Never** call `/api/admin/*` from client Growth pages.
4. **New API:** `GET /api/client/growth-snapshot` (name TBD) returns **only** `ClientGrowthSnapshot` JSON (Zod-validated).

### P2.3 Data flow — OS to client (mapping layer)

```
[OS sources]                    [Mapper service — server only]           [Client JSON]
project_assessments    ─┐
growth_diagnosis_*     ─┼──►  server/services/clientGrowth/
growth_funnel_leads    ─┤        buildClientGrowthSnapshot(user)
funnel_content (slug)  ─┤             │
crm_contacts (email)   ─┘             ►  ClientGrowthSnapshot
offer_valuation (opt)                 (plain language + bands)
```

- **Rule:** Mappers return **bands and labels** (e.g. demand “Solid / Mixed / Tight”), not raw AMIE dimension dumps.
- **Caching:** Optional second phase — `snapshot_json` column or KV; v1 can compute on each GET with short TTL header.

### P2.4 Schema strategy (minimal)

| Phase | Action |
|-------|--------|
| **2a (MVP)** | **Zero** new tables. Snapshot computed from existing rows + in-memory defaults. |
| **2b** | Optional `client_growth_workflow`: `user_id` PK, `diagnose_status`, `build_status`, `scale_status`, `updated_at`, optional `last_snapshot_json`. |
| **2c** | Optional link `crm_contacts.id` on user row or mapping table **only** if email join is insufficient (avoid if possible). |

### P2.5 Type / DTO sketch (implementation in Phase 3)

```typescript
// Illustrative — Phase 3 implements in shared/ or server types + Zod
type StepState = "locked" | "not_started" | "in_progress" | "complete" | "active" | "optimizing";

interface ClientGrowthSnapshot {
  businessLabel: string; // company or user display
  step: { diagnose: StepState; build: StepState; scale: StepState; current: 1 | 2 | 3 };
  diagnose: { healthScore: number | null; summary: string; primaryIssue: string; missedOpportunityHint: string; market: BandSummary; site: BandSummary; offer: BandSummary; nextCta: { label: string; href: string } };
  build: { activationSummary: string; funnel: LineItem[]; messaging: LineItem[]; capture: LineItem[]; followUp: LineItem[]; nextCta: { label: string; href: string } };
  scale: { leadsThisPeriod: number | null; bookingsThisPeriod: number | null; topChannel: string | null; trendHint: string; improvements: string[]; nextCta: { label: string; href: string } };
  activity: { title: string; at: string; kind: string }[];
}
```

### P2.6 Component architecture (new, under one folder)

**Suggested path:** `app/components/client-growth/`

| Component | Responsibility |
|-----------|----------------|
| `GrowthSystemShell` | Layout, title, theme-aware wrapper |
| `GrowthStepTracker` | Diagnose / Build / Scale + current + locked states |
| `GrowthStatusHero` | Business name + one-line growth status |
| `DiagnoseSection` | Composes overview + market/site/offer cards |
| `BuildSection` | System activation + line items |
| `ScaleSection` | Metrics + channel + actions |
| `RecommendedActionsPanel` | CTAs from snapshot |
| `GrowthActivityFeed` | Recent activity list |
| `MetricCard` | Reuse Card + consistent typography |

All **presentational**; data from one React Query call to `/api/client/growth-snapshot`.

### P2.7 Microcopy principles (Phase 3)

- Outcome language (“missing leads,” “booking friction,” “best channel”) — see product spec.
- Avoid internal keys (`utm_source`, `lead_control_priority`) in UI.

### P2.8 Implementation sequence (Phase 3 preview)

1. Add `GET /api/client/growth-snapshot` + `buildClientGrowthSnapshot` stub (real structure, conservative defaults).
2. Add `/growth-system` page (server or client) + gate.
3. Wire Diagnose from `project_assessments` + optional diagnosis/funnel leads by email.
4. Wire Build from `funnel_content` defaults + static “automation” flags until Brevo/CRM flags exist.
5. Wire Scale from CRM aggregates by email (new storage method).
6. Link from `/dashboard`; update `siteDirectory.ts` entry.
7. Tests: API auth (401), eligibility (403 optional), snapshot shape.

### P2.9 Phase 2 completion checklist

- [x] **6.** Final route structure defined.
- [x] **7.** Role/access strategy defined.
- [x] **8.** Data flow + mapping layer defined.
- [x] **9.** Schema strategy defined (minimal first).
- [x] **10.** Major components + page structure defined.

**Phase 2 status: COMPLETE** (architecture only; no production code in this document).

---

## Next step

**Phase 3 — Implementation:** execute P2.8 in `CLIENT-GROWTH-SYSTEM` tracker or PR, starting with API + types + empty UI shell.

---

*Last updated: audit and architecture aligned to repo paths as of doc authoring. When adding `/growth-system`, register in `app/lib/siteDirectory.ts` and optionally `adminAgentFeatureGuide` for admin assistant awareness.*
