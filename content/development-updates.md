# Development updates

Log of features and fixes shipped to production. Edit this file when you ship and push; the admin dashboard shows it in digest form (plain text, no markdown formatting).

**Format:** Each section is `## YYYY-MM-DD [time] — Title` then bullet points. Optional **time** after the date (24h `14:30` or `2:30 PM`) appears in the admin dashboard next to the date; if you omit it, only the date and title are shown (no placeholder).

**Production sourcing:** Vercel builds a GitHub raw URL from `VERCEL_GIT_REPO_OWNER` + `VERCEL_GIT_REPO_SLUG` + `main` (or `DEVELOPMENT_UPDATES_GITHUB_REF`), or uses `DEVELOPMENT_UPDATES_RAW_URL` if set. See `.env.example` and `AGENTS.md`.

---

## 2026-03-30 00:24 — Trust assurance, offer engine, agency OS, PPC depth

- Trust assurance on ICP landers and startup growth offer page; EmbeddedAssurance + copy module.
- Build fixes: offer-engine funnel Badge links, persona query `await res.json()`, OpenAI shim on agent observation route.
- Large batch: Agency OS surfaces, offer engine admin/API, paid-growth billable/verification, content studio strategy hooks, public PDFs.

---

## 2026-03-29 23:11 — Agency OS, behavior intelligence, growth platform, paid-growth, AFN

- feat: agency OS, behavior intelligence, growth platform, paid-growth depth, AFN fixes

---

## 2026-03-29 16:03 — Auto · fd4d6a2

- `feat: admin audience preview, Lucky Orange, growth/lead UI updates` (`fd4d6a2`)

---

## 2026-03-29 14:59 — Auto · b5a1c1c

- `chore: append development-updates for 43706c4` (`b5a1c1c`)

---

## 2026-03-29 14:58 — Auto · 43706c4

- `feat: experiments tutorial, A/B tools, AI insights, lead control, admin and AMIE updates` (`43706c4`)

---

## 2026-03-29 12:04 — Auto · b72836c

- `feat: AEE experiments engine, CRM attribution, admin UX, scheduler and revenue ops updates` (`b72836c`)

---

## 2026-03-28 22:16 — Auto · 0f0f9d7

- `Dev log: record 760be9a.` (`0f0f9d7`)

---

## 2026-03-28 22:15 — Auto · 760be9a

- `Move AFN to /Afn with redirects; scheduler admin and public booking.` (`760be9a`)

---

## 2026-03-28 — Admin workspace sync

- Admin read-aloud: browser voices, reading styles, and optional OpenAI natural TTS; how-to guides page; email hub tracking, templates, inbox, and crons; market intelligence and community APIs; AMIE-related services and schema; paid-growth campaigns hydration guard; integrations and shared schema updates.

## 2026-03-28 13:03 — Auto · dafc408

- `chore: dev log for 745156c` (`dafc408`)

---

## 2026-03-28 12:43 — Auto · 6d289ff

- `chore: dev log for 745156c` (`6d289ff`)

---

## 2026-03-28 12:41 — Auto · 745156c

- `feat: admin inbound alerts, market research nav, LinkedIn company pages` (`745156c`)

---

## 2026-03-28 12:19 — Auto · 6518e52

- `Threads OAuth state signing; Growth OS intel UI; research model 403 handling; GOS_OPENAI_MODEL helper` (`6518e52`)

---

## 2026-03-28 04:14 — Auto · efcfc0e

- `Dev log: record commit 84b8b0d` (`efcfc0e`)

---

## 2026-03-28 04:14 — Auto · 84b8b0d

- `Dev log: record commit 9878416` (`84b8b0d`)

---

## 2026-03-28 04:13 — Auto · 9878416

- `PWA/offline, route-modules migration, Meta OAuth state signing, integrations and comms updates` (`9878416`)

---

## 2026-03-26 06:02 — Auto · ba53a21

- `feat: Content Studio Facebook OAuth and admin batch updates` (`ba53a21`)

---

## 2026-03-26 06:02 — Auto · 374e809

- `feat: Content Studio Facebook OAuth and admin batch updates` (`374e809`)

---

## 2026-03-25 19:17 — Auto · 8f48481

- `chore: development log entry for SEO and comms changes` (`8f48481`)

---

## 2026-03-25 19:17 — Auto · 52563f5

- `SEO: server metadata and JSON-LD; sitemap fixes; comms draft audience edit` (`52563f5`)

---

## 2026-03-25 19:16 — Auto · fa6258b

- `SEO: server metadata and JSON-LD; sitemap fixes; comms draft audience edit` (`fa6258b`)

---

## 2026-03-25 06:53 — Auto · 1ce01b9

- `chore: append development-updates digest` (`1ce01b9`)

---

## 2026-03-25 06:34 — Auto · 5872031

- `chore: append dev log for amend commit` (`5872031`)

---

## 2026-03-25 06:33 — Auto · 73c106a

- `feat(admin): email merge tags, Brevo setup page, rich text image upload` (`73c106a`)

---

## 2026-03-25 06:31 — Auto · 7d3396e

- `feat(admin): email merge tags, Brevo setup page, rich text image upload` (`7d3396e`)

---

## 2026-03-24 — Offer audit Google Ads unification

- One **`fireOfferValuationConversion`** path for submit and lead on the public funnel; optional **`NEXT_PUBLIC_GOOGLE_ADS_CV_*`** label envs with **`NEXT_PUBLIC_GOOGLE_ADS_ID`**; strategy-call **`send_to`** reads **`NEXT_PUBLIC_GOOGLE_ADS_SEND_TO_STRATEGY_CALL`** (or legacy **`_STRATEGY_CALL_CLICKED`**).

---

## 2026-03-23 22:15 — Offer audit UTM, conversions, canonical site metadata

- Persist UTM on offer valuations; client attribution and Google Ads conversion hooks; canonical site URL for Open Graph, sitemap, and robots.

---

## 2026-03-23 — Newsletters for CRM leads & clients, brand file folders, and clearer reading

- **Newsletters:** You can send a campaign to **all CRM leads** or **all CRM clients** (everyone with an email on file), or stick with your main subscriber list. When you build a custom list, the CRM picker can show only leads or only clients, add everyone in view at once, or pick individuals.
- **Brand temp vault (admin):** A place to drop **documents or images** while brand work is in motion. We split folders by type so uploads stay organized. Files **expire after 90 days** on purpose—to keep hosting light and encourage moving finals to long-term storage. Copy the link if you need to keep something elsewhere.
- **Blog reading:** Long-form posts now follow the **same brand colors** as the rest of the site (headings, quotes, code, tables) so articles feel like part of Ascendra—not a separate gray template.
- **Links:** Hovering a link (or tapping on mobile) shows a **soft purple highlight** so it’s obvious what’s clickable, using our primary brand color.
- **Operations:** A daily job cleans up expired temp files; newsletter sending was wired to respect the new CRM audience options.

---

## 2026-03-23 — Theme tokens, OG image, footer, admin chat bell

- **Theme & UI:** Ascendra semantic tokens (`globals.css`, `tailwind.config.ts`) and shadcn-style primitives (button, card, badge, alert, dialog, sheet, input, textarea, select, form, theme-provider). Marketing pages use section/elevated background tokens.
- **AnimatedButton:** Passes **`variant="gradient"`** through to **`Button`**.
- **OG / SEO:** **`public/og-ascendra.png`**, **`scripts/generate-og-ascendra.mjs`**, **`PageSEO`**, **`BlogPostSEO`**, root **`layout`**, **`manifest.json`**.
- **Footer:** **`SiteFooter`** is a client component; **`FooterLanguageControl`** default export (stable under Webpack + RSC).
- **Admin:** Internal chat notification bell refetches and marks read when the dropdown opens.

---

## 2026-03-23 — PPC, CRM & lead conversion lead magnet

- **Public funnel:** **`/ppc-lead-system`** — landing page for teams focused on lead prospecting, CRM fit, conversion, and paid ads (Google, Meta, LinkedIn). Hero, pillars, contrast with Digital Growth Audit, **`PpcLeadMagnetForm`**, ecosystem insight strip, **`LeadMagnetRelatedWorkSection`**, recommended next step.
- **API:** **`POST /api/ppc-lead-consultation`** — validates context, builds structured message, submits via **`portfolioController.submitContactForm`** (subject: PPC, CRM & Lead Growth Consultation Request; default **`landing_page`** `/ppc-lead-system`).
- **Thank-you:** **`ppc_lead_consultation`** in **`funnelThankYou`** + tailored copy on **`/thank-you?form=ppc_lead_consultation`** for stable conversion URLs (e.g. Google Ads).
- **Discovery:** **`PPC_LEAD_MAGNET_PATH`** in **`funnelCtas`**, card on **`/free-growth-tools`** (**`LEAD_MAGNETS`**), **`siteDirectory`** entry, **Growth** footer link (“PPC & lead systems”), related-work key **`ppc-lead-system`**.

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
