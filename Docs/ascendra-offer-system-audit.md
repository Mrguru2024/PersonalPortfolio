# Ascendra Offer + Persona Intelligence Center — Phase 0 Audit & Specification

**Document type:** Internal specification (audit + architecture).  
**Product name (proposed):** Ascendra Offer + Persona Intelligence Center (internal admin only).  
**Status:** Phase 0 complete (audit). **Phase 1:** [`ascendra-intelligence-architecture.md`](./ascendra-intelligence-architecture.md). **Phase 2 MVP:** schema, admin hub, personas, scripts, lead magnets, preview APIs (see repo).  
**Last updated:** 2026-03-21  

---

## Executive summary

The Ascendra codebase already contains substantial building blocks for lead generation, content operations, CRM, funnel assets, offer pages, heuristic grading, market-style research batches, AI-assisted copy, and versioning/publish workflows. There is **no single** “persona intelligence” or “unified offer command center” module today. Personas appear in **four disconnected shapes**: (1) marketing `TARGET_PERSONAS` in code, (2) CRM aggregate “personas” UI, (3) Content Studio `persona_tags` on documents/calendar, and (4) community `afn_profiles` (not marketing personas).

**Strategic decision:** Implement the new system by **extending and linking** existing admin surfaces, schemas, and services — **not** by cloning Content Studio, CRM sequences, or offer editors. New tables should appear only where no suitable store exists; otherwise add nullable FKs, JSON extensions, or join tables.

**Persona policy (non‑negotiable):** The six Ascendra **core customer personas** (Marcus, Kristopher, Tasha, Devon, Andre, **Denishia**) are **targets for messaging/offers/scripts only**. They are **not** application users, learners, or dashboard actors. Internal users remain Anthony (admin) and team (approved admins / future `internal_team` permission).

---

## 1. Audit summary

### 1.1 What exists today (high level)

| Domain | Primary location | Maturity |
|--------|------------------|----------|
| **Admin shell / auth** | `app/admin/*`, `app/lib/auth-helpers.ts`, `shared/accessScope.ts`, `shared/super-admin-identities.ts` | Strong: `isAdmin`, `isSuperUser`, permissions, Growth OS visibility tiers |
| **Site offers (public pages + admin editor)** | `site_offers` table, `app/admin/offers/*`, `app/api/admin/offers/*`, public `app/api/offers/[slug]` | Strong: sections JSON, optional stored `grading` |
| **Offer / funnel adjacent UI** | `app/admin/funnel/offer`, funnel content by slug | Medium: overlaps conceptually with `site_offers` |
| **Lead magnets & placements** | `funnel_content_assets`, `funnel_content`, `app/lib/authorityContent.ts`, `app/lib/funnelContentPlacements.ts`, admin funnel content library | Strong for **files + placements**; weak for **structured magnet “types”** (Reveal / Trial / One-step) as first-class data |
| **“Scripts”** | `crm_sequences` (JSON steps), `crm_sales_playbooks`, AI playbook generation | Strong for **automation scripts**; no dedicated **outreach script library** (warm/cold/DM/email) with persona binding |
| **CRM personas (analytics view)** | `app/admin/crm/personas` | **Misnamed for product intent** — aggregates `crm_contacts` by industry/type/status, not Ascendra target personas |
| **Marketing target personas (site)** | `app/lib/targetPersonas.ts` | Minimal: only `contractors-trades` and `general` — **does not include** the six named Ascendra personas |
| **Content Studio (internal CMS)** | `internal_*` tables, `app/admin/content-studio/*`, editorial calendar, templates, publish logs, edit history | Strong for **documents + workflow**; can host **lessons** if typed carefully |
| **Research (internal)** | `internal_research_batches`, `internal_research_items`, Growth OS intelligence research APIs | Strong for **keyword/topic batches**; not a full “competitor notes + CSV import” product UI |
| **AI** | OpenAI-backed routes for blog, newsletter, CRM playbooks/guidance, Growth OS content insights, assessment assist, etc. | Strong but **fragmented**; prompts not centrally persona-conditioned for offers |
| **Grading / scoring** | `lib/contentGrading.ts` → offer grading; internal audit scores; content insight scores; assessment grading | Multiple scorers — **unify conceptually** under “Value Grader” with different **engines** |
| **Preview** | Newsletter preview text; scattered UI “preview” labels; **no unified** landing/DM/email/ad preview shell for internal offer work | Weak for the **mandatory module 6** spec |
| **Versioning / approvals** | `internal_content_edit_history`, publish logs, draft/published on assets and CMS docs | Strong pattern to **reuse** for new entities |

### 1.2 Gaps vs requested “Ascendra Offer + Persona Intelligence Center”

1. **No canonical `personas` table** or API for the six Ascendra customer personas + dynamic signals + AI insights.  
2. **No lead magnet builder** that models **Reveal Problems / Samples·Trials / One Step Systems** as types with copy + visual + state machine beyond generic assets.  
3. **No outreach script engine** with persona-scoped templates for warm/cold/content/follow-up/objections (sequences/playbooks are adjacent but not equivalent).  
4. **No single Value Grader** UX that scores arbitrary “offer copy” with **persona relevance, uniqueness, market competitiveness** — current offer grading is **heuristic SEO/design/copy**, not LLM persona-aware.  
5. **No structured knowledge base** (`knowledge_modules`, `lessons`, `applications`) wired to personas/offers/scripts.  
6. **No “Learning + Strategy Engine”** UI (outreach + advertising curricula) — closest is scattered admin help/tips and playbook AI.  
7. **Preview hub** for landing/DM/email/ad is **not centralized**.

### 1.3 Security posture (relevant to this initiative)

- Admin APIs consistently use `isAdmin` / `isSuperUser` / `hasPermission`.  
- Public `GET /api/offers/[slug]` intentionally exposes **published offer content** — internal intelligence, drafts, and persona strategy must stay **admin-only** and must **not** leak via public routes.  
- New modules must follow the same pattern: **no new public routes** for internal intelligence; optional future **tokenized client-safe summaries** only where explicitly designed (pattern exists in Growth OS client shares / internal audit client-safe JSON).

---

## 2. Duplication findings

### 2.1 Persona concept fragmentation

| Mechanism | Risk |
|-----------|------|
| `TARGET_PERSONAS` vs CRM “Personas” page vs `persona_tags` vs AFN profiles | **Term collision** — teams will assume one “persona” system exists |
| Content Studio tags are **free-form strings** (not enforced enum of six personas + Denishia) | Inconsistent analytics and AI conditioning |

**Decision:** Introduce a **single canonical enum / table** `ascendra_personas` (or `marketing_personas`) for the six + Denishia. Migrate `persona_tags` validation to **reference** that source (FK or controlled vocabulary). **Rename or subtitle** CRM `/admin/crm/personas` to **“Lead segments & firmographics”** in UI to remove confusion (no DB rename required day one).

### 2.2 Offer vs funnel vs lead magnet

| Surface | Overlap |
|---------|---------|
| `site_offers` | Long-form offer **pages** |
| `funnel_content` | JSON copy for **startup funnel** pages by slug |
| `funnel_content_assets` | **Files** + placements (lead magnets) |
| `app/admin/funnel/offer` | **Fourth** mental model for “offer” |

**Decision:** Treat **`site_offers` + sections JSON** as the **canonical offer narrative** for public offer pages. Treat **`funnel_content_assets`** as **delivery vehicle** (file, video, deck) **linked** to a lead magnet record. **Deprecate duplicate copy** in funnel offer page **only after** parity inventory — Phase 3 consolidation.

### 2.3 Research: CRM vs Content Studio vs Growth OS

- `crm_research_profiles` — account/contact-centric sales notes.  
- `internal_research_batches/items` — keyword/topic batches for content intelligence.  

**Decision:** **Do not merge** these stores — different lifecycle. For “Market Research System” (module 5), add a thin **admin UI** that can **create/read** `internal_research_*` plus optional **upload to a new `market_research_snapshots`** table for CSV/manual rows **or** store uploads as `internal_cms_documents` with `content_type = market_research_upload` to avoid table sprawl (**merge decision: prefer document store for file-heavy snapshots** unless query needs require columns).

### 2.4 Grading engines

- `gradeOfferContent` — deterministic rules in `lib/contentGrading.ts`.  
- Internal audit — category scores + recommendations.  
- Content insight runs — AI scores in `internal_content_insight_*`.  
- Assessment grading — `aiAssistanceService`.

**Decision:** Present **one “Value Grader” admin UI** with **pluggable graders**: `rules_offer | rules_seo | llm_persona_value | internal_audit_adapter`. **Do not duplicate** rule logic — call existing functions.

### 2.5 Minor code path duplication

- `app/lib/contentGrading.ts` re-exports from `lib/contentGrading.ts` — acceptable indirection; **document single source** (`lib/contentGrading.ts`).

---

## 3. Merge plan

### 3.1 Reuse (extend, do not rebuild)

| Capability | Reuse |
|------------|--------|
| Rich text / documents | **Content Studio** `internal_cms_documents` for long-form lessons, research notes, script libraries (use `content_type` discriminator) |
| Templates | `internal_content_templates` |
| Version history | `internal_content_edit_history` |
| Publish workflow | `internal_publish_logs` + existing adapters pattern |
| Media / uploads | Existing upload pipelines + `funnel_content_assets` |
| Sequences / automation | `crm_sequences` for **execution**, not for **authoring** the canonical script library (link by ID from new tables) |
| Playbooks | `crm_sales_playbooks` + `playbookAIService` for **sales plays**; new **outreach script** entities can **generate** into playbooks optionally |
| AI infrastructure | Existing OpenAI services; add **shared prompt builder** with `personaId` + `tone` + `objective` |

### 3.2 New data (only where necessary)

| Entity | Rationale |
|--------|-----------|
| **`marketing_personas`** (or `ascendra_target_personas`) | Canonical six + Denishia, static fields + JSON for problems/goals/objections/signals |
| **`persona_dynamic_signals`** | Time-stamped signals (could be rows or JSON array versioned per persona) |
| **`persona_ai_insights`** | Cached LLM outputs with `model`, `promptHash`, `createdAt`, **admin editable** body |
| **`lead_magnets`** | First-class magnet with `type` enum (`reveal_problems`, `sample_trial`, `one_step_system`), copy fields, **FK** to asset(s), `status`, `persona_ids[]` |
| **`script_templates`** | Category enum (warm, cold, content, follow_up, objection), `persona_id`, body, variables JSON |
| **`market_research_snapshots`** | **Optional** if not using CMS documents — else defer |
| **`offer_scores`** | **Avoid** if `site_offers.grading` + new `value_grader_runs` table suffice — prefer **one run log** table referencing `slug` or `lead_magnet_id` |
| **`knowledge_modules` / `lessons` / `lesson_applications`** | Prefer **normalized** tables **or** strict `content_type` in CMS **plus** join table `lesson_links(persona_id, offer_slug, script_id, lesson_id)` |

### 3.3 Deprecation candidates (later phases — not immediate delete)

- Redundant copy in `funnel/offer` if fully superseded by unified center (inventory first).  
- Overloading word “personas” on CRM page — **UI deprecation** of misleading label.  
- Any ad-hoc persona strings in Content Studio once vocabulary is enforced.

---

## 4. Architecture (target)

### 4.1 Logical layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin UI: Ascendra Offer + Persona Intelligence Center          │
│ (single nav hub under /admin/ascendra-intelligence or similar)   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 Persona Layer          Offer & Magnet Layer     Script & Learning Layer
 (personas, signals,    (site_offers link,       (script_templates,
  insights)              lead_magnets, assets)     knowledge_modules)
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                    Value Grader Orchestrator
              (rules engines + optional LLM grader)
                                │
                                ▼
                     Market Research Adapters
       (internal_research_*, CSV/uploads, manual entries)
                                │
                                ▼
                     Preview Renderers (server-only)
       (HTML fragments for email/DM/ad; reuse offer page data)
```

### 4.2 Integration points

- **Persona-aware AI:** All new generators accept `personaIds: string[]` and `avoidGeneric: true` policy; outputs stored as **draft** records editable in UI.  
- **No fake real-time:** Batch jobs and explicit “Refresh insights” buttons; show `generatedAt` / `model` / `confidence` labels.  
- **Internal only:** Route group under `app/admin/...` + `app/api/admin/ascendra-intelligence/...` (exact path TBD in Phase 1).

---

## 5. File structure (proposed — Phase 2+)

> **Note:** Phase 0 defines structure only; files are **not** created until Phase 2.

```
app/admin/ascendra-intelligence/
  layout.tsx
  page.tsx                    # hub dashboard
  personas/[id]/page.tsx
  lead-magnets/[id]/page.tsx
  scripts/page.tsx
  research/page.tsx
  grader/page.tsx
  preview/page.tsx
  learning/outreach/page.tsx
  learning/ads/page.tsx

app/api/admin/ascendra-intelligence/
  personas/
  personas/[id]/signals/
  personas/[id]/insights/
  lead-magnets/
  scripts/
  research/
  grade/
  preview/

server/services/ascendraIntelligence/
  personaService.ts
  leadMagnetService.ts
  scriptTemplateService.ts
  valueGraderOrchestrator.ts
  learningModuleService.ts

shared/ascendraIntelligenceSchema.ts   # drizzle tables (or split by domain)
```

**Merge with existing:** Import from `@server/services/*` already used patterns (storage, transactions). Reuse Zod validation style from other admin routes.

---

## 6. Schema (proposed / merge-aware)

### 6.1 Canonical personas (including Denishia)

**Table `marketing_personas` (proposed):**

| Column | Type | Notes |
|--------|------|--------|
| `id` | text PK | Stable slug: `marcus`, `kristopher`, `tasha`, `devon`, `andre`, `denishia` |
| `display_name` | text | e.g. “Marcus – Skilled Trades Owner” |
| `segment` | text | Optional grouping |
| `revenue_band` | text | e.g. Denishia: `$2K–$10K/month` |
| `summary` | text | Short positioning |
| `problems_json` | json | Array of strings |
| `goals_json` | json | Array of strings |
| `objections_json` | json | Array of strings |
| `strategic_note` | text | e.g. Denishia: partner-level / creative entrepreneur |
| `dynamic_signals_json` | json | Latest curated signals (AI can propose updates → admin approves) |
| `updated_at` | timestamp | |

**Seed:** Six required personas + **Denishia** with fields aligned to product brief (Macon Designs, hybrid creative entrepreneur, “don’t lose creative control” objection, AI competition signal).

### 6.2 Optional normalized satellites

- `persona_signal_events (id, persona_id, signal, source, created_at)` — if JSON versioning is insufficient.  
- `persona_ai_insights (id, persona_id, kind, body_md, model, prompt_hash, confidence_label, created_at, superseded_by)` — **always editable** by admin.

### 6.3 Lead magnets

`lead_magnets` table **or** extend `funnel_content_assets` with new columns — **decision:** **New `lead_magnets` table** with FK `primary_asset_id → funnel_content_assets.id` to **reuse file storage** and avoid duplicating upload logic.

| Column | Notes |
|--------|--------|
| `magnet_type` | enum: `reveal_problems`, `sample_trial`, `one_step_system` |
| `title`, `hook`, `body_md` | Copy |
| `visual_asset_ids` | json array of int FKs optional |
| `persona_ids` | text[] referencing `marketing_personas.id` |
| `status` | `draft | approved | published` |
| `published_at` | nullable |

### 6.4 Script templates

`script_templates`:

| Column | Notes |
|--------|--------|
| `category` | `warm | cold | content | follow_up | objection` |
| `persona_id` | FK |
| `name`, `body_md`, `variables_json` | |
| `status` | draft / approved / published |

**Link to CRM:** optional `crm_sequence_id` or `playbook_id` for **deploy** actions (future).

### 6.5 Knowledge base

**Option A (preferred for speed):** Use `internal_cms_documents` with:

- `content_type = ascendra_lesson | ascendra_module_overview`  
- Join `lesson_links` table: `(lesson_document_id, persona_id, related_slug, related_type)`

**Option B (normalized):** `knowledge_modules`, `lessons`, `lesson_applications` as dedicated tables — use if reporting requires strict SQL across hundreds of lessons.

**Decision for MVP:** **Option A** + one join table; migrate to Option B if query pain appears.

### 6.6 Value grader runs

`value_grader_runs`:

| Column | Notes |
|--------|--------|
| `id` | serial |
| `target_type` | `site_offer | lead_magnet | script_template | freeform` |
| `target_id` | text or int (polymorphic) |
| `grader_profile` | `rules_only | persona_llm | combined` |
| `scores_json` | unified shape: clarity, specificity, persona_fit, uniqueness, cta, competitiveness |
| `weaknesses_json`, `improvements_json` | |
| `confidence_label` | e.g. `high | medium | low` for LLM portions |
| `created_by_user_id` | |

**Reuse:** Populate baseline from `gradeOfferContent` when `target_type = site_offer`, then **layer** LLM persona critique if key present.

### 6.7 Market research

- **Primary:** Continue `internal_research_batches` / `internal_research_items`.  
- **Add:** Admin CSV import → create **batch** + items OR attach CSV to CMS document + parse metadata row.  
- **Competitor notes:** CMS documents or new `competitor_notes` table if relational filters needed.

---

## 7. Permissions

| Role | Access |
|------|--------|
| **Approved admin (`isAdmin`)** | Full CRUD on intelligence center, run graders, publish magnets |
| **Super user** | Same + destructive ops / exports (align with existing super-user tooling) |
| **`internal_team` (future)** | Read-only or scoped write on **lessons** only — **not** on CRM financials |
| **Client / public** | **No access** — no routes under `app/api` public for this system |

**Implementation rule:** Every new route: `if (!(await isAdmin(req))) return 403;` minimum; use `hasPermission` if feature flags per module later (`permissions.ascendra_intelligence` optional).

---

## 8. UI map (admin)

| Screen | Purpose |
|--------|---------|
| **Hub** | Cards linking to personas, magnets, scripts, research, grader, preview, learning |
| **Persona detail** | Static profile, signals timeline, AI insights editor, linked magnets/scripts/lessons |
| **Lead magnet editor** | Type picker, copy, visual picker (reuse media), placements preview, publish |
| **Script library** | Filter by persona + category; duplicate / export |
| **Research** | List batches, upload CSV, manual keyword rows, link to personas |
| **Value grader** | Pick target, run profile, show history of runs |
| **Preview** | Tabs: Landing (offer page fetch), DM (plain text), Email (HTML safe iframe), Ad (short copy + aspect note) |
| **Learning / Outreach** | Module → lessons → “apply to script” workflow |
| **Learning / Ads** | Modules + tie-in to lead magnets + optional “ad draft” generator |

**Navigation merge:** Add one item to main admin sidebar; **do not** scatter new pages across Funnel vs CRM without links back to hub.

---

## 9. AI architecture

### 9.1 Principles

- **Persona-conditioned prompts** — inject `marketing_personas` row + strategic note + objections.  
- **All outputs editable** — store as DB/CMS content, never auto-publish without explicit state transition.  
- **Explicit metadata** — `model`, `temperature`, `prompt_version`, `created_at`.  
- **No fabricated “live market data”** — when using research items, cite **source = internal batch/upload**, not scraped third parties unless compliant sources are added later.

### 9.2 Service layout

- `ascendraIntelligenceAIService.ts` wrapping OpenAI with:  
  - `suggestMessaging(personaId, context)`  
  - `critiqueOfferCopy(personaId, sections)`  
  - `generateScriptVariant(templateId, tone)`  
  - `summarizeResearchBatch(batchId)`  

### 9.3 Rate limiting & cost

- Reuse existing admin patterns; consider per-admin user limits on expensive routes.

---

## 10. Value grader logic

### 10.1 Dimensions (product spec mapped to implementation)

| Dimension | MVP source |
|-----------|------------|
| **Clarity** | Heuristics (readability, structure) + optional LLM |
| **Specificity** | Heuristics (numbers, niche language) + LLM |
| **Persona relevance** | **LLM required** — rules cannot infer well |
| **Uniqueness** | LLM compare against generic baseline prompt |
| **CTA strength** | Reuse partial logic from `lib/contentGrading.ts` CTA checks |
| **Market competitiveness** | **LLM assisted** + **manual** competitor notes attachment — do not claim automated real-time market scanning |

### 10.2 Output shape

```json
{
  "scores": { "clarity": 0-100, "specificity": 0-100, "persona_fit": 0-100, "uniqueness": 0-100, "cta": 0-100, "competitiveness": 0-100 },
  "overall": 0-100,
  "weaknesses": ["..."],
  "improvements": ["..."],
  "confidence": "high | medium | low"
}
```

### 10.3 Orchestration

1. If target is `site_offer`, run `gradeOfferContent` → map to subset of scores.  
2. If LLM enabled, run persona critique → merge with weights.  
3. Persist `value_grader_runs` for audit trail.

---

## 11. Implementation plan (phased)

| Phase | Scope | Deliverables |
|-------|--------|--------------|
| **0 — Audit** | This document | `docs/ascendra-offer-system-audit.md` |
| **1 — Architecture** | ER diagram, API contracts, nav spec, permission matrix, prompt policy | Addendum or `docs/ascendra-intelligence-architecture.md` |
| **2 — MVP** | `marketing_personas` seed (incl. Denishia), hub page, persona detail, script_templates CRUD, link to existing offers/assets, basic preview tab (read-only fetch) | Shipping code + migrations |
| **3 — Consolidate** | UI rename CRM personas, dedupe funnel offer vs site offers, enforce persona tag vocabulary, wire sequences deploy | Refactor PRs |
| **4 — Documentation** | Admin runbook, AI safety checklist, data retention | Internal docs |

---

## 12. Production code (Phase 0 statement)

**Phase 0 delivers no production code for this initiative.**  

**Standards for Phase 2 production code:**

- All new APIs under `app/api/admin/...` with `isAdmin` gate.  
- Drizzle migrations committed; no raw unbounded SQL from client.  
- Persona seed data includes **Denishia** with partner-level strategic note and stated objections/signals.  
- LLM features behind env flag + explicit admin action (no silent auto-rewrite of published content).  
- Tests: service unit tests for grader orchestration + API integration tests for auth (403 for non-admin).

---

## Appendix A — Core persona roster (reference)

1. **Marcus** — Skilled Trades Owner  
2. **Kristopher** — Branding Studio Owner  
3. **Tasha** — Beauty Business Owner  
4. **Devon** — Early SaaS Founder  
5. **Andre** — Consultant / Freelancer  
6. **Denishia** — Creative Studio Owner (Macon Designs); hybrid creative entrepreneur / partner-level persona; $2K–$10K/month; problems: inconsistent client flow, underpricing, no funnel/system, referral dependence; goals: better clients, consistent income, scalable systems; objection: “I don’t want to lose creative control”; signals: AI competition, demand for strategy + funnels, shift to productized services.  

**All are customer targets only, not users.**

---

## Appendix B — Key existing files (audit trail)

- Offers: `shared/schema.ts` (`siteOffers`), `app/admin/offers/*`, `app/api/admin/offers/*`, `lib/contentGrading.ts`, public `app/api/offers/[slug]/route.ts`  
- Lead magnets: `funnel_content_assets`, `app/lib/authorityContent.ts`, `app/lib/funnelContentPlacements.ts`, `app/api/admin/funnel-content-assets/*`  
- CRM scripts: `shared/crmSchema.ts` (`crm_sequences`, `crm_sales_playbooks`), `app/api/admin/crm/sequences/*`, `server/services/playbookAIService.ts`  
- Personas (current): `app/lib/targetPersonas.ts`, `app/admin/crm/personas/page.tsx`, Content Studio persona tags on documents/calendar APIs  
- Research: `internal_research_batches/items` in `shared/internalStudioSchema.ts` (via schema re-exports), Growth OS intelligence routes  
- Auth: `app/lib/auth-helpers.ts`, `shared/accessScope.ts`, `shared/super-admin-identities.ts`  

---

*End of Phase 0 audit & specification.*
