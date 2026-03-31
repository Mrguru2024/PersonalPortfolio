# Ascendra OS — Feature inventory & pricing framework

**Purpose:** Copy this document into ChatGPT (or another assistant) to continue pricing, packaging, or GTM work.  
**Source:** Derived from `app/lib/siteDirectory.ts`, `Docs/PROJECT-AUDIT-AND-OVERVIEW.md`, admin nav, and codebase routes.

---

## Pricing framework (use for every SKU)

| Factor | Practice |
|--------|----------|
| **Profitability** | Per bucket: estimate gross margin = (price − labor − tools/APIs − ops allocation) ÷ price. High-touch (PPC, AMIE, agreements) needs monthly minimums or hourly floors. |
| **Market location** | US local SMB → retainer + clear scope. National / higher ACV → platform + success bundles. Price-sensitive markets → stronger DIY/DWY; competitive metros → DFY + performance. |
| **Competition** | Sell **Ascendra OS** (CRM + lead control + content + email + scheduling + paid growth + experiments + market intel + Agency OS + **first-party Growth Intelligence**), not a single tool. Anchor to replacement cost of point solutions + PM overhead. |
| **Market climate** | Soft economy → efficiency, lead quality, LTV, experiments, diagnostics; smaller entry + upsells. Expansion → DFY + platform + outcome narratives. |
| **Value** | Tie to booked calls, CPL/CPQL, pipeline, speed-to-lead, content throughput, **conversion diagnostics** (behavior-linked). Ask: “What is one extra qualified lead/month worth?” |

**Pricing shapes that fit this codebase**

1. Tiered **platform access** (seat/brand): portal + Growth System + Conversion Diagnostics + optional community.  
2. **Implementation / DFY**: fixed phases ↔ Agency OS milestones + agreements.  
3. **Retainers**: PPC, content, CRM ops — scope + caps (billable events exist in paid growth).  
4. **Usage / data**: behavior storage, AMIE depth, experiment volume — overage after included volumes.

---

## A. Public marketing & conversion

| Area | Routes / product |
|------|------------------|
| Core marketing | `/`, `/about`, `/services`, `/faq`, `/contact`, `/strategy-call`, `/book`, thank-you, legal, partners, `/brand-growth` |
| ICP landers | `/launch-your-brand`, `/rebrand-your-business`, `/marketing-assets`, `/contractor-systems`, `/local-business-growth`, `/startup-mvp-development`, `/offers/startup-growth-system` |
| Lead hub & tools | `/free-growth-tools`, `/free-trial`, `/digital-growth-audit`, `/ppc-lead-system`, `/market-score` (AMIE funnel), `/journey`, `/diagnostics`, `/growth-diagnosis`, website scores, `/website-revenue-calculator`, `/competitor-position-snapshot`, `/homepage-conversion-blueprint`, `/offer-audit`, resources, `/generate-images` |
| **Pricing path** | CAC recovered downstream; landers as packs; Market Score / tools as free-to-freemium, upsell calls or deep reports |

---

## B. Diagnosis, assessment & qualification

| Area | Routes |
|------|--------|
| Questionnaire funnels | `/growth`, `/diagnosis`, `/diagnosis/results`, `/assessment`, `/assessment/results`, `/apply`, `/recommendations` |
| Growth platform | `/growth-platform`, `/growth-platform/recommendation`, `/service-engagement` |
| **Pricing path** | Bundled discovery or paid assessment; qualify before heavy sales time |

---

## C. Commerce & legal

| Area | Routes |
|------|--------|
| Paid challenge | `/challenge`, apply, checkout, welcome, dashboard, thank-you |
| Agreements | `/agreements/[token]` — sign, milestones, Stripe (admin: `/admin/growth-platform/agreements`) |
| **Pricing path** | Challenge = fixed + bumps; agreements = milestone billing, scope clarity |

---

## D. Content & authority

| Area | Routes |
|------|--------|
| Blog & breakdowns | `/blog`, `/blog/[slug]`, `/website-breakdowns`, `/updates` |
| Resources | `/resources/startup-growth-kit`, `/resources/startup-action-plan` |
| **Pricing path** | Organic + CTAs; optional content subscription; client-only locks |

---

## E. Community (AFN)

| Area | Routes |
|------|--------|
| Product | `/Afn` (hub, feed, post, members, profiles, resources, inbox, collab, onboarding, profile, settings) |
| Aliases | `/community`, `/afn` → rewritten to `/Afn` in root `proxy.ts` |
| Admin | `/admin/community/live-access`, `/admin/community/scoring` |
| **Pricing path** | Membership tiers; internal cost vs sponsor upsells |

---

## F. Client portal

| Area | Routes |
|------|--------|
| Auth | `/login`, `/portal`, `/portal/welcome`, `/auth`, forgot/reset password |
| Workspace | `/dashboard`, `/dashboard/ppc-results`, `/dashboard/proposals/[id]`, `/projects/[id]` |
| Growth System | `/growth-system`, diagnose/build/scale, **`/growth-system/conversion-diagnostics`**, `/growth-system/improvements`, `/growth-system/page-behavior` |
| Other | `/offer-valuation` |
| Token | `/proposal/view/[token]`, `/gos/report/[token]` |
| **API** | e.g. `GET /api/client/growth-snapshot`, `GET /api/client/conversion-diagnostics?days=` |
| **Pricing path** | Include in paid engagement; “Insight tier” for diagnostics + behavior; don’t give full OS away free |

---

## G. Ascendra OS — admin (operator)

### G1. Core
- `/admin/dashboard`, `/admin/settings`, `/admin/agent-knowledge`, `/admin/operator-profile`, `/admin/reminders`, `/admin/users`, `/admin/system`, `/admin/integrations`, `/admin/deployment-env` (super), `/admin/site-directory`, `/admin/how-to`, `/admin/how-to/experiments`

### G2. CRM & leads
- Full CRM (contacts, accounts, pipeline, tasks, sequences, import, saved lists, personas, discovery, proposal prep, playbooks)
- `/admin/lead-intake`, `/admin/leads`, `/admin/leads/settings` (Lead Control)

### G3. Communications & content
- `/admin/email-hub` (+ inbox, compose, templates, tracking, etc.)
- Blog, newsletters, subscribers
- `/admin/content-studio` (documents, calendar, strategy, campaigns, workflow, import-export)
- `/admin/communications` (campaigns, designs, analytics)
- `/admin/brand-vault`

### G4. Marketing IQ
- `/admin/ascendra-intelligence` (personas, scripts, lead magnets, preview)
- `/admin/offer-engine` (offers, lead magnets, personas, funnel paths, analytics hooks)
- `/admin/offers`, `/admin/funnel` (+ slug editors, content library)

### G5. Growth OS & scheduling
- `/admin/growth-os`, `/admin/growth-os/intelligence`, security, shares
- `/admin/scheduler`, `/admin/scheduling` (+ subroutes)
- `/admin/market-intelligence` (**AMIE**)
- `/admin/internal-audit`, `/admin/growth-diagnosis`

### G6. Analytics & first-party behavior
- `/admin/analytics`
- **Ascendra Growth Intelligence:** `/admin/behavior-intelligence` (+ layout/subnav), conversion diagnostics, visitors, watch, replays, heatmaps, surveys, user tests, friction, insight tasks; `/admin/storage-retention`
- APIs: e.g. `/api/admin/growth-intelligence/diagnostics`, insight-tasks, behavior ingest, watch-config, cron behavior-friction, storage-retention

### G7. Experimentation
- `/admin/experiments` (AEE: new, `[id]`, reports, patterns)

### G8. Paid growth
- `/admin/paid-growth` (+ campaigns, optimization, verification, billable events, calls, billing, structure, etc.)

### G9. Growth platform & Agency OS
- `/admin/growth-platform`, agreements
- `/admin/agency-os` (projects, HVD, tasks/acceptance, SOPs, playbooks, training, roles)

### G10. Ops
- `/admin/invoices`, `/admin/chat`, `/admin/feedback`, `/admin/announcements`, `/admin/challenge/leads`

**Admin pricing path:** Usually bundled into retainer/implementation; optionally sell “intelligence subscription,” “insight add-on,” PPC min + % spend, AMIE report fees.

---

## H. Technical moat (COGS / platform fee)

- PostgreSQL (Drizzle/Neon), auth, crons (growth-os, content-studio, brand-vault, email, market nurture, aee-rollup, behavior-friction, storage-retention, scheduling, etc.)
- Integrations: Brevo, Stripe, DocuSign, ads connectors, Zoom, etc.
- Root **`proxy.ts`**: admin API rate limit (Upstash) + `/community` & `/afn` rewrites to `/Afn`

Roll a **platform fee** into recurring plans to cover hosting, DB, AI tokens.

---

## Continuation ideas for ChatGPT

- Build a **Good / Better / Best** matrix with dollar placeholders by vertical.  
- Map each SKU to **in-scope routes** and **support SLAs**.  
- Add **competitive positioning** vs HubSpot + Hotjar-class + generic agency.  
- Define **overage** for behavior storage / session volume using retention admin as the operational anchor.
