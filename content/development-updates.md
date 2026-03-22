# Development updates

Log of features and fixes shipped to production. Edit this file when you ship and push; the admin dashboard shows it in digest form (plain text, no markdown formatting).

**Format:** Each section is `## YYYY-MM-DD [time] — Title` then bullet points. Optional **time** after the date (24h `14:30` or `2:30 PM`) appears in the admin dashboard next to the date; if you omit it, only the date and title are shown (no placeholder).

**Production sourcing:** Vercel builds a GitHub raw URL from `VERCEL_GIT_REPO_OWNER` + `VERCEL_GIT_REPO_SLUG` + `main` (or `DEVELOPMENT_UPDATES_GITHUB_REF`), or uses `DEVELOPMENT_UPDATES_RAW_URL` if set. See `.env.example` and `AGENTS.md`.

---

## 2026-03-22 — Revenue Ops, Communications, Paid Growth, and funnel polish

- **Lean Revenue Ops (Growth OS):** Admin **Revenue Ops** dashboard and settings (`/admin/growth-os/revenue-ops`), Twilio SMS and Stripe-aware helpers, booking-link flows, and CRM contact **Revenue Ops** actions. Webhook routes for Stripe and Twilio; optional env vars documented in `.env.example`. See `Docs/implementation/LEAN-REVENUE-OPS.md`.
- **Communications suite:** Admin **Communications** hub — campaigns, email designs, analytics, test send, AI assist on designs, audience preview. APIs under `/api/admin/communications/*`; seed via `scripts/seed-communications.ts`. Aligns with `Docs/implementation/COMMUNICATIONS-SYSTEM-AUDIT-AND-PLAN.md`.
- **Paid Growth module:** Admin **Paid Growth** area (accounts, campaigns, readiness, lead quality, reports) plus backing APIs and schema. See `Docs/implementation/PAID-GROWTH-MODULE.md` and `scripts/seed-paid-growth.ts`.
- **CRM & invoices:** Richer contact profile (revenue ops, social discovery/suggestions, market intel on proposal prep), invoice send/remind and line presets, internal audit run detail and public HTTPS checks.
- **Marketing funnel UX:** Shared **`FunnelHeroMedia`** for consistent hero images across lead magnets and service pages; **bottom spacing** so CTAs no longer sit flush on images. **`/free-trial`** copy reframed around outcomes (clarity call + Digital Growth Snapshot). Page backdrop / edge gradients in `globals.css` + layout.
- **Persona & ecosystem:** Journey panel and related-work rotation updates; **`/go/book/[token]`** short links; client portal eligibility API; login hub polish; site directory search improvements.

---

## 2026-03-22 15:30 — Admin: CRM quick actions, offer AI fill, IQ persona quick create

- **CRM (`/admin/crm`):** Per-lead **quick actions** menu on list and pipeline cards (`CrmContactQuickActions`) — mailto, SMS, tel, copy email/phone, timeline **note**, **follow-up task**, **intent** submenu, open profile, Discovery workspaces. Helpers in `app/lib/crmContactOutreach.ts`.
- **Offer editor:** **AI fill** dialog drafts name, meta, hero, price, deliverables, bullets, CTA, banner from a prompt; optional **include current form** for rewrites. `POST /api/admin/offers/ai-generate` + `server/services/offerAiFillService.ts`. **Persona targeting (IQ) is never overwritten**; blank hero/banner URLs keep existing assets. Requires `OPENAI_API_KEY`.
- **Offer editor — Persona targeting:** **Quick create** modal + link to full persona form (`QuickCreatePersonaModal`, `app/lib/personaFormUtils.ts` shared with `/admin/ascendra-intelligence/personas/new`).
- **Marketing personas seed:** Additional high-ticket IQ personas in `shared/ascendraPersonaSeed.ts` with cited public data sources in strategic notes (no fabricated stats). Run `npm run db:seed` to upsert.

---

## 2026-03-22 — Persona journey, revenue bridge, and funnel alignment

- **Persona journey:** Public `/journey` with `?journey=` and localStorage; compact selector on home (`#persona-journey`). Copy and paths live in `shared/personaJourneys.ts`. Visitor tracking: `persona_journey_selected`, `persona_journey_viewed`, `persona_journey_lead_magnet_click` (plus `cta_click` with `personaId` on journey CTAs). Lead scoring weights added for those events in `server/services/leadScoringService.ts`.
- **Revenue bridge (no new DB tables):** `shared/personaRevenueMap.ts` maps each journey id to `site_offers.slug` (`startup-growth-system`) and lead-magnet slugs for analytics alignment with `funnel_content_assets.lead_magnet_slug`. `PersonaOfferTeaser` on the journey panel loads `GET /api/offers/[slug]` and links to `/offers/[slug]`; fires `section_engagement` when shown. **Ops:** run `npm run db:push` and `npm run db:seed` (or ensure `site_offers` has `startup-growth-system`) or the teaser stays hidden on 404.
- **Proof on journey:** `caseStudyRefs` resolve to portfolio `projects` (`/projects/[id]`); cards show synopsis challenge line when present (`app/lib/personaCaseStudies.ts`).
- **Service pages:** `PersonaServiceHeroAccent` when stored persona matches `recommendedService` / primary / secondary CTA href (`app/lib/servicePagePersonaMatch.ts`) on contractor, local business, startup MVP, marketing assets, brand growth.
- **Footer / diagnostics:** “Growth assessment (full)” links to `/assessment` via `PROJECT_GROWTH_ASSESSMENT_PATH` (`app/lib/funnelCtas.ts`). Diagnostics hub links to `/journey`. `siteDirectory` includes `/journey`. `TrackedCtaLink` supports optional `extraMetadata` for attribution.

---

## 2026-03-22 11:00 — Next-only stack, dev bundler, auth/HMR hardening, header hydration

- **Single Next surface:** Removed legacy Vite `client/` and Express Vite integration; `dev:old` serves the Next app as static files only. Added small Express helpers (`logger`, `serveStatic`). `components.json` and tooling aligned with `app/globals.css`; `npm run check` uses `scripts/ensure-next-types.mjs` for Next route types.
- **Next.js 16 dev:** `npm run dev` runs **`next dev --webpack`** because Next 16 defaults to Turbopack (which was causing “module factory is not available” HMR errors on some admin routes). **`npm run dev:turbo`** opts into Turbopack. `AGENTS.md` documents this; production **`next build`** was already **`--webpack`**.
- **Client auth module graph:** `app/lib/super-admin.ts` is a leaf exporting `isAuthSuperUser`; `use-auth` re-exports it and declares **`"use client"`**. Restored **`"use client"`** on Radix wrappers where the directive had been corrupted (`select`, `dialog`, `sheet`).
- **Hydration vs browser extensions:** `fdprocessedid` and similar attributes from password-manager extensions no longer spam hydration warnings — **`suppressHydrationWarning`** on `ui/button` and plain header/mobile `<button>`s; clarified `layout` body comment (body-level suppression does not cover descendants).
- **Product/ops (subset):** Client trial window helpers (`shared/userTrial`, API/register/login/user paths, `TrialBanner`); contact page and `StrategyCallForm` refinements; CRM list/detail and admin shell/nav polish; OAuth callback and intelligence route tweaks; shared security/env and schema updates.

---

## 2026-03-21 16:30 — Development updates sourcing and Content Studio social adapters

- Admin “Development updates” on production resolves `content/development-updates.md` from **main** via explicit `DEVELOPMENT_UPDATES_RAW_URL` or automatic URL from Vercel Git env vars.
- Content Studio calendar publishing: adapters for LinkedIn (UGC API), X (API v2), webhook hub (Buffer/Make-style JSON POST), and Brevo notify-only; same publish logs and calendar rows as Facebook/manual.

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
